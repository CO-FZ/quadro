# Sprint 23 — Resumo de fase (Gestão de Férias e Afastamentos)

**Última atualização:** 2026-05-28 (implementação 23.1–23.6)
**Plano:** [docs/sprints/23/sprint-plan.md](../../../sprints/23/sprint-plan.md)
**ADR:** [0014 — Modelo de Férias e Afastamentos](../../../spec/adr/0014-modelo-de-ferias-afastamentos.md)
**Branch de execução:** `feat/sprint-23-ferias`
**Status de saída:** 🟢 implementado — typecheck + lint + 131 testes unit verdes. Integração (actions/RLS) e e2e exigem Supabase local (`supabase db reset`) + `pnpm test`/`pnpm test:e2e`.

---

## Status por story

| Story | Status | Cobertura adicionada |
|---|---|---|
| 23.1 — Migration `leaves` + enum + RLS | ✅ | — (validada via RLS test) |
| 23.2 — Módulo `personnel` + actions `leaves` | ✅ | `tests/unit/src/modules/personnel/domain/leave.test.ts` (10) |
| 23.3 — UI aba Férias (Gantt + modal) + guard | ✅ | `tests/e2e/ferias.spec.ts` |
| 23.4 — Reflexo na Matriz (badge) | ✅ | `tests/unit/lib/leave-calendar.test.ts` (6) |
| 23.5 — Testes integração + e2e | ✅ | `leaves.rls.test.ts`, `leaves.actions.test.ts`, `ferias.spec.ts` |
| 23.6 — ADR 0014 + docs | ✅ | — |

---

## Arquivos novos

- `supabase/migrations/20260528000002_member_leaves.sql` — tabela `leaves`, enum `leave_type` (`ferias`/`instalacao`/`dispensa`), RLS (SELECT a todos; CUD admin/coordenador), trigger `handle_updated_at`, índices `profile_id` e `(start_date,end_date)`, `CHECK (end_date >= start_date)`.
- `src/modules/personnel/` — bounded context novo (ADR 0006): `domain/entities.ts`, `domain/leave.ts` (`normalizeLeaveInput`, `validateLeaveDates`), `domain/repository.ts`, `application/use-cases.ts` (`LeaveUseCases`, guard admin/coordenador), `infrastructure/supabase-leave-repository.ts`.
- `lib/actions/leaves.ts` — `getLeaves` / `createLeave` / `updateLeave` / `deleteLeave`; contrato `{ok}` discriminado; revalida `/admin` e `/matriz`.
- `lib/utils/leave-calendar.ts` — `leaveBarGeometry(start,end,year)` (posicionamento do Gantt) e `getLeavesForCell` (filtro de dia/membro).
- `lib/i18n/leaves.ts` — rótulos pt-BR (tipos, modal, aba).
- `components/features/FeriasView.tsx` — Gantt anual (linha=membro, 12 colunas de mês, barras posicionadas) + navegação de ano + `LeaveModal` (clique no nome do membro).
- Testes: `tests/unit/src/modules/personnel/domain/leave.test.ts`, `tests/unit/lib/leave-calendar.test.ts`, `tests/integration/rls/leaves.rls.test.ts`, `tests/integration/actions/leaves.actions.test.ts`, `tests/e2e/ferias.spec.ts`.

## Arquivos modificados

- `lib/supabase/types.ts` — re-exporta tipos `Leave`/`LeaveType`/etc. de `personnel`.
- `lib/i18n/index.ts` — registra namespace `leaves`.
- `components/features/AdminView.tsx` — `AdminTab` ganha `ferias`; abas gateadas por role (admin vê 4; coordenador só Férias); título condicional; renderiza `FeriasView`.
- `app/(app)/admin/page.tsx` — guard relaxado para `admin`+`coordenador`; carrega `getLeaves({year})`; whitelist/audit só p/ admin; passa `currentUserRole` real + `currentYear`.
- `components/features/AppShell.tsx` — link `/admin` exposto a coordenador (label "Férias").
- `components/features/MatrizView.tsx` — prop `leaves`; badge por tipo na célula do membro (antes das tarefas).
- `app/(app)/matriz/page.tsx` — query de `leaves` na janela ±7d.
- `tests/integration/fixtures/cleanup.ts` — `leaveIds` no contexto de cleanup.

---

## Decisões de produto (humano, 2026-05-28)

- Gestão por **admin + coordenador**; leitura liberada a todos (Matriz é vista por todos).
- Reflexo na Matriz por **badge** na célula (verde Férias / âmbar Instalação / azul Dispensa).
- Gantt do **ano corrente com navegação de ano**.

## Riscos / débitos rastreados

- Fusos: todas as datas tratadas como `DATE` puro (`'YYYY-MM-DD'`); `leaveBarGeometry` usa `getFullYear`/diferença de dias — coberto por unit.
- Sobreposição de períodos do mesmo membro permitida (decisão); só valida `end >= start`.
- Integração/e2e não rodam neste ambiente sem Supabase local — rodar antes do PR.
