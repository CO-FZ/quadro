# Sprint 02 — Gestão de Tarefas (Kanban + Dashboard)

**Objetivo de sprint:** entregar Kanban interativo mobile-first e Dashboard básico, sobre a fundação de auth/roles da Sprint 01.

**Data de início:** 2026-05-06
**Data de fechamento:** 2026-05-07
**Status:** 🟡 fechada com débitos rastreados (carregados para Sprint 03)
**Resumo de fase:** [docs/memory/sprints/02/_summary.md](../../memory/sprints/02/_summary.md)
**Final Artifact:** [docs/memory/execution/2026-05-07-sprint-02-final.md](../../memory/execution/2026-05-07-sprint-02-final.md)

---

## Story

| ID | Título | Arquivo |
|---|---|---|
| Story 02 | Gestão de Tarefas (Kanban e Dashboard) | [story-02-task-management.md](story-02-task-management.md) |

## ADRs aplicáveis

- [ADR 0001 — RBAC via Supabase RLS](../../spec/adr/0001-rbac-via-supabase-rls.md) (policies de `tasks` e `task_assignees`)

## Já entregue (commit `95f91fd`)

- Migration [`20260506000001_task_management.sql`](../../../supabase/migrations/20260506000001_task_management.sql):
  - Enums `task_sector`, `task_status`.
  - Tabelas `tasks`, `task_assignees`.
  - RLS por papel + alocação.
  - View `user_task_stats` para Dashboard.
- UI:
  - [components/features/KanbanBoard.tsx](../../../components/features/KanbanBoard.tsx)
  - [components/features/TaskCard.tsx](../../../components/features/TaskCard.tsx)
  - [components/features/TaskModal.tsx](../../../components/features/TaskModal.tsx) e [TaskDetailModal.tsx](../../../components/features/TaskDetailModal.tsx)
  - [components/features/DashboardView.tsx](../../../components/features/DashboardView.tsx)
  - [components/features/AppShell.tsx](../../../components/features/AppShell.tsx)
- Rotas em [app/(app)/kanban/](../../../app/(app)/kanban/) e [app/(app)/dashboard/](../../../app/(app)/dashboard/).

## Pendente / pontos a auditar antes de fechar a sprint

- [x] FAB de "Nova Tarefa" só renderiza para `admin`/`coordenador` — `canManage` em [KanbanBoard.tsx:29,134](../../../components/features/KanbanBoard.tsx#L29).
- [ ] **Server Action de criação valida role no servidor** — ❌ não implementado. `createTask`/`updateTask`/`updateTaskStatus`/`archiveTask`/`deleteTask` em [lib/actions/tasks.ts](../../../lib/actions/tasks.ts) só checam `getUser()`. Defesa atual = RLS apenas. **Carregado para Sprint 03 com ADR 0003.**
- [ ] **Cálculo de "Atrasada" centralizado** — ❌ duplicado em [TaskCard.tsx:27](../../../components/features/TaskCard.tsx#L27), [TaskDetailModal.tsx:73](../../../components/features/TaskDetailModal.tsx#L73), [ProfileView.tsx:33](../../../components/features/ProfileView.tsx#L33). **Carregado para Sprint 03.**
- [x] Indicador visual DT/DA no card consistente com paleta do design system.
- [x] Avatares de `profiles.avatar_url` com fallback para iniciais — entregue em commit `f0d806e` via migration `20260507000000_sync_google_metadata.sql` (trigger de sync) + fallback de iniciais em todos os cards/modais.
- [ ] **Optimistic UI ao mover card entre colunas + rollback em erro** — ❌ atualmente `router.refresh()` após Server Action ([KanbanBoard.tsx:67](../../../components/features/KanbanBoard.tsx#L67)). **Carregado para Sprint 03.**
- [ ] **Teste manual mobile (browser subagent)** — ❌ ainda não executado. **Carregado para Sprint 03.**
- [x] Mensagens de erro tipadas / Toast — entregue em commit `f0d806e` via [components/ui/ToastProvider.tsx](../../../components/ui/ToastProvider.tsx) e `ActionResult` discriminado em todas as Server Actions.
- [ ] Sincronização Google Sheets (US-05 do PRD) — fora de escopo, reabre em sprint futura.

## Exit criteria

- [x] Schema + RLS de `tasks` e `task_assignees` em produção
- [x] UI do Kanban e Dashboard funcional ponta-a-ponta em dev
- [ ] Auditoria de role guards em Server Actions — **dívida explícita carregada para Sprint 03 (ADR 0003)**
- [ ] Validação visual mobile com evidências — **dívida explícita carregada para Sprint 03**
- [x] Final Artifact desta sprint produzido — [docs/memory/execution/2026-05-07-sprint-02-final.md](../../memory/execution/2026-05-07-sprint-02-final.md)
- [x] `_summary.md` da Sprint 02 escrito — [docs/memory/sprints/02/_summary.md](../../memory/sprints/02/_summary.md)

> Sprint 02 fecha como **🟡 entregue parcialmente com débitos rastreados**. Itens críticos (role guards Server Action) viram passo 0 da Sprint 03. Itens de polish (helper "atrasada", optimistic UI, screenshot mobile) entram no backlog da Sprint 03.
