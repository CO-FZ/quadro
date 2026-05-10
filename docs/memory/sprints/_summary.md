# Sprints — Summary

**Última atualização:** 2026-05-09 (Sprints 05/06 fechadas retroativamente; ADR 0004 → Aceito; baseline tsc/lint VERMELHO documentado)

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

## Sprint 05 — Admin Enhancements (Soft-delete, Busca, Bulk Add)

**Status:** 🟡 fechada retroativamente — 2026-05-09. 4/4 CAs verdes; regra §2 ("arquivados não aparecem como assignees") **não implementada** — vira ticket P0 da Sprint 07-B.
**Plano:** [docs/sprints/05/sprint-plan.md](../../sprints/05/sprint-plan.md)
**Story:** [docs/sprints/05/story-05-admin-enhancements.md](../../sprints/05/story-05-admin-enhancements.md)
**Resumo de fase:** [05/_summary.md](05/_summary.md)

**Fechado:** soft-delete (`archived_at` em profiles + UI badge "Arquivado" + grayscale); `archiveUser`/`restoreUser`; last-admin guard estendido para `archiveUser`; busca client-side por email/full_name; bulk add whitelist com parsing `[\n,;]+`; `is_admin()` SECURITY DEFINER (resolve recursão de policies admin de [ADR 0001](../../spec/adr/0001-rbac-via-supabase-rls.md)).

**Aberto:** filtro `archived_at IS NULL` em `app/(app)/kanban/page.tsx` (assignee selector mostra arquivados); ausência de ADR para `is_admin()` (deveria ser ADR 0006 ou revisão do 0001).

## Sprint 06 — Integração Google Sheets

**Status:** 🟡 fechada retroativamente — 2026-05-09. Pipeline funcional ponta-a-ponta; ADR 0004 promovido a `Aceito`; débitos de hardening rastreados.
**Plano:** [docs/sprints/06/sprint-plan.md](../../sprints/06/sprint-plan.md)
**Story:** [docs/sprints/06/story-06-google-sheets-sync.md](../../sprints/06/story-06-google-sheets-sync.md)
**ADR:** [0004 — Google Sheets Sync](../../spec/adr/0004-google-sheets-sync.md) (`Aceito` retroativo)
**Resumo de fase:** [06/_summary.md](06/_summary.md)

**Fechado:** Edge Function `sync-sheets` (Deno + googleapis) cobrindo INSERT/UPDATE/DELETE; database webhook nativo via `pg_net.http_post` em `tasks`; auth via Service Account JSON em secrets; CA-01 e CA-02 verdes; CA-03 parcial (loga erro, sem retry).

**Aberto:** URL e anon key JWT hardcoded em [migration 20260507000005](../../../supabase/migrations/20260507000005_google_sheets_webhook.sql) (vincula ambiente); ausência de retry; logger não estruturado; sem testes da Edge Function; diagnóstico expõe `credential_keys` no body do erro.

---

## ⚠️ Baseline VERMELHO (auditoria 2026-05-09)

Antes de qualquer execução de Sprint 07, dois gates pré-existentes precisam ser destravados — **estão na DoD da Story 07A.1**:

1. **`pnpm exec tsc --noEmit` falha** com 8 erros em `supabase/functions/sync-sheets/index.ts` — arquivo Deno coberto pelo tsconfig do Next desde commit `7c6aa45`. Causa raiz: `tsconfig.json` não exclui `supabase/functions/`.
2. **`pnpm lint` falha** com `react-hooks/set-state-in-effect` em `components/ui/ThemeToggle.tsx:11` (commit `b1e3ce2`, dark mode entregue fora de sprint formal).

Esses dois itens **bloqueiam toda a Sprint 07-A** porque o pre-commit hook proposto requer typecheck + lint verdes. Endereçar como passo 0 da Story 07A.1 (escopo: adicionar `"supabase/functions"` em `tsconfig.exclude` + corrigir o `useEffect` do ThemeToggle).

## Sprint 07-A — Suíte de testes em camadas

**Status:** ⬜ planejada — aguardando Gate 1.
**Plano:** [docs/sprints/07A/sprint-plan.md](../../sprints/07A/sprint-plan.md)
**Stories:**
- [07A.1 — Domain layer tests (Vitest unit)](../../sprints/07A/story-07A.1-domain-tests.md)
- [07A.2 — Integration tests (Vitest + Supabase local)](../../sprints/07A/story-07A.2-integration-tests.md)
- [07A.3 — Feature/E2E (Playwright + screenshot diff mobile)](../../sprints/07A/story-07A.3-feature-tests.md)
- [07A.4 — pgTAP triggers e schema](../../sprints/07A/story-07A.4-pgtap-tests.md)
**ADR:** [0005 — Estratégia de testes em camadas](../../spec/adr/0005-estrategia-de-testes.md) (`proposto` — promover a `aceito` no Gate 1)

**Compromisso:** zerar débito de cobertura 0% acumulado das Sprints 02–06; pagar CA-06 da Sprint 03 (validação visual mobile via screenshot diff Playwright); estabelecer gates `pnpm typecheck && pnpm test:*` no CI.

## Sprint 07-B — Débitos transversais

**Status:** ⬜ planejada — bloqueada por Sprint 07-A.
**Plano:** [docs/sprints/07B/sprint-plan.md](../../sprints/07B/sprint-plan.md)
**Stories:**
- [07B.1 — Logger estruturado (`lib/logger`)](../../sprints/07B/story-07B.1-logger.md)
- [07B.2 — Mapeamento de erro na auth callback + UI domínio privilegiado](../../sprints/07B/story-07B.2-callback-mapping.md)
- [07B.3 — Audit log de role privilegiada + smoke anti-spoofing](../../sprints/07B/story-07B.3-audit-log.md)
- [07B.4 — Fechamento retroativo Sprints 05/06 + ADR 0004 → Aceito](../../sprints/07B/story-07B.4-retroactive-closure.md)

**Compromisso:** fechar débitos não-teste herdados (logger, callback mapping, audit log, fechamento retroativo).

---

## Débitos abertos (após planejamento de 07-A/07-B)

Itens que **não** entram nas Sprints 07-A/07-B e ficam como roadmap pós-v1:

- 🟡 Race-condition do `LAST_ADMIN` (transação real) — aceito como débito documentado.
- 🟡 Sincronização bi-direcional Google Sheets — fora de escopo do PRD v1.
- 🟡 Migração total de mensagens hard-coded para `lib/i18n` — Sprint 07B.2 só migra as 5 críticas.
- 🟡 Trace IDs / correlation IDs no logger.
- 🟡 Idempotência/retry da Edge Function `sync-sheets`.
- 🟡 Audit log para `updateUserRole` (mudança pós-cadastro) — Story 07B.3 só cobre criação automática.
- 🟡 Visual diff em desktop (E2E hoje só mobile).
- 🟢 Alertas/notificações para tarefas atrasadas — roadmap pós-v1 do PRD.
- 🟢 Exportação de relatórios PDF — roadmap pós-v1 do PRD.
