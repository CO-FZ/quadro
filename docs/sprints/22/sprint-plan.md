# Sprint 22 — Acesso Universal e Visibilidade de Equipe

**Data:** 2026-05-26  
**Gatilho:** Falha de teste humano — perfil efetivo não vê tarefas/fotos dos demais; não consegue alocar membros nem editar tarefas.

---

## Diagnóstico Técnico

### Causa raiz #1 — RLS `profiles` muito restritiva (bloqueio principal)

```sql
-- Política atual (migration 20260519125842_security_performance_hardening.sql)
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING ((SELECT auth.uid()) = id);
```

**Impacto em cascata:**
- `supabase.from('profiles').select(...)` no kanban retorna só o próprio perfil → lista de membros vazia para efetivo
- View `user_task_stats` JOIN `profiles` → retorna só a própria linha → dashboard sem ranking/stats da equipe
- Join aninhado `task_assignees → profiles` nas queries de tarefas → avatars dos outros membros são NULL
- Fotos do Gmail aparecem corretamente no banco (trigger `on_auth_user_login_sync` funciona) mas o SELECT é bloqueado

### Causa raiz #2 — RLS `task_assignees` INSERT/UPDATE/DELETE restringe efetivo

```sql
-- task_assignees_insert: efetivo só pode auto-alocar ou se for criador da task
-- task_assignees_update: apenas admin/coordenador
-- task_assignees_delete: apenas admin/coordenador
```

Efetivo não consegue alocar outros membros mesmo que a UI permitisse.

### Causa raiz #3 — RLS `tasks UPDATE` restringe efetivo não-assignee

```sql
CREATE POLICY "Atualização de tarefas baseada na role e alocação"
    ON public.tasks FOR UPDATE
    USING (
        role IN ('admin', 'coordenador')  -- OU --
        EXISTS (task_assignees WHERE user_id = auth.uid())
    );
```

Efetivo não alocado na tarefa não consegue editar nenhum campo.

### Causa raiz #4 — `canManage` único boolean bloqueia toda UI de gestão para efetivo

```ts
// KanbanBoard.tsx:184
const canManage = currentUserRole === 'admin' || currentUserRole === 'coordenador'
// usado para: editar, alocar, arquivar, deletar, finalizar — tudo ou nada
```

---

## Modelo de Permissões Alvo (pós-sprint)

| Ação | Efetivo | Coordenador | Admin |
|------|---------|-------------|-------|
| Ver todas as tarefas (dashboard + kanban) | ✅ | ✅ | ✅ |
| Ver perfis + fotos de todos os membros | ✅ | ✅ | ✅ |
| Criar tarefa | ✅ | ✅ | ✅ |
| Editar detalhes da tarefa | ✅ | ✅ | ✅ |
| Alocar/desalocar qualquer membro | ✅ | ✅ | ✅ |
| Mover status (exceto finalizada/arquivada) | ✅ | ✅ | ✅ |
| Mover para **finalizada** | ❌ | ✅ | ✅ |
| **Arquivar** tarefa | ❌ | ✅ | ✅ |
| **Deletar** tarefa | ❌ | ✅ | ✅ |
| Aba Usuários (`/admin`) | ❌ | ❌ | ✅ |

---

## Stories

### Story 22.1 — RLS: Perfis visíveis para todos os autenticados

**Prioridade:** P0 — desbloqueia 22.2, 22.3 e o problema de avatars/dashboard  
**Arquivos afetados:** 1 migration nova

**O que fazer:**
- Criar `supabase/migrations/<timestamp>_relax_profiles_select_policy.sql`
- Dropar `"Users can view own profile"` 
- Criar nova política: todos os autenticados veem perfis não-arquivados

```sql
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view active profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (archived_at IS NULL OR id = (SELECT auth.uid()));
```

> Nota: `OR id = auth.uid()` garante que o próprio usuário veja seu perfil mesmo se arquivado (ex.: tela de logout).

**Critérios de aceite:**
- [ ] Kanban: profiles list retorna todos os membros ativos para efetivo
- [ ] TaskCard: avatars dos outros assignees aparecem para efetivo
- [ ] Dashboard: `user_task_stats` retorna ranking com todos os membros
- [ ] Admin page: perfis arquivados ainda visíveis no painel admin (admin vê por `id = auth.uid()` rule + owns admin query via service role? verificar)

**Atenção:** O AdminView faz `supabase.from('profiles').select(...)` sem filtro de `archived_at` para listar usuários arquivados. Confirmar que a nova política não quebra essa listagem (admin precisa ver arquivados também). Se quebrar, adicionar política separada para admin.

---

### Story 22.2 — RLS + App: Efetivo aloca qualquer membro em tarefas

**Prioridade:** P0  
**Arquivos afetados:** 1 migration, `use-cases.ts`, `TaskDetailModal.tsx`

**O que fazer:**

**2a. Migration:** relaxar `task_assignees` INSERT/UPDATE/DELETE

```sql
-- task_assignees_insert: qualquer autenticado pode alocar qualquer user_id
DROP POLICY IF EXISTS "task_assignees_insert" ON public.task_assignees;
CREATE POLICY "task_assignees_insert"
    ON public.task_assignees FOR INSERT TO authenticated
    WITH CHECK (true);

-- task_assignees_update e delete: qualquer autenticado
DROP POLICY IF EXISTS "task_assignees_update" ON public.task_assignees;
CREATE POLICY "task_assignees_update"
    ON public.task_assignees FOR UPDATE TO authenticated
    USING (true);

DROP POLICY IF EXISTS "task_assignees_delete" ON public.task_assignees;
CREATE POLICY "task_assignees_delete"
    ON public.task_assignees FOR DELETE TO authenticated
    USING (true);
```

**2b. use-cases.ts:57-66** — remover `requirePrivileged()` de `updateTaskAssignees()`

```ts
// ANTES
export async function updateTaskAssignees(taskId: string, userIds: string[]) {
  const { userId } = await requirePrivileged()  // ← remover
  ...
}

// DEPOIS
export async function updateTaskAssignees(taskId: string, userIds: string[]) {
  const caller = await getCallerRole()
  if (!caller.userId) throw new AppError('UNAUTHENTICATED')
  ...
}
```

**2c. TaskDetailModal.tsx:127** — mostrar checkboxes de assignees para todos os roles (não só `canManage`)

Introduzir prop/flag separada `canAssign={true}` (ou usar novo `canEdit` da Story 22.3).

**Critérios de aceite:**
- [ ] Efetivo consegue abrir TaskDetailModal e ver checkboxes de assignees
- [ ] Efetivo consegue marcar/desmarcar qualquer membro
- [ ] Server action não retorna erro de permissão
- [ ] Coordenador e admin: comportamento inalterado

---

### Story 22.3 — App layer: Efetivo edita detalhes da tarefa

**Prioridade:** P1 (depende de 22.1 para ver profiles nos dropdowns)  
**Arquivos afetados:** 1 migration, `use-cases.ts`, `KanbanBoard.tsx`, `TaskDetailModal.tsx`

**O que fazer:**

**3a. Migration:** relaxar `tasks UPDATE`

```sql
DROP POLICY IF EXISTS "Atualização de tarefas baseada na role e alocação" ON public.tasks;
CREATE POLICY "tasks_update"
    ON public.tasks FOR UPDATE TO authenticated
    USING (true);
```

**3b. use-cases.ts:32-40** — remover role check de `updateTask()`

```ts
// ANTES: if (!['admin','coordenador'].includes(role)) throw FORBIDDEN
// DEPOIS: qualquer autenticado pode editar
```

**3c. Refatorar `canManage` → três flags em KanbanBoard.tsx**

```ts
// KanbanBoard.tsx:184 — substituir por:
const canEdit     = true  // todos podem editar detalhes e alocar
const canAssign   = true
const canFinalize = currentUserRole === 'admin' || currentUserRole === 'coordenador'
```

Passar `canEdit`, `canAssign`, `canFinalize` para TaskDetailModal e TaskCard (canDrag já usa `canManage || isAssignee` — ajustar).

**3d. TaskDetailModal.tsx** — usar flags corretas por bloco:

| Bloco | Flag |
|-------|------|
| Checkboxes assignees (linha 127) | `canAssign` |
| Botão Editar / EditTaskModal (linha 209) | `canEdit` |
| Botão Arquivar (linha 264) | `canFinalize` |
| Botão Deletar (linha 283) | `canFinalize` |
| Transições de status | `canEdit` (exceto → finalizada/arquivada: `canFinalize`) |

**Critérios de aceite:**
- [ ] Efetivo: vê e usa botão Editar em qualquer tarefa
- [ ] Efetivo: não vê botões Arquivar / Deletar
- [ ] Efetivo: não consegue mover tarefa para Finalizada (drag bloqueado)
- [ ] Efetivo: não vê botão "Finalizar" no modal de status
- [ ] Coordenador: comportamento anterior preservado (vê e usa todos os controles exceto /admin)
- [ ] pnpm typecheck passa sem erros

---

### Story 22.4 — ADR 0013: Revisão do Modelo de Permissões RBAC

**Prioridade:** P2 (docs, sem código)  
**Arquivo:** `docs/spec/adr/0013-revisao-permissoes-efetivo.md`

Documenta:
- Decisão de permitir efetivo editar tarefas e alocar membros
- Decisão de manter finalizar/arquivar/deletar restrito a coordenador+admin
- Decisão de tornar perfis visíveis a todos os autenticados
- Motivo: falha de usabilidade detectada em teste humano de 2026-05-26
- Alternativa rejeitada: criar role intermediário entre efetivo e coordenador

---

## Ordem de Execução Recomendada

```
22.1 (RLS profiles)
  └─► 22.2 (RLS task_assignees + use-cases)
        └─► 22.3 (RLS tasks + canManage refactor)
              └─► 22.4 (ADR)
```

22.1 desbloqueia todos — executar primeiro e validar dashboard/kanban antes de seguir.

---

## ADRs Impactados

| ADR | Título | Impacto |
|-----|--------|---------|
| 0001 | RBAC via Supabase RLS | Políticas de profiles e task_assignees relaxadas |
| 0003 | Defesa em Camadas | Camada use-cases perde guards de updateTask e updateTaskAssignees |
| 0009 | Centralização Guards | requirePrivileged removido de updateTaskAssignees |

Nenhum ADR é violado — todos permitem evolução da política. ADR 0013 documenta a mudança.

---

## Checklist Pré-PR

- [ ] `pnpm typecheck` passou
- [ ] `pnpm lint` passou  
- [ ] `pnpm test:unit` passou
- [ ] Teste manual: login com conta efetivo, verificar dashboard, kanban, edição de tarefa, alocação
- [ ] Teste manual: login com conta coordenador, verificar que finalizar/arquivar funciona
- [ ] Teste manual: login com conta admin, verificar que /admin continua restrito aos demais
- [ ] Screenshots das três perspectivas de role anexadas ao PR
