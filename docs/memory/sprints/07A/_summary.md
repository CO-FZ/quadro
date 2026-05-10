# Resumo Sprint 07-A — 2026-05-10 (reconstruído retroativamente)

**Owner da fase:** Eduardo Lima
**Sessões envolvidas:**
- Commit `4a584df` (2026-05-09) — plano duplo Sprint 07-A/07-B + ADR 0005 (`proposto`).
- Commit `bd47a4b` (2026-05-09) — fechamento retroativo Sprints 05/06 + Plan Artifact da 07-A (Gate 1).
- Commit `92d729a` (2026-05-09) — passo 0: destrava `tsc`/`lint` (tsconfig exclui Deno; lint ignora `supabase/functions`; ThemeToggle → `useSyncExternalStore`).
- Commit `50461c9` (2026-05-09) — refactor: extrair funções puras (`validateTaskDates`, `assertRoleAllowed`, `_validation.ts`).
- Commit `68ec4ff` (2026-05-09) — Story 07A.1 entregue: 35 testes Vitest unit (depois 59 com 07B.1/07B.2).

**Status de saída:** 🟡 entregue parcialmente — **só Story 07A.1 (Camada 1/Vitest unit) foi entregue**. Stories 07A.2 (integration), 07A.3 (E2E Playwright) e 07A.4 (pgTAP) ficaram bloqueadas por **Docker indisponível no sandbox de execução**. ADR 0005 segue em status `proposto`. CI não foi configurado.

> **Nota sobre reconstrução.** Este `_summary.md` foi escrito em 2026-05-10 como parte da Story 07B.4 CA-08, depois de a Sprint 07-B já estar em execução (Stories 07B.1–07B.3 entregues). Reconstruído a partir de `git log`, do Plan Artifact em `docs/memory/execution/2026-05-09-sprint-07A-plan-artifact.md` e do estado atual de `tests/`.

---

## 1. O que foi decidido / entregue

- **ADR 0005 — Estratégia de testes em camadas** redigido em `proposto` (commit `4a584df`); estabelece 4 camadas: domain (Vitest), integration (Vitest + Supabase local), feature/E2E (Playwright + screenshot diff mobile), pgTAP. ⚠️ Não promovido a `aceito` ainda — pendência da DoD da sprint.
- **Passo 0 — baseline `pnpm typecheck && pnpm lint` verde** (commit `92d729a`):
  - `tsconfig.json` ganha `"supabase/functions"` em `exclude` (Edge Function é Deno).
  - `eslint.config.mjs` ignora `supabase/functions/**`.
  - `components/ui/ThemeToggle.tsx` migra de `useEffect+setState` para `useSyncExternalStore` — resolve `react-hooks/set-state-in-effect`.
- **Refactor neutro** (commit `50461c9`) que extrai funções puras testáveis sem mudar comportamento:
  - `lib/utils/task-dates.ts`: `validateTaskDates(start, end) → { ok: false, code, message } | { ok: true }` (códigos `START_REQUIRED` / `END_REQUIRED` / `END_BEFORE_START`).
  - `lib/auth/require-role.ts`: separação `assertRoleAllowed(caller, allowed)` (puro) + `requireRole(allowed)` (wrapper com `cache()`).
  - `lib/actions/_validation.ts`: `normalizeTaskInput`, `initialStatusFor` extraídos de `tasks.ts`.
- **Story 07A.1 — Camada 1 (Vitest unit) entregue** (commit `68ec4ff`):
  - Vitest 4.1.5 + `@vitest/coverage-v8` em devDependencies.
  - `vitest.config.ts` com `environment: 'node'`, alias `@`, include só `tests/unit/**`.
  - Scripts `package.json`: `typecheck`, `test`, `test:unit`, `test:unit:coverage`.
  - 35 testes em 4 suítes:
    - `task-status.test.ts` (10) — `isOverdue` × matriz status × end_date com timer fake.
    - `task-dates.test.ts` (6) — `validateTaskDates` × cenários de erro e ordem válida.
    - `require-role.test.ts` (6) — `assertRoleAllowed` × null/permitido/forbidden.
    - `_validation.test.ts` (13) — `normalizeTaskInput`, `initialStatusFor`.
  - `tests/README.md` documentando as 4 camadas e gates.

## 2. CAs vs estado real

### Story 07A.1 — Domain (Camada 1)

| CA | Status | Evidência |
|---|---|---|
| CA-01 — devDeps + scripts | ✅ | `package.json:18-31` |
| CA-02 — `task-status` coberto | ✅ | `tests/unit/lib/utils/task-status.test.ts` (10 testes) |
| CA-03 — `task-dates` coberto | ✅ | `tests/unit/lib/utils/task-dates.test.ts` |
| CA-04 — `assertRoleAllowed` 100% | ✅ | `tests/unit/lib/auth/require-role.test.ts` |
| CA-05 — `_validation` coberto | ✅ | `tests/unit/lib/actions/_validation.test.ts` |
| CA-06 — `validateTaskDates` extraído + usado em `TaskModal` | ✅ | `lib/utils/task-dates.ts` + `components/features/TaskModal.tsx` |

### Story 07A.2 — Integration (Camada 2)

| CA | Status |
|---|---|
| CA-01..18 — fixtures, RLS por tabela × persona, Server Actions, triggers | ⏸️ **deferida** — exige Docker + Supabase CLI local; sandbox não tem Docker. |

### Story 07A.3 — Feature/E2E (Camada 3)

| CA | Status |
|---|---|
| CA-01..15 — Playwright + screenshot diff mobile | ⏸️ **deferida** — exige Docker + browsers Playwright. |

### Story 07A.4 — pgTAP (Camada 4)

| CA | Status |
|---|---|
| CA-01..16 — testes de triggers, enums, constraints, cascades | ⏸️ **deferida** — exige Supabase CLI rodando `supabase test db` em Docker. |

## 3. O que ficou em aberto

- 🔴 **ADR 0005 em `proposto`** — DoD da sprint exige `aceito`. Quem fechar Camadas 2/3/4 promove.
- 🔴 **Stories 07A.2, 07A.3, 07A.4 deferidas** — Camadas 2/3/4 da estratégia. Bloqueadas por sandbox sem Docker. **Vira Sprint 07-C** (ou retrabalho da 07-A em ambiente humano).
- 🔴 **CI não configurado** — `.github/workflows/ci.yml` não foi criado. Junto com 07A.2/3/4.
- 🔴 **Cobertura de RLS = 0%** — Camada 2 nunca rodou. `tests/smoke/anti-spoofing.sh` (Story 07B.3) é a alternativa humana provisória.
- 🟡 **Cobertura `lib/utils/`** — não medida automaticamente (script existe, não foi rodado em CI).
- 🟡 **Filtro de assignees arquivados** (achado da auditoria Sprint 05) — adiado pela Sprint 07-A para Sprint 07-B; **continua aberto** após 07B.4.

## 4. ADRs criados / promovidos nesta fase

| ADR | Título | Status |
|---|---|---|
| 0005 | Estratégia de testes em camadas | `proposto` (não promovido — depende das Camadas 2/3/4) |

## 5. Padrões salvos na Knowledge Base

- **Funções puras como ponto de teste** — refactor neutro extraindo `validateTaskDates`, `assertRoleAllowed`, `normalizeTaskInput`, `initialStatusFor`. Heurística: se uma função usa só seus argumentos e retorna um discriminado `{ ok, code }`, ela mora em `lib/utils/` ou `lib/<feature>/_validation.ts` e é testável sem mock.
- **Vitest sem globals** (`globals: false` em `vitest.config.ts`) — cada teste importa `describe/it/expect` explicitamente. Reduz IDE warnings e pega imports faltando cedo.
- **Timer fake congelado** (`vi.useFakeTimers().setSystemTime(...)`) — padrão para testar funções que dependem de "agora" sem flakiness.
- **`tsconfig.exclude` para Deno** (em vez de tsconfig duplo) — escolhido como solução simples; `supabase/functions/sync-sheets/deno.json` já mantém o type-check próprio do Deno LSP.
- **`useSyncExternalStore` para hidratação tema** — substitui `useEffect+setState` pattern proibido pelo `react-hooks/set-state-in-effect`.

## 6. Métricas / artefatos verificáveis

- **`pnpm typecheck`** ✅ verde (passo 0).
- **`pnpm lint`** ✅ verde (passo 0).
- **`pnpm test:unit`** ✅ 35/35 verde (à época do 07A.1; hoje 59/59 com 07B.1+07B.2 adicionados).
- **`pnpm test:integration`** ❌ não executável — script não criado.
- **`pnpm test:e2e`** ❌ não executável — script não criado.
- **`pnpm test:db`** ❌ não executável — script não criado.
- **CI** ❌ não configurado.
- **ADR 0005 status** = `proposto` (não atende DoD).
- **Cobertura `lib/utils/`** = não medida.

## 7. Avisos para o próximo agente

- **Stories 07A.2/3/4 não estão "abandonadas" — estão pausadas.** Quando ambiente com Docker estiver disponível, retomar a partir do passo 3 do Plan Artifact.
- **Não invente que está pronto:** `tests/integration/`, `tests/e2e/`, `supabase/tests/` **não existem**. ADR 0005 ainda é `proposto`.
- **`tests/smoke/anti-spoofing.sh`** (entregue na Story 07B.3) cobre **manualmente** parte do que 07A.2 cobriria automaticamente. Não é substituto, é workaround.
- **Sprint 07-B começou sem 07-A inteira fechada** — exceção autorizada porque débitos transversais (logger, callback mapping, audit log, fechamento retroativo) eram de fato independentes das Camadas 2/3/4. Não criar precedente: sprint normal exige sprint precedente fechada.
- **Antes de promover ADR 0005 a `aceito`:** as 4 camadas precisam de pelo menos um teste real cada. Hoje só Camada 1 atende.

## 8. Harness debt observada

- **DoD parcialmente atendida sem Plan Artifact ajustado** — o Plan Artifact original previa Camadas 2/3/4 entregues; bloqueio por Docker não foi formalizado em revisão de plano (deveria ter sido). Documentado retroativamente aqui.
- **`_summary.md` da Sprint 07-A não escrito à época** — pago retroativamente em 2026-05-10 (Story 07B.4 CA-08).
- **Final Artifact da Sprint 07-A** ainda não foi escrito — fica como débito P2 pós-Sprint 07-B (separado deste fechamento; o Plan Artifact em `docs/memory/execution/2026-05-09-sprint-07A-plan-artifact.md` cobre Gate 1 mas não substitui Final Artifact / Gate 2).
- **Pre-commit hook não configurado** — o gate `pnpm typecheck && pnpm lint && pnpm test:unit` previsto em `tests/README.md` não tem hook real (depende do humano disciplinar).
