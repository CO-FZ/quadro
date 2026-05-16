# Sprints — Summary

**Última atualização:** 2026-05-16 (Sprint 07-C aberta; sprint-plan + stories + gates instanciados)

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

---

## Débitos abertos pós-Sprint 07

Snapshot consolidado em 2026-05-10. Itens herdados (não fechados pelas Sprints 07-A/07-B) + débitos novos descobertos durante a arqueologia retroativa.

### 🔴 P0 — entram na Sprint 07-C (a planejar)

- **Camadas 2/3/4 da Sprint 07-A** — integration (Vitest+Supabase local), E2E (Playwright + screenshot diff mobile), pgTAP. Pré-condição para promover ADR 0005 a `aceito` e configurar CI.
- **Filtro `archived_at IS NULL` no assignee selector** (`app/(app)/kanban/page.tsx`) — regra §2 da story 05 nunca implementada.
- **Aplicar migrations remotas** `20260510000000_check_whitelist_on_email_update.sql` e `20260510000001_privileged_role_audit.sql` via `supabase db push` (gate humano).
- **Rodar `tests/smoke/anti-spoofing.sh` em staging** após aplicar as migrations e registrar resultado em `docs/memory/deploys/_summary.md`.

### 🟡 P1 — formalizar / documentar

- **`is_admin()` SECURITY DEFINER sem ADR** (introduzido em migration `20260507000004`) — virar ADR 0006 ou revisão do ADR 0001.
- **Final Artifact da Sprint 07-A** — só o Plan Artifact existe; Final fica para acompanhar fechamento das Camadas 2/3/4.
- **Audit log para `updateUserRole`** (mudança pós-cadastro) — Story 07B.3 só cobre criação automática.
- **Migração total de mensagens hard-coded para `lib/i18n`** — hoje só 5 chaves críticas + 13 da audit tab.

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
