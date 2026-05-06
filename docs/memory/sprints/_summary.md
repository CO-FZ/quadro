# Sprints — Summary

**Última atualização:** 2026-05-06

> Index acumulativo das sprints. Cada sprint mantém seu próprio plano em `docs/sprints/<n>/sprint-plan.md`. Resumos detalhados de execução (por story, por dia) ficam em `docs/memory/execution/`.

---

## Sprint 01 — Gestão de Usuários, Roles e Whitelist

**Status:** 🟡 entregue parcialmente
**Plano:** [docs/sprints/01/sprint-plan.md](../../sprints/01/sprint-plan.md)
**Story:** [docs/sprints/01/story-01-user-management.md](../../sprints/01/story-01-user-management.md)
**Execução registrada:** [../execution/2026-05-06-bootstrap-auth.md](../execution/2026-05-06-bootstrap-auth.md)

**Fechado:** US05 (trigger de role default), schema + RLS de `whitelist`/`profiles`, clients SSR, `proxy.ts`, login Google.
**Aberto:** UI Admin para Whitelist e roles (US01–US03), guarda "último admin", mapeamento de erros RLS.

## Sprint 02 — Gestão de Tarefas (Kanban + Dashboard)

**Status:** 🟡 código entregue, validação pendente
**Plano:** [docs/sprints/02/sprint-plan.md](../../sprints/02/sprint-plan.md)
**Story:** [docs/sprints/02/story-02-task-management.md](../../sprints/02/story-02-task-management.md)

**Fechado:** schema `tasks`/`task_assignees` + RLS + view `user_task_stats`; UI Kanban, Dashboard, AppShell, modais de tarefa.
**Aberto:** auditoria de role guards no FAB e Server Actions de criação, helper centralizado de "Atrasada", testes mobile com browser subagent, optimistic UI no drag-and-drop.

## Sprint 03 (próxima — não iniciada)

Candidatos:
1. UI Admin para Whitelist + roles (fecha Sprint 01).
2. Hardening de role guards e mensagens de erro tipadas (paga dívida transversal das duas sprints).
3. Sincronização Google Sheets (US-05 do PRD) — exige ADR próprio antes.

A escolha é do humano. Próxima sessão começa com **Plan Artifact obrigatório** ([AGENTS.md §5](../../../AGENTS.md)).
