# Sprints — Summary

**Última atualização:** 2026-05-17 (Sprint 11 reconcilia 07-C retroativamente; Sprints 08/09/10 documentadas; débitos P0 da 07-C movidos para "fechados")

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

**Status:** 🟡 fechada retroativamente — 2026-05-09 (`_summary.md`) / 2026-05-10 (Final Artifact). 4/4 CAs verdes; regra §2 ("arquivados não aparecem como assignees") **não implementada** — vira ticket P0 pós-Sprint 07-B.
**Plano:** [docs/sprints/05/sprint-plan.md](../../sprints/05/sprint-plan.md)
**Story:** [docs/sprints/05/story-05-admin-enhancements.md](../../sprints/05/story-05-admin-enhancements.md)
**Resumo de fase:** [05/_summary.md](05/_summary.md)
**Final Artifact:** [../execution/2026-05-07-sprint-05-final.md](../execution/2026-05-07-sprint-05-final.md)

**Fechado:** soft-delete (`archived_at` em profiles + UI badge "Arquivado" + grayscale); `archiveUser`/`restoreUser`; last-admin guard estendido para `archiveUser`; busca client-side por email/full_name; bulk add whitelist com parsing `[\n,;]+`; `is_admin()` SECURITY DEFINER (resolve recursão de policies admin de [ADR 0001](../../spec/adr/0001-rbac-via-supabase-rls.md)).

**Aberto:** filtro `archived_at IS NULL` em `app/(app)/kanban/page.tsx` (assignee selector mostra arquivados); ausência de ADR para `is_admin()` (deveria ser ADR 0006 ou revisão do 0001).

## Sprint 06 — Integração Google Sheets

**Status:** 🟡 fechada retroativamente — 2026-05-09 (`_summary.md`) / 2026-05-10 (Final Artifact). Pipeline funcional ponta-a-ponta; ADR 0004 promovido a `Aceito`; débitos de hardening rastreados.
**Plano:** [docs/sprints/06/sprint-plan.md](../../sprints/06/sprint-plan.md)
**Story:** [docs/sprints/06/story-06-google-sheets-sync.md](../../sprints/06/story-06-google-sheets-sync.md)
**ADR:** [0004 — Google Sheets Sync](../../spec/adr/0004-google-sheets-sync.md) (`Aceito` retroativo)
**Resumo de fase:** [06/_summary.md](06/_summary.md)
**Final Artifact:** [../execution/2026-05-07-sprint-06-final.md](../execution/2026-05-07-sprint-06-final.md)

**Fechado:** Edge Function `sync-sheets` (Deno + googleapis) cobrindo INSERT/UPDATE/DELETE; database webhook nativo via `pg_net.http_post` em `tasks`; auth via Service Account JSON em secrets; CA-01 e CA-02 verdes; CA-03 parcial (loga erro, sem retry).

**Aberto:** URL e anon key JWT hardcoded em [migration 20260507000005](../../../supabase/migrations/20260507000005_google_sheets_webhook.sql) (vincula ambiente); ausência de retry; logger não estruturado; sem testes da Edge Function; diagnóstico expõe `credential_keys` no body do erro.

---

## Baseline `pnpm typecheck && pnpm lint` (estado em 2026-05-10)

✅ **Verde** desde commit `92d729a` (Sprint 07-A passo 0):

1. `tsconfig.json` exclui `supabase/functions/` (Edge Function é Deno).
2. `eslint.config.mjs` ignora `supabase/functions/**`.
3. `components/ui/ThemeToggle.tsx` migrou para `useSyncExternalStore`.

Hoje: `pnpm typecheck` ✅, `pnpm lint` ✅, `pnpm test:unit` ✅ 59/59. Camadas 2/3/4 e CI continuam abertos.

> Nota histórica: a auditoria de 2026-05-09 detectou os dois gates vermelhos (8 erros tsc em arquivo Deno + 1 erro lint em `set-state-in-effect`). Pago no passo 0 da Sprint 07-A.

## Sprint 07-A — Suíte de testes em camadas

**Status:** 🟡 entregue parcialmente — 2026-05-09. **Só Camada 1 (Vitest unit) entregue.** Camadas 2/3/4 deferidas por Docker indisponível no sandbox; ADR 0005 segue `proposto`; CI não configurado.
**Plano:** [docs/sprints/07A/sprint-plan.md](../../sprints/07A/sprint-plan.md)
**Stories:**

- ✅ [07A.1 — Domain layer tests (Vitest unit)](../../sprints/07A/story-07A.1-domain-tests.md) — 35 testes na entrega original; 59 hoje (com 07B.1+07B.2 somados).
- ⏸️ [07A.2 — Integration tests (Vitest + Supabase local)](../../sprints/07A/story-07A.2-integration-tests.md) — bloqueada (Docker).
- ⏸️ [07A.3 — Feature/E2E (Playwright + screenshot diff mobile)](../../sprints/07A/story-07A.3-feature-tests.md) — bloqueada (Docker + browsers).
- ⏸️ [07A.4 — pgTAP triggers e schema](../../sprints/07A/story-07A.4-pgtap-tests.md) — bloqueada (Docker + Supabase CLI).

**ADR:** [0005 — Estratégia de testes em camadas](../../spec/adr/0005-estrategia-de-testes.md) (`proposto` — não promovido por falta das Camadas 2/3/4).
**Resumo de fase:** [07A/_summary.md](07A/_summary.md)
**Plan Artifact (Gate 1):** [../execution/2026-05-09-sprint-07A-plan-artifact.md](../execution/2026-05-09-sprint-07A-plan-artifact.md)

**Fechado:** baseline `pnpm typecheck && pnpm lint` verde (excluir Deno do tsc, ignorar `supabase/functions/` no eslint, `useSyncExternalStore` em ThemeToggle); refactor neutro extraindo funções puras (`validateTaskDates`, `assertRoleAllowed`, `_validation.ts`); Vitest unit + 4 suítes (35→59 testes); `tests/README.md` documentando as 4 camadas.

**Aberto:** Camadas 2/3/4 (integration, E2E, pgTAP); ADR 0005 promover a `aceito`; CI; cobertura RLS = 0%.

## Sprint 07-B — Débitos transversais

**Status:** 🟡 fechada — 2026-05-10. 4/4 stories com entrega substantiva; 5 CAs deferidos para Camadas 2/3 da 07-A.
**Plano:** [docs/sprints/07B/sprint-plan.md](../../sprints/07B/sprint-plan.md)
**Stories:**

- ✅ [07B.1 — Logger estruturado (`lib/logger`)](../../sprints/07B/story-07B.1-logger.md) — 16 testes unit, redação de 7 chaves sensíveis.
- 🟡 [07B.2 — Mapeamento de erro na auth callback + UI domínio privilegiado](../../sprints/07B/story-07B.2-callback-mapping.md) — CA-03/CA-09 deferidas (E2E/integration).
- 🟡 [07B.3 — Audit log de role privilegiada + smoke anti-spoofing](../../sprints/07B/story-07B.3-audit-log.md) — CA-02/CA-04 deferidas (integration); migration `20260510000001` pendente de `db push` em remoto.
- ✅ [07B.4 — Fechamento retroativo Sprints 05/06 + ADR 0004 → Aceito + i18n base](../../sprints/07B/story-07B.4-retroactive-closure.md) — Final Artifacts retroativos 05/06; `_summary.md` 07-A; consolidação de débitos.

**Resumo de fase:** [07B/_summary.md](07B/_summary.md)

**Fechado:** `lib/logger` estruturado com redação automática + integração nos pontos sensíveis (Edge Function inclusive); callback mapping `not_authorized` vs `auth_failed` com UI amigável; trigger BEFORE UPDATE de email re-validando whitelist (migration `20260510000000`); UI de aviso para domínio privilegiado; tabela `privileged_role_audit` (RLS admin-only, INSERT best-effort); aba "Auditoria" no `/admin`; smoke anti-spoofing manual; `lib/i18n` base com 5 chaves de auth + 13 da audit tab; ADR 0004 a `Aceito`; documentação retroativa Sprints 05/06/07-A.

**Aberto:** ver "Débitos abertos pós-Sprint 07" abaixo.

## Sprint 07-C — Fechar a suíte e P0s remanescentes

**Status:** 🟢 fechada retroativamente — 2026-05-17. Entrega operacional out-of-band em `b01c52b` (scaffolding) + `1e42077` (fixes de path do alias e regex CA-18). Closure documental pela Sprint 11.
**Plano:** [docs/sprints/07C/sprint-plan.md](../../sprints/07C/sprint-plan.md)
**Stories:**

- 🟢 [07C.1 — Camadas 2/3/4 + CI](../../sprints/07C/story-07C.1-camadas-2-3-4-ci.md) — scaffolding + fixes entregues; validação operacional pendente em [Story 11.3](../../sprints/11/story-11.3-runbook-validacao.md).
- ✅ [07C.2 — Bug assignee arquivado](../../sprints/07C/story-07C.2-assignee-arquivado.md) — `app/(app)/kanban/page.tsx:30` aplica `.is('archived_at', null)`.

**Resumo de fase:** [07C/_summary.md](07C/_summary.md)
**Final Artifact:** [../execution/2026-05-17-sprint-07C-final.md](../execution/2026-05-17-sprint-07C-final.md)

**Fechado:** scaffolding completo de `tests/integration/**`, `tests/e2e/**`, `supabase/tests/**`, `playwright.config.ts`, `.github/workflows/ci.yml`, scripts `test:integration/e2e/db`; fix `tests/integration.config.ts` alias `@/` → repo root; regex CA-18 aceita mensagem mascarada do GoTrue; filtro `archived_at IS NULL` no assignee selector; migration RLS adicional `20260516130000_allow_task_creator_to_assign.sql` (out-of-band).

**Aberto:** validação `pnpm test:integration` verde (Story 11.3); promoção do ADR 0005; Gate G1 (migrations `20260510000000/001` em remoto); Gate G2 (smoke anti-spoofing em staging).

## Sprint 08 — Architecture Foundation & Docs Source of Truth

**Status:** 🟢 concluída — 2026-05-16. Gates G1 e G2 aprovados.
**Plano:** [docs/sprints/08/sprint-plan.md](../../sprints/08/sprint-plan.md)
**Stories:**

- ✅ [08.1 — Docs Source of Truth](../../sprints/08/story-08.1-docs-source-of-truth.md) — estrutura canônica `docs/{adr,api,architecture,diagrams,engineering,product,spec}`.
- ✅ [08.2 — Architecture Baseline para Modular Monolith + Clean Architecture](../../sprints/08/story-08.2-architecture-baseline.md) — bounded contexts, ADR 0006 e 0007 abertos.

**Execução registrada:** [../execution/2026-05-16-sprint-08-docs-architecture.md](../execution/2026-05-16-sprint-08-docs-architecture.md)

**Fechado:** `docs/` reorganizado; bounded contexts mapeados; ADRs 0006 (Modular Monolith + Clean Architecture) e 0007 (State Architecture) aceitos após Gate G2 (commit `18ba07b`); roadmap arquitetural Sprints 08–18.

**Aberto:** nenhum específico — toda a fundação serve como base para 09+.

## Sprint 09 — Refatoração Task Board (Modular Monolith) + Premium Dark Mode

**Status:** 🟢 concluída — 2026-05-16.
**Plano:** [docs/sprints/09/sprint-plan.md](../../sprints/09/sprint-plan.md)
**Stories:**

- ✅ [09.1 — Task Board Modular Monolith](../../sprints/09/story-09.1-task-board-modular-monolith.md) — domínio extraído para `src/modules/task-board/{domain,application,infrastructure}/`; `lib/actions/tasks.ts` vira facade chamando `TaskUseCases`.
- ✅ [09.2 — Premium Dark Mode UI](../../sprints/09/story-09.2-premium-dark-mode-ui.md) — `app/globals.css` com paleta HSL teal + glassmorphism via Tailwind v4 `@theme`.

**Execução registrada:** [../execution/2026-05-16-story-09.1-task-board-modular-monolith.md](../execution/2026-05-16-story-09.1-task-board-modular-monolith.md), [../execution/2026-05-16-story-09.2-premium-dark-mode-ui.md](../execution/2026-05-16-story-09.2-premium-dark-mode-ui.md)

**Fechado:** primeira fatia da migração arquitetural (ADR 0006) sem regressão; design system v1 (Inter + paleta HSL teal); 59/59 testes unit verdes.

**Aberto:** estender Clean Architecture aos outros bounded contexts (`whitelist`, `dashboard`); migrar mensagens restantes para `lib/i18n` (P1 herdado).

## Sprint 10 — Kanban & Dashboard Improvements

**Status:** 🟢 concluída — 2026-05-16. Migration `20260516140000_em_revisao_status.sql` pendente de `supabase db push` em remoto (operação humana).
**Plano:** [docs/sprints/10/sprint-plan.md](../../sprints/10/sprint-plan.md)
**Stories:**

- ✅ [10.1 — Kanban & Dashboard Improvements](../../sprints/10/story-10.1-kanban-dashboard.md) — status `em_revisao` no `TaskStatus` + Kanban + Dashboard; view `user_task_stats` ganha `avatar_url`/`full_name`/`in_review_tasks`; avatar Google real no Dashboard com fallback.

**Execução registrada:** [../execution/2026-05-16-story-10.1-kanban-dashboard.md](../execution/2026-05-16-story-10.1-kanban-dashboard.md)

**Fechado:** novo status `em_revisao` (violet, entre `em_desenvolvimento` e `finalizada`); migration ALTER TYPE ADD VALUE + recriação da view; avatar real do Google no Dashboard com fallback para inicial; grid de 5 colunas no Kanban (`sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5`).

**Aberto:** aplicar migration `20260516140000` em remoto; validação visual da nova coluna e do avatar via browser subagent.

## Sprint 11 — Estabilização da suíte + fechamento retroativo da Sprint 07-C

**Status:** 🟡 entregue parcialmente — 2026-05-17. Stories 11.1 (retroativa) e 11.2 (docs) fechadas pelo agente; Story 11.3 aguarda gate humano com Docker.
**Plano:** [docs/sprints/11/sprint-plan.md](../../sprints/11/sprint-plan.md)
**Stories:**

- ✅ [11.1 — Estabilizar `pnpm test:integration`](../../sprints/11/story-11.1-estabilizar-integration.md) — fixes operacionais já estavam em `1e42077`; closure retroativa documental.
- ✅ [11.2 — Fechar Sprint 07-C retroativamente](../../sprints/11/story-11.2-fechar-07C.md) — `07C/_summary.md`, Final Artifact retroativo, índice global atualizado.
- ⬜ [11.3 — Runbook humano para validar Camada 2 + promover ADR 0005](../../sprints/11/story-11.3-runbook-validacao.md) — aguardando humano com Docker funcional.

**Fechado:** reconciliação entre `_summary.md` e estado real do código; Sprint 07-C com closure documental completa; Sprints 08/09/10 registradas no índice global.

**Aberto:** Story 11.3 (validação operacional `pnpm test:integration` + promoção do ADR 0005 + Sprint 11 Final Artifact); Gates G1 e G2 permanecem.

---

## Débitos abertos pós-Sprint 07 (snapshot 2026-05-17)

Reconciliado em 2026-05-17. P0s da 07-C que estavam listados como abertos foram movidos para "fechados via Sprints 07-C / 11" abaixo, refletindo o estado real do código.

### 🔴 P0 — gates humanos remanescentes

- **Validação operacional `pnpm test:integration` + promoção do ADR 0005** — escopo da [Story 11.3](../../sprints/11/story-11.3-runbook-validacao.md). Depende de Docker funcional na máquina do humano.
- **Gate G1 — Aplicar migrations remotas** `20260510000000_check_whitelist_on_email_update.sql` e `20260510000001_privileged_role_audit.sql` via `supabase db push`. Detalhes: [gate-07C.G1-migrations-remotas.md](../../sprints/07C/gate-07C.G1-migrations-remotas.md).
- **Gate G2 — Rodar `tests/smoke/anti-spoofing.sh` em staging** após G1 aplicado e registrar `3 PASS / 0 FAIL` em `docs/memory/deploys/_summary.md`. Detalhes: [gate-07C.G2-smoke-staging.md](../../sprints/07C/gate-07C.G2-smoke-staging.md).

### ✅ P0 — fechados via Sprints 07-C / 11

- ~~**Camadas 2/3/4 da Sprint 07-A** (scaffolding)~~ — entregue em `b01c52b`; fix de path do alias e regex CA-18 em `1e42077`. Validação operacional pendente em Story 11.3.
- ~~**Filtro `archived_at IS NULL` no assignee selector**~~ — aplicado em `app/(app)/kanban/page.tsx:30`.
- ~~**Sprint 07-C sem closure formal**~~ — `_summary.md`, Final Artifact e atualização do índice global feitas em 2026-05-17.

### 🟡 P1 — formalizar / documentar

- **`is_admin()` SECURITY DEFINER sem ADR** (introduzido em migration `20260507000004`) — virar ADR 0006 ou revisão do ADR 0001. (Nota: ADR 0006 foi usado em Sprint 08 para Modular Monolith + Clean Architecture; o ADR específico de `is_admin()` ainda não tem número alocado.)
- **Final Artifact da Sprint 07-A** — só o Plan Artifact existe; Final fica para acompanhar fechamento das Camadas 2/3/4 (depende da Story 11.3).
- **Audit log para `updateUserRole`** (mudança pós-cadastro) — Story 07B.3 só cobre criação automática.
- **Migração total de mensagens hard-coded para `lib/i18n`** — hoje 18 chaves (5 de auth + 13 da audit tab).
- **Cleanup de `test_output*.txt`** no repo root (stale após `1e42077`) — proposto na Story 11.3 §3.9.

### 🟢 P2/P3 — backlog longo / pós-v1

- Race-condition do `LAST_ADMIN` (transação real).
- URL e anon-key hardcoded em migration `20260507000005_google_sheets_webhook.sql` — refactor para `app.settings.*` ou Vault.
- Retry / dead-letter na Edge Function `sync-sheets`.
- Cobertura automatizada da Edge Function (mock da Google API).
- Trace IDs / correlation IDs no logger.
- Diagnóstico do erro da Edge Function expõe `credential_keys` no body — mover só para log.
- Sincronização bi-direcional Google Sheets — fora de escopo do PRD v1.
- Visual regression desktop (E2E hoje só mobile).
- Alertas/notificações para tarefas atrasadas — roadmap pós-v1.
- Exportação de relatórios PDF — roadmap pós-v1.
