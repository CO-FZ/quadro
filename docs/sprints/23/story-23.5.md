# Story 23.5 — Testes: integração (actions + RLS) + e2e

**Sprint:** 23
**Prioridade:** P2
**Depende de:** 23.3, 23.4
**Arquivos afetados:** `tests/unit/*`, `tests/integration/actions/leaves.actions.test.ts`, `tests/integration/rls/leaves.rls.test.ts`, `tests/e2e/ferias.spec.ts`, `tests/e2e/seed.setup.ts`

Estratégia conforme ADR 0005. Espelhar os arquivos existentes citados em cada bloco.

## 1. Unit (parte já em 23.2, completar aqui)

- `tests/unit/src/personnel/leave.test.ts` — `validateLeaveDates` + `normalizeLeaveInput`.
- `tests/unit/lib/leave-bar-geometry.test.ts` (ou em `personnel/`) — `leaveBarGeometry(start, end, year)`:
  - período no meio do ano → `leftPct`/`widthPct` plausíveis;
  - período que cruza a virada do ano → clamp à borda;
  - período totalmente fora do ano → `null`.
- `tests/unit/...` — `getLeavesForCell` (dentro/fora do intervalo, membro errado).

## 2. Integração — Actions (`leaves.actions.test.ts`)

Espelhar `tests/integration/actions/tasks.actions.test.ts`:

- coordenador cria período → `{ ok: true }`, linha persistida.
- admin edita/exclui → `{ ok: true }`.
- efetivo cria → `{ ok: false, code: 'FORBIDDEN' }`.
- datas invertidas → `{ ok: false, code: 'VALIDATION' }`.

## 3. Integração — RLS (`leaves.rls.test.ts`)

Espelhar `tests/integration/rls/tasks.rls.test.ts`:

- efetivo: SELECT permitido; INSERT/UPDATE/DELETE negados.
- coordenador e admin: CRUD permitido.
- `CHECK (end_date >= start_date)` rejeita período invertido no nível do banco.

## 4. E2E (`tests/e2e/ferias.spec.ts`)

Espelhar `tests/e2e/admin.spec.ts` e `matriz.spec.ts`:

- **admin**: abre `/admin` → clica aba `Férias` → clica no nome de um membro → preenche período (Férias) → salva → barra aparece no Gantt na linha do membro.
- **admin**: navega para `/matriz` no período lançado → badge "Férias" visível na célula do membro.
- **coordenador**: acessa `/admin`, vê só a aba `Férias`, consegue lançar período.
- **efetivo**: `/admin` redireciona para `/kanban` (controle de acesso).

### Seed

Em `tests/e2e/seed.setup.ts`, semear ao menos 1 afastamento conhecido para asserções estáveis de badge na Matriz.

## Critérios de aceite

- [ ] `pnpm test:unit` verde (datas, geometria, getLeavesForCell)
- [ ] `pnpm test` verde (actions + RLS de `leaves`)
- [ ] `pnpm test:e2e` verde (`ferias.spec.ts`), incluindo o caso de redirect do efetivo
- [ ] Sem flakiness de fuso: datas fixas no seed, sem `new Date()` sem âncora
