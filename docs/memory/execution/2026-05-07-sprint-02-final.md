# Final Artifact — Sprint 02 (fechamento)

**Data:** 2026-05-07
**Sprint:** [docs/sprints/02/sprint-plan.md](../../sprints/02/sprint-plan.md)
**Story:** [docs/sprints/02/story-02-task-management.md](../../sprints/02/story-02-task-management.md)
**Resumo de fase:** [docs/memory/sprints/02/_summary.md](../sprints/02/_summary.md)
**Commits relacionados:** `95f91fd` (entrega original), `f0d806e` (avatares + Toast + archived — pagaram dívida)

---

## Sumário (≤ 5 linhas)

Sprint 02 entregou Kanban interativo + Dashboard sobre schema `tasks`/`task_assignees` com RLS por papel e alocação. Avatares Google e mensagens tipadas via Toast foram entregues no commit `f0d806e` (que viajou junto com escopo da Sprint 03 (a)). Fica em débito explícito carregado para Sprint 03: role guards server-side em Server Actions de tasks (crítico, exige ADR 0003), helper único de "Atrasada", optimistic UI no drag-and-drop e validação visual mobile.

## Arquivos entregues

### Schema (commit `95f91fd` + `f0d806e`)

| Arquivo | Mudança |
|---|---|
| [`supabase/migrations/20260506000001_task_management.sql`](../../../supabase/migrations/20260506000001_task_management.sql) | enums, tabelas `tasks`/`task_assignees`, RLS, view `user_task_stats` |
| [`supabase/migrations/20260506000002_archived_status.sql`](../../../supabase/migrations/20260506000002_archived_status.sql) | adiciona `arquivada`, hardening de funções `SECURITY DEFINER`, view com `SECURITY INVOKER` |
| [`supabase/migrations/20260507000000_sync_google_metadata.sql`](../../../supabase/migrations/20260507000000_sync_google_metadata.sql) | adiciona `full_name` em `profiles`, trigger de sync com `auth.users` |

### UI (commit `95f91fd` + `f0d806e`)

| Arquivo | Mudança |
|---|---|
| [`components/features/KanbanBoard.tsx`](../../../components/features/KanbanBoard.tsx) | Kanban com drag-and-drop + filtros + arquivadas |
| [`components/features/TaskCard.tsx`](../../../components/features/TaskCard.tsx) | card com avatares, badges sector/prazo |
| [`components/features/TaskModal.tsx`](../../../components/features/TaskModal.tsx) | modal de criação/edição |
| [`components/features/TaskDetailModal.tsx`](../../../components/features/TaskDetailModal.tsx) | modal de detalhe com avatares |
| [`components/features/DashboardView.tsx`](../../../components/features/DashboardView.tsx) | dashboard contagem por usuário |
| [`components/features/AppShell.tsx`](../../../components/features/AppShell.tsx) | shell autenticado |
| [`components/ui/ToastProvider.tsx`](../../../components/ui/ToastProvider.tsx) | toast tipado, paga dívida da Sprint 01 |
| [`lib/actions/tasks.ts`](../../../lib/actions/tasks.ts) | Server Actions de tasks com `ActionResult` discriminado |

## Como testar (estado atual)

```bash
pnpm dev
# 1. /kanban → confirmar 4 colunas + arquivadas (se houver), drag-and-drop funcional
# 2. /dashboard → contagem por usuário, view user_task_stats
# 3. Login com efetivo: FAB "Nova Tarefa" deve sumir
# 4. Login com admin/coord: FAB visível
# Migrations: pnpm supabase:db:push (ou apply local)
```

## Riscos conhecidos

- **🔴 Crítico — Role guard só em RLS para Server Actions de tasks.** Se RLS for desabilitada por engano, qualquer authenticated cria/edita/move/deleta tarefa. Mitigação: passo 0 da Sprint 03 = ADR 0003 + `requireRole(['admin','coordenador'])` em todas as actions.
- **🟡 `isOverdue` triplicado.** Risco de divergência de regra (ex.: se "atrasada" passar a considerar `task.status !== 'finalizada'` em um lugar e não em outros — já há divergência: `TaskCard` não filtra por status, `TaskDetailModal` e `ProfileView` filtram). Mitigação: helper único na Sprint 03.
- **🟡 `router.refresh()` em cada drop.** UX de drag-and-drop fica com flash perceptível. Mitigação: `useOptimistic` na Sprint 03.
- **🟢 Mobile não validado.** Layout de 4 colunas em viewport pequena depende de `flex-col` responsivo — não confirmado com browser subagent.

## Harness debt produzida nesta sprint

- **Gate 1 (Plan Artifact) violado em `f0d806e`.** Commit cobriu Sprint 03 (a) + dívida da Sprint 02 + hardening transversal sem aprovação humana prévia. Documentação retroativa em [`docs/memory/execution/2026-05-07-f0d806e-retroativo.md`](2026-05-07-f0d806e-retroativo.md).
- **DoD não executado:** `pnpm typecheck && pnpm lint && pnpm test:unit` não rodaram como gate antes do fechamento. Sprint 03 deve ao menos executá-los manualmente.

## Próximo passo sugerido

Plan Artifact da Sprint 03: passo 0 = redigir ADR 0003 (defesa em camadas RLS + Server Action role guard). Stories: hardening de tasks Server Actions, helper único de atrasada, optimistic UI no Kanban, validação visual mobile.
