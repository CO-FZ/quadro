# Sprint 02 — Gestão de Tarefas (Kanban + Dashboard)

**Objetivo de sprint:** entregar Kanban interativo mobile-first e Dashboard básico, sobre a fundação de auth/roles da Sprint 01.

**Data de início:** 2026-05-06
**Status:** 🟡 código UI entregue / pendente refinamento e validação

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

- [ ] Confirmar que o FAB de "Nova Tarefa" só renderiza para `admin`/`coordenador` e que a Server Action correspondente valida role no servidor (US04 da Sprint 01).
- [ ] Cálculo de "Atrasada" centralizado (helper único, não recalculado em cada componente).
- [ ] Indicador visual DT/DA no card consistente com paleta do design system.
- [ ] Avatares vindos de `profiles.avatar_url` (Google) com fallback para iniciais.
- [ ] Optimistic UI ao mover card entre colunas + rollback em erro.
- [ ] Teste manual mobile (browser subagent) capturando screenshots — `app/(app)/kanban/` e `app/(app)/dashboard/`.
- [ ] Sincronização Google Sheets (US-05 do PRD) — fica fora desta sprint, reabre em Sprint 04+.

## Exit criteria

- [x] Schema + RLS de `tasks` e `task_assignees` em produção
- [x] UI do Kanban e Dashboard funcional ponta-a-ponta em dev
- [ ] Auditoria de role guards em Server Actions
- [ ] Validação visual mobile com evidências
- [ ] Final Artifact desta sprint produzido
- [ ] `_summary.md` da Sprint 02 escrito ao fechar
