# Sprint 07-C — Resumo de fase (fechada retroativamente)

**Última atualização:** 2026-05-17 (fechamento retroativo via Sprint 11)
**Plano:** [docs/sprints/07C/sprint-plan.md](../../../sprints/07C/sprint-plan.md)
**Status de saída:** 🟢 entregue out-of-band ao longo das sprints pre-08; closure documental feita em 2026-05-17 pela Sprint 11.
**Commits principais de entrega:**

- `b01c52b — feat: implement comprehensive integration and E2E testing framework with Supabase support and CI automation` (scaffolding Camadas 2/3/4 + CI)
- `1e42077 — feat: allow task creators to assign users and update integration test path and error assertions` (fix alias + regex CA-18; migration RLS adicional)
- Origem do filtro `archived_at IS NULL` em `app/(app)/kanban/page.tsx:30` rastreável via `git log --follow`.

> Resumo retroativo: a Sprint 07-C **não teve Plan Artifact aprovado nem Final Artifact à época**; os planos foram instanciados (sprint-plan + stories + gate guides), mas o trabalho foi entregue diretamente nas branches que viraram Sprints 08/09/10 sem fechar formalmente a 07-C. A Sprint 11 reconcilia o registro com o estado real do código.

---

## Status por story

| Story | Status | Commit / Push | Cobertura adicionada |
|---|---|---|---|
| [07C.1 — Camadas 2/3/4 + CI](../../../sprints/07C/story-07C.1-camadas-2-3-4-ci.md) | 🟢 entregue (scaffolding); validação operacional pendente | `b01c52b` (scaffolding), `1e42077` (fixes) | `tests/integration/**`, `tests/e2e/**`, `supabase/tests/**`, `.github/workflows/ci.yml`, `playwright.config.ts`, scripts em `package.json` |
| [07C.2 — Bug assignee arquivado](../../../sprints/07C/story-07C.2-assignee-arquivado.md) | ✅ entregue | (filtro em `app/(app)/kanban/page.tsx:30`) | — (1 linha de fix) |
| Gate G1 — migrations remotas | ⬜ não executado | — | — |
| Gate G2 — smoke anti-spoofing staging | ⬜ não executado | — | — |

---

## Story 07C.1 — Camadas 2/3/4 + CI (🟢 entregue out-of-band)

**Arquivos novos (entregues em `b01c52b`):**

- `tests/integration/globalSetup.ts` — bootstrap antes da suite (assume Supabase local rodando).
- `tests/integration/fixtures/{supabase,cleanup,personas,...}.ts` — `createPersonaClient`, `seedPersonas`, `cleanup({taskIds})`, constantes determinísticas.
- `tests/integration/rls/{tasks,task_assignees,profiles,whitelist}.rls.test.ts` — RLS por persona × tabela.
- `tests/integration/actions/tasks.actions.test.ts` — Server Actions ponta-a-ponta (CA-06 a CA-16).
- `tests/integration/triggers/handle_new_user.test.ts` — CA-17 e CA-18 (signup real).
- `tests/integration.config.ts` — config Vitest com `pool: 'forks'`, `maxConcurrency: 1`, timeouts maiores.
- `tests/e2e/{kanban,admin,auth}.spec.ts` + `tests/e2e/auth.setup.ts` + `tests/e2e/fixtures/` — Playwright cobrindo 3 fluxos × 3 personas.
- `playwright.config.ts` — projects `chromium` (desktop) + `mobile` (Galaxy S8 360×740) com `storageState` por persona.
- `supabase/tests/{handle_new_user,check_whitelist,schema_constraints}.sql` — pgTAP (Camada 4).
- `.github/workflows/ci.yml` — jobs `typecheck`, `lint`, `unit`, `integration`, `db`, `e2e`.
- Scripts em `package.json`: `test:integration`, `test:integration:watch`, `test:e2e`, `test:e2e:update`, `test:db`.
- `devDependencies`: `@playwright/test`, `supabase` CLI, `@vitest/coverage-v8`.

**Fix posterior (entregue em `1e42077`):**

- `tests/integration.config.ts` — alias `@/` corrigido de `path.resolve(__dirname, '.')` para `'../'` (apontava para `tests/` ao invés do repo root, quebrando os `await import('@/lib/actions/...')` dinâmicos).
- `tests/integration/triggers/handle_new_user.test.ts` — regex de CA-18 estendido para aceitar `database error saving new user` (mensagem mascarada pelo GoTrue quando o trigger faz `RAISE EXCEPTION`).
- `supabase/migrations/20260516130000_allow_task_creator_to_assign.sql` — migration aditiva permitindo criador de task atribuir assignees (RLS — não estava no plano da 07-C, mas alinhada à direção; documentada como out-of-band).

**Critérios de aceite (herdados de 07A.2/07A.3/07A.4 e CA-CI desta story):**

- CA-CI-01 (pipeline CI verde) — ⏸️ pendente validação real (Story 11.3).
- CA-CI-02 (screenshot baseline) — ⏸️ depende de primeiro run real de E2E.
- CA-CI-03 (ADR 0005 promovido) — ⏸️ depende de §3.5/§3.8 da Story 11.3.
- CAs herdados de 07A.2 (integration CA-06 a CA-19) — ⏸️ código existe, validação operacional pendente.

**Estado da última evidência de execução** (`test_output_2.txt`, pré-`1e42077`):
- Test Files: 2 failed / 4 passed (6).
- Tests: 8 failed / 29 passed (37) — todas as 8 falhas correspondem aos dois root causes resolvidos em `1e42077`.

Após `1e42077` a expectativa é exit 0 / 0 falhas — confirmação operacional fica para a Story 11.3.

**Limitações documentadas:**

- Camada 3 (E2E) e Camada 4 (pgTAP) não foram exercitadas nem uma vez no sandbox do agente. Health-check operacional fica para a Story 11.3 e qualquer falha vira débito P1.
- Migration `20260516130000_allow_task_creator_to_assign.sql` foi entregue dentro do mesmo commit do fix de integration tests — mistura de escopo aceita retroativamente, mas é o tipo de mistura que ADR 0008 (se vier) sobre PRs unitários deveria endereçar.

---

## Story 07C.2 — Bug assignee arquivado (✅ entregue)

**Arquivo modificado:**

- `app/(app)/kanban/page.tsx:30` — query de `profiles` ganha `.is('archived_at', null)` filtrando arquivados do selector de assignee.

**Critérios de aceite:**

- CA-01 (usuário arquivado não aparece no selector) — ✅.
- CA-02 (usuários ativos continuam aparecendo, ordenados por email) — ✅.
- CA-03 (tasks existentes com assignee arquivado não quebram) — ✅ (filtro é só no selector, não nas tasks renderizadas).
- CA-04 (`pnpm typecheck && pnpm lint` continuam passando) — ✅ desde então.

**Limitação:** não há audit log de quando/quem aplicou o filtro — `git log --follow app/(app)/kanban/page.tsx` permite rastrear o commit exato se necessário.

---

## Gates pendentes (permanecem como débito após Sprint 11)

### Gate G1 — Aplicar migrations remotas

Migrations locais ainda não pushadas para o ambiente remoto:

- `supabase/migrations/20260510000000_check_whitelist_on_email_update.sql` (trigger BEFORE UPDATE de email re-validando whitelist).
- `supabase/migrations/20260510000001_privileged_role_audit.sql` (tabela `privileged_role_audit` + reescrita de `handle_new_user`).

Detalhes: [docs/sprints/07C/gate-07C.G1-migrations-remotas.md](../../../sprints/07C/gate-07C.G1-migrations-remotas.md) e [Story 11.3 §5](../../../sprints/11/story-11.3-runbook-validacao.md).

### Gate G2 — Smoke anti-spoofing em staging

`tests/smoke/anti-spoofing.sh` em staging após G1 aplicado. Resultado esperado: `3 PASS / 0 FAIL`. Detalhes: [docs/sprints/07C/gate-07C.G2-smoke-staging.md](../../../sprints/07C/gate-07C.G2-smoke-staging.md) e [Story 11.3 §6](../../../sprints/11/story-11.3-runbook-validacao.md).

---

## Débitos consolidados pós-Sprint 07-C (status em 2026-05-17)

### 🟡 P0/P1 — agora rastreados na Sprint 11 ou aceitos como gate humano permanente

- **`pnpm test:integration` operacionalmente verde** — Story 11.3 (gate humano + Docker).
- **ADR 0005 → `aceito`** — Story 11.3 (passo final do runbook).
- **Sprint 11 Final Artifact** — Story 11.3.
- **Gate G1** (migrations remotas) — gate humano permanente.
- **Gate G2** (smoke staging) — gate humano permanente.

### 🟢 P0 — fechados nesta closure retroativa

- ~~Camadas 2/3/4 da Sprint 07-A (scaffolding)~~ — entregue em `b01c52b`.
- ~~Filtro `archived_at IS NULL` no assignee selector~~ — entregue em `app/(app)/kanban/page.tsx:30`.

### Débitos herdados de sprints anteriores que **não eram da 07-C** (continuam abertos)

- `is_admin()` SECURITY DEFINER sem ADR — P1.
- Race-condition `LAST_ADMIN` em transação real — P2/P3.
- URL/anon-key hardcoded em `20260507000005_google_sheets_webhook.sql` — P2.
- Retry/dead-letter na Edge Function `sync-sheets` — P2.
- Audit log para `updateUserRole` pós-cadastro — P1.
- Migração total `lib/i18n` (hoje só 18 chaves) — P1.
- Visual regression desktop — P2.
- Final Artifact da Sprint 07-A — P1.

---

## Notas metodológicas

Este `_summary.md` é uma reconstrução retroativa a partir de:

1. `docs/sprints/07C/sprint-plan.md` (escopo planejado).
2. `git log` dos commits `b01c52b` e `1e42077` (entrega real).
3. Inspeção do código atual (`tests/integration/**`, `app/(app)/kanban/page.tsx`, `.github/workflows/ci.yml`).
4. `test_output.txt` e `test_output_2.txt` no repo root (evidência stale da falha que motivou `1e42077`).

Não houve Plan Artifact aprovado nem Final Artifact à época. A closure aqui registra o que de fato foi entregue, separando o que tem validação operacional (07C.2) do que tem só validação por inspeção de código (07C.1, à espera da Story 11.3).
