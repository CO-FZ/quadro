# ADR 0003 — Defesa em camadas para Tasks + criação universal

**Status:** aceito
**Data:** 2026-05-07
**Aprovado em:** 2026-05-07
**Decisores:** Eng Carlos Eduardo
**Substitui:** —
**Substituído por:** —
**Relaciona-se com:** [ADR 0001 — RBAC via Supabase RLS](0001-rbac-via-supabase-rls.md) (complementa, não substitui)

---

## Contexto

A Sprint 02 entregou Server Actions de tarefas (`createTask`, `updateTask`, `updateTaskStatus`, `archiveTask`, `deleteTask` em [lib/actions/tasks.ts](../../../lib/actions/tasks.ts)) que dependem **exclusivamente** de RLS para autorização. Isso introduz duas dores:

1. **Frágil em caso de regressão.** Se uma migration futura desabilitar RLS de `tasks` por engano (ex.: durante debug), qualquer authenticated passa a poder criar/editar/deletar qualquer tarefa. RLS é a única tranca, e [ADR 0001 §"Consequências negativas"](0001-rbac-via-supabase-rls.md) já reconhece que mensagens de erro de RLS são opacas — UX precisa mapear, e segurança fica frágil.
2. **Modelo atual de criação é mais restritivo do que o produto pede.** A policy de INSERT em `tasks` atualmente exige role `admin` ou `coordenador` ([migration 20260506000001 L54](../../../supabase/migrations/20260506000001_task_management.sql#L54)). Decisão de produto em 2026-05-07: **qualquer membro autenticado pode criar tarefa para si**, registrando-se como assignee inicial. Coordenadores e admins continuam como únicos a editar metadados ou deletar tarefas, mas a criação deixa de ser privilégio.

Existem duas decisões coesas neste ADR (são tratadas juntas porque ambas afetam o modelo de autorização de `tasks`):

### Decisão A — Defesa em camadas (RLS + Server Action role guard)

Adicionar verificação de role **server-side em Server Actions** para operações destrutivas/sensíveis (`updateTask`, `archiveTask`, `deleteTask`), mantendo RLS como gate autoritativo no banco. UPDATE de status (`updateTaskStatus`) **não** ganha role guard de aplicação — RLS já cobre via política de UPDATE que aceita `admin`, `coordenador` ou alocado, e bloquear isso na aplicação quebraria o fluxo de efetivos movendo as próprias tarefas no Kanban.

### Decisão B — Criação universal de tarefas

Relaxar a policy de INSERT em `tasks` para permitir qualquer authenticated, com `WITH CHECK (created_by = auth.uid())` impedindo spoofing de criador. Permitir self-assign em `task_assignees` (INSERT por authenticated quando `user_id = auth.uid()`), de modo que a Server Action `createTask` possa auto-alocar o criador.

---

## Decisão

### A. Helper `requireRole` em `lib/auth/require-role.ts`

```ts
// Pseudocódigo — assinatura final
export async function requireRole(
  allowed: AppRole[]
): Promise<{ ok: false; code: 'UNAUTHENTICATED' | 'FORBIDDEN'; message: string } | null>
```

- Retorna `null` se autorizado.
- Memoizado por request via `cache()` do React — evita N SELECTs em `profiles` quando a action faz múltiplos checks.
- Aplicado em `updateTask`, `archiveTask`, `deleteTask`, `updateTaskAssignees` com `allowed = ['admin','coordenador']`.
- **Aplicado condicionalmente em `updateTaskStatus`** quando o status alvo é `'finalizada'` — só admin/coord podem **concluir** uma atividade. Outras transições de status seguem livres (RLS valida assignee/coord/admin).
- **Não** aplicado em `createTask` (qualquer authenticated cria).

### B. Migration que relaxa policies de criação

[`supabase/migrations/20260507000001_relax_task_insert_policy.sql`](../../../supabase/migrations/20260507000001_relax_task_insert_policy.sql):

| Tabela | Policy antiga (drop) | Policy nova |
|---|---|---|
| `tasks` | `Admins e Coordenadores podem criar tarefas` (role IN admin/coord) | `Authenticated cria a própria tarefa` — `TO authenticated WITH CHECK (created_by = auth.uid())` |
| `task_assignees` | mantida `Admins e Coordenadores gerenciam alocações` (ALL) | adicionada `Authenticated pode se auto-alocar` — `FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())` |

**Importante:** UPDATE/DELETE em `tasks` continuam exigindo `admin`/`coordenador` ou alocação — não mudam. Apenas INSERT de `tasks` e self-INSERT em `task_assignees` são relaxados.

### C. Histórico de criação

`tasks.created_by` registra quem criou inicialmente a atividade. **Coluna imutável** — `WITH CHECK (created_by = auth.uid())` no INSERT impede spoofing; `updateTask` não toca `created_by`. Exibido no `TaskDetailModal` como "Criada por &lt;nome&gt;".

A criação **não** auto-aloca o criador como assignee. Tarefa nasce em `backlog` se sem assignees, ou `alocada` se o criador escolheu assignees no modal.

### Mapa final de policies de `tasks` (pós-ADR)

| Operação | Quem (RLS) | Server Action role guard adicional |
|---|---|---|
| SELECT | qualquer authenticated | — |
| INSERT | authenticated com `created_by = auth.uid()` | — (RLS é suficiente) |
| UPDATE (metadados) | admin, coord, alocado | `requireRole(['admin','coordenador'])` em `updateTask`/`archiveTask` |
| UPDATE (status → finalizada) | admin, coord, alocado | `requireRole(['admin','coordenador'])` em `updateTaskStatus` |
| UPDATE (status → outros) | admin, coord, alocado | — (RLS cobre) |
| DELETE | admin, coord | `requireRole(['admin','coordenador'])` em `deleteTask` |

---

## Consequências

**Positivas**

- **Falha em modo seguro.** Se RLS for desabilitada por engano, ações destrutivas (`updateTask`/`archiveTask`/`deleteTask`) continuam barradas pelo `requireRole`. Criação volta a ser livre, mas isso é o estado pretendido pelo produto.
- **Mensagens de erro tipadas.** `requireRole` retorna `{ code: 'FORBIDDEN' }` antes de bater no banco — Toast no client mostra texto amigável.
- **Criação democratizada** alinha o produto com a realidade da Comissão (membros precisam registrar próprias atividades sem esperar coordenação).
- **`WITH CHECK (created_by = auth.uid())`** é defesa contra spoofing — atacante não consegue criar tarefa em nome de outro mesmo via REST direto.

**Negativas**

- **Custo extra de SELECT em `profiles`** por Server Action destrutiva. Mitigado por `cache()` do React (1 SELECT por request mesmo com N actions).
- **Duplicação de regra entre RLS e aplicação.** `updateTask` agora tem dois gates que precisam estar coerentes. Se um dia a regra mudar (ex.: "líder de divisão também pode editar"), os dois lugares precisam ser tocados. Aceito como custo da defesa em profundidade.
- **Modelo "criação universal" pode gerar lixo no Kanban** se efetivos criarem tarefas frívolas. Mitigação social, não técnica: tarefas mal-criadas podem ser arquivadas/excluídas por admin/coord.

---

## Riscos conhecidos a fechar

- [ ] Adicionar log estruturado quando `requireRole` retorna `FORBIDDEN` — sinal de tentativa não autorizada (UI já filtra, então hit aqui é provável bypass).
- [ ] Auditar se outras Server Actions criadas no futuro lembram de aplicar `requireRole`. Não há linter para isso hoje. Proposta: adicionar comentário-padrão `// requireRole(['admin','coordenador']) — defesa em camadas (ADR 0003)` nos templates.
- [ ] Validar via curl com JWT de efetivo que `WITH CHECK (created_by = auth.uid())` realmente impede spoofing — incluir no smoke test da story.
- [ ] Definir política se admin único se rebaixa (fora de escopo desta sprint, vira ADR futuro).

---

## Alternativas rejeitadas

- **Apenas RLS (status quo).** Rejeitado pelos motivos do "Contexto" — frágil em regressão e mensagens opacas.
- **Apenas `requireRole` em aplicação, RLS aberta.** Rejeitado — ADR 0001 já estabelece RLS como camada autoritativa; remover quebra simetria com clientes mobile/CLI futuros.
- **`requireRole` em todas as actions, inclusive `createTask` e `updateTaskStatus`.** Rejeitado — `createTask` não tem regra de role (qualquer authenticated cria); `updateTaskStatus` precisa permitir assignees, e RLS já implementa essa lógica corretamente. Adicionar guard de aplicação aqui seria mais rígido que RLS, quebrando o fluxo Kanban.
- **Manter "Admins e Coordenadores criam tarefas" e expor "Solicitação de tarefa" como entidade separada para efetivos.** Rejeitado — overengineering para o estado atual do produto. A Comissão funciona com fluxo plano de criação; quem cria já é responsável.

---

## Implementação

Implementado na Sprint 03, Story 03 — ver [docs/sprints/03/story-03-tasks-hardening.md](../../sprints/03/story-03-tasks-hardening.md).

Arquivos:

- [`supabase/migrations/20260507000001_relax_task_insert_policy.sql`](../../../supabase/migrations/20260507000001_relax_task_insert_policy.sql) — migration B.
- [`lib/auth/require-role.ts`](../../../lib/auth/require-role.ts) — helper A.
- [`lib/actions/tasks.ts`](../../../lib/actions/tasks.ts) — aplicação dos guards.
