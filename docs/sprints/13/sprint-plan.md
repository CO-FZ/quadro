# Sprint 13: Alertas e Auditoria

## Meta

Fechar dois itens V2 P1 do roadmap: (1) indicador de tarefas atrasadas no Dashboard — o Kanban já exibe o badge "Atrasada" por tarefa, mas não há métrica agregada; (2) audit log de mudança de role pós-cadastro — `updateUserProfile` já guarda last-admin guard mas não registra histórico de quem alterou a role de quem.

---

## Stories

### [Story 13.1] Dashboard — Contador de tarefas atrasadas

**Objetivo:** Adicionar KPI card "Atrasadas" ao Dashboard com contagem de tarefas ativas vencidas.

**Contexto:** `TaskCard` já exibe "⚠ Atrasada" (via `isOverdue()`). Falta o agregado no Dashboard. A query atual em `dashboard/page.tsx` busca apenas `status` e `sector` das tasks; basta adicionar `end_date` e computar o overdue count no servidor.

**Escopo técnico:**

- `app/(app)/dashboard/page.tsx`:
  - Adicionar `end_date` à coluna selecionada em `taskCounts`
  - Computar `overdueCount`: tasks onde `status NOT IN ('finalizada', 'arquivada')` e `end_date < hoje`
  - Passar `overdueCount` ao `DashboardView`

- `components/features/DashboardView.tsx`:
  - Adicionar `overdueCount: number` à interface `DashboardViewProps`
  - Novo KPI card "Atrasadas" (cor destrutiva, ícone ⚠) após os cards de status

**Arquivos afetados:**

- `app/(app)/dashboard/page.tsx`
- `components/features/DashboardView.tsx`

**Critério de aceite:**

- Card "Atrasadas" exibe contagem correta (0 quando nenhuma tarefa vencida)
- Exclui `is_servico = true` (consistente com o resto do Dashboard)
- `pnpm typecheck` passa

---

### [Story 13.2] Audit log de mudança de role pós-cadastro

**Objetivo:** Registrar toda mudança de role feita pelo admin em `updateUserProfile`, com quem mudou, para quem, e qual foi a mudança.

**Contexto:** `privileged_role_audit` só registra a role na criação inicial (trigger). Mudanças pós-cadastro via `AdminView` + `updateUserProfile` não são auditadas. Isso é dívida V2 P1 documentada no roadmap.

**Escopo técnico:**

- **Migration** `20260519_add_role_change_audit.sql`:
  - Criar `public.role_change_audit` (append-only):
    - `id UUID PK`, `target_profile_id UUID FK profiles`, `actor_profile_id UUID FK profiles`, `old_role app_role`, `new_role app_role`, `created_at TIMESTAMPTZ`
  - RLS: só admin lê; ninguém pode inserir/atualizar diretamente (server action insere via service role implicitamente ou via `SECURITY DEFINER`)
  - Índices: `target_profile_id`, `actor_profile_id`, `created_at DESC`

- `lib/actions/admin.ts` — `updateUserProfile()`:
  - Ler role atual ANTES do update
  - Se `current.role !== data.role`: inserir em `role_change_audit` (best-effort, sem bloquear update em caso de falha)
  - `getUser()` para obter `actor_profile_id`

- `lib/supabase/types.ts`:
  - Adicionar interface `RoleChangeAuditEntry`

- `components/features/AdminView.tsx`:
  - Exibir histórico de mudanças de role no `EditModal` (lista compacta, últimas 5 entradas)
  - Buscar via nova server action `getRoleChangeAudit(userId)` em `admin.ts`

**Arquivos afetados:**

- `supabase/migrations/20260519_add_role_change_audit.sql` *(novo)*
- `lib/actions/admin.ts`
- `lib/supabase/types.ts`
- `components/features/AdminView.tsx`

**Critério de aceite:**

- Ao mudar role via AdminView, novo registro aparece em `role_change_audit`
- Falha no INSERT de audit não bloqueia a mudança de role
- `pnpm typecheck` e `pnpm lint` passam

---

## Dependências entre Stories

`13.1` e `13.2` são independentes — podem ser implementadas em paralelo.

## Ordem de execução

1. **13.1** (2 arquivos, sem schema — baixo risco)
2. **13.2** (migration + 4 arquivos — médio risco)

---

## Estimativa de esforço

| Story | Complexidade | Justificativa                                               |
| ----- | ------------ | ----------------------------------------------------------- |
| 13.1  | Baixa        | Adicionar `end_date` à query + 1 card no componente         |
| 13.2  | Média        | Nova tabela + lógica de audit em server action + UI no modal |

---

## Status da Sprint

- **Início:** 19/05/2026
- **Conclusão:** 19/05/2026
- **Status Atual:** **CONCLUÍDA**
- **Stories entregues:** 13.1 ✅ 13.2 ✅
- **Riscos Mitigados:**
  - 13.1: overdue count computado no servidor com `ACTIVE_STATUSES` set — consistente com `isOverdue()` do domínio.
  - 13.2: `user.id` bate com `profiles.id` por relação 1:1 garantida pelo schema. Audit insert em best-effort: falha logada via `logger.warn`, não bloqueia o update.
