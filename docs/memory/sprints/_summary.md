# Sprints — Summary

**Última atualização:** 2026-05-07 (Sprint 04 fechada)

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

## Sprint 04 — Whitelist com role + last-admin guard + pendentes

**Status:** 🟡 entregue com ressalva — 2026-05-07. Smoke multi-persona pendente humano.
**Plano:** [docs/sprints/04/sprint-plan.md](../../sprints/04/sprint-plan.md)
**Story:** [docs/sprints/04/story-04-whitelist-roles.md](../../sprints/04/story-04-whitelist-roles.md)
**ADR:** [0002 (rev) — Whitelist trigger](../../spec/adr/0002-whitelist-emails-trigger.md)
**Resumo de fase:** [04/_summary.md](04/_summary.md)
**Final Artifact:** [../execution/2026-05-07-sprint-04-final.md](../execution/2026-05-07-sprint-04-final.md)

**Fechado:** coluna `default_role` em `whitelist`; trigger `handle_new_user` reescrito com lookup (email > domínio > fallback efetivo); form de adição com select de role; guard `LAST_ADMIN` em `updateUserRole`; badge "Pendente" para entries sem profile. Migration aplicada via `db push` (sem reset). 6/6 migrations sincronizadas.

**Aberto:** smoke multi-persona; UI de aviso para domínio com role privilegiada; audit log de role ≠ efetivo; race condition do `LAST_ADMIN` aceita como débito.

## Sprint 03 — Hardening + ADR 0003 + criação universal

**Status:** 🟡 entregue com ressalvas — 2026-05-07. Decisão "quem finaliza" e validação mobile aguardam confirmação humana.
**Plano:** [docs/sprints/03/sprint-plan.md](../../sprints/03/sprint-plan.md)
**Story:** [docs/sprints/03/story-03-tasks-hardening.md](../../sprints/03/story-03-tasks-hardening.md)
**ADR:** [0003 — defesa em camadas + criação universal](../../spec/adr/0003-defesa-em-camadas-tasks.md)
**Resumo de fase:** [03/_summary.md](03/_summary.md)
**Final Artifact:** [../execution/2026-05-07-sprint-03-final.md](../execution/2026-05-07-sprint-03-final.md)

**Fechado:** ADR 0003 aceito; migration relaxa INSERT de `tasks`; `requireRole` em ações destrutivas; gate condicional em `updateTaskStatus` para `finalizada`; helper `isOverdue` único; `useOptimistic` no Kanban com transição CSS suave; histórico "Criada por" no detalhe; favicon CO-FZ via `app/icon.png`. `tsc --noEmit` e `pnpm lint` passam.

**Aberto:** confirmar admin+coord vs apenas coord para conclusão; smoke manual com 3 personas; validação visual mobile (browser subagent indisponível); aplicar migration em ambiente remoto.
