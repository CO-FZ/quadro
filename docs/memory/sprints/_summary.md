# Sprints — Summary

**Última atualização:** 2026-05-07

> Index acumulativo das sprints. Cada sprint mantém seu próprio plano em `docs/sprints/<n>/sprint-plan.md`. Resumos de fase ficam em `docs/memory/sprints/<n>/_summary.md`. Logs detalhados de execução em `docs/memory/execution/`.

---

## Sprint 01 — Gestão de Usuários, Roles e Whitelist

**Status:** 🟡 fechada com débitos rastreados (UI Admin entregue retroativamente em `f0d806e`)
**Plano:** [docs/sprints/01/sprint-plan.md](../../sprints/01/sprint-plan.md)
**Story:** [docs/sprints/01/story-01-user-management.md](../../sprints/01/story-01-user-management.md)
**Execução registrada:** [../execution/2026-05-06-bootstrap-auth.md](../execution/2026-05-06-bootstrap-auth.md)

**Fechado:** US05 (trigger de role default), schema + RLS de `whitelist`/`profiles`, clients SSR, `proxy.ts`, login Google. UI Admin de Whitelist + roles entregue em commit `f0d806e` (documentado retroativamente).
**Aberto:** guarda "último admin" em código, mapeamento de erros RLS na callback, ADR 0003 (defesa em camadas) — todos carregados para Sprint 03.

## Sprint 02 — Gestão de Tarefas (Kanban + Dashboard)

**Status:** 🟡 fechada com débitos rastreados — 2026-05-07
**Plano:** [docs/sprints/02/sprint-plan.md](../../sprints/02/sprint-plan.md)
**Story:** [docs/sprints/02/story-02-task-management.md](../../sprints/02/story-02-task-management.md)
**Resumo de fase:** [02/_summary.md](02/_summary.md)
**Final Artifact:** [../execution/2026-05-07-sprint-02-final.md](../execution/2026-05-07-sprint-02-final.md)

**Fechado:** schema `tasks`/`task_assignees` + RLS + view `user_task_stats`; UI Kanban, Dashboard, AppShell, modais; status `arquivada`; avatares com fallback (commit `f0d806e`); Toast tipado (commit `f0d806e`); sync `full_name`/`avatar_url` via trigger Google.
**Aberto (carregado para Sprint 03):** role guards server-side em Server Actions de tasks (passo 0 com ADR 0003), helper único de "Atrasada", optimistic UI no drag-and-drop, validação visual mobile com browser subagent.

## Sprint 03 — Hardening + ADR 0003 (em planejamento)

**Status:** ⬜ planejamento — Plan Artifact pendente de aprovação humana (Gate 1)
**Plano:** [docs/sprints/03/sprint-plan.md](../../sprints/03/sprint-plan.md) (a criar)
**Story:** [docs/sprints/03/story-03-tasks-hardening.md](../../sprints/03/story-03-tasks-hardening.md) (a criar)
**Execuções retroativas:** [../execution/2026-05-07-f0d806e-retroativo.md](../execution/2026-05-07-f0d806e-retroativo.md)

**Escopo previsto:**

1. ADR 0003 — defesa em camadas (RLS + Server Action role guard).
2. `requireRole` server-side em todas as Server Actions de tasks.
3. Helper único `lib/utils/task-status.ts` (atrasada).
4. `useOptimistic` no drag-and-drop do Kanban + rollback.
5. Validação visual mobile com browser subagent + screenshots em `docs/memory/execution/`.

**Já entregue retroativamente em `f0d806e` (escopo (a) + dívida 02):** UI Admin Whitelist/roles, UI Profile, Toast, archived, sync Google.

**Próxima sessão começa com Plan Artifact (Gate 1) obrigatório.**
