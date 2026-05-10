# Story 07A.1: Domain layer tests (Vitest unit)

**Sprint:** 07-A — ver [sprint-plan.md](sprint-plan.md)
**ADRs:** [ADR 0005 — Estratégia de testes](../../spec/adr/0005-estrategia-de-testes.md) (passo 0), [ADR 0003 — Defesa em camadas](../../spec/adr/0003-defesa-em-camadas-tasks.md)
**Glossário:** [docs/prd/01-glossary.md](../../prd/01-glossary.md)
**Origem:** débito de "Cobertura de testes 0%" registrado em [Sprint 02 §5](../../memory/sprints/02/_summary.md), [Sprint 03 §6](../../memory/sprints/03/_summary.md).

---

## 1. Visão Geral

Estabelecer a **Camada 1** da estratégia (ADR 0005): testes unit em Vitest cobrindo lógica pura, sem I/O. Esta story instala Vitest, configura `pnpm test:unit`, escreve fixtures mínimas e cobre os helpers e validações de input que hoje vivem espalhados em `lib/utils/`, `lib/auth/` e nas Server Actions de `lib/actions/`.

O foco é **regra de domínio**: dado um input, a função retorna o output esperado, sem subir banco nem mockar Supabase. Tudo que precisa de Supabase vai para Story 07A.2.

## 2. Requisitos de Negócio (Regras)

- `isOverdue(task)` ([lib/utils/task-status.ts](../../../lib/utils/task-status.ts)) é a regra única de "atrasada" (Sprint 03 ADR 0003). Cobrir todas as combinações de `status` × `end_date` (passado, hoje, futuro).
- `requireRole(allowed)` ([lib/auth/require-role.ts](../../../lib/auth/require-role.ts)) deve retornar `null` se autorizado, `{ ok: false, code: 'UNAUTHENTICATED' }` se sem user, `{ ok: false, code: 'FORBIDDEN' }` se role não está em `allowed`. O lookup de `profiles.role` é I/O — vai para integration; aqui testa-se a função pura recebendo um caller já resolvido (extraindo a parte pura via refactor leve documentado em §5).
- Validações de input das Server Actions devem ser puras e isoláveis: trim de `title`/`description`, conversão de strings vazias em `null`, decisão de status inicial baseado em `assignee_ids.length`. **Hoje essas regras estão inline nas actions** — esta story extrai para `lib/actions/_validation.ts` (sem mudar o comportamento, só permite teste).
- Nenhum teste pode tocar `process.env`, banco, fetch real ou Supabase client.

## 3. Requisitos técnicos

- **Framework:** Vitest 1.x (latest). Configurar em `vitest.config.ts` com `environment: 'node'`, `globals: false`, `coverage.provider: 'v8'`.
- **Scripts no `package.json`:**
  - `"test": "vitest"` (watch mode default)
  - `"test:unit": "vitest run tests/unit"` (CI)
  - `"test:unit:coverage": "vitest run tests/unit --coverage"`
  - **Adicionar também `"typecheck": "tsc --noEmit"`** — débito de Sprint 03 que tem que ser pago aqui pelo gate de DoD da Sprint 07-A.
- **Estrutura:**
  ```
  tests/
    unit/
      lib/
        utils/
          task-status.test.ts
        auth/
          require-role.test.ts
        actions/
          _validation.test.ts        ← cobre helpers extraídos
    README.md                         ← criar com instruções gerais (vai cobrir todas as 4 camadas)
  vitest.config.ts
  ```
- **DevDependencies adicionadas:** `vitest`, `@vitest/coverage-v8`. Sem `@testing-library/react` nesta story (não há teste de componente — UI vai para Story 07A.3).

## 4. Critérios de Aceite

### CA-01 — Setup Vitest

- **Given** repositório sem Vitest
- **When** agente roda `pnpm add -D vitest @vitest/coverage-v8` e cria `vitest.config.ts`
- **Then** `pnpm test:unit` executa sem erro mesmo com 0 testes; `pnpm test:unit:coverage` gera relatório em `coverage/`.

### CA-02 — Cobertura de `isOverdue`

- **Given** `lib/utils/task-status.ts`
- **When** rodam testes unit
- **Then** todas estas combinações estão cobertas: `(status='backlog', end_date=ontem)` → true; `(status='alocada', end_date=hoje)` → false; `(status='em_desenvolvimento', end_date=ontem)` → true; `(status='finalizada', end_date=ontem)` → **false** (concluída não atrasa); `(status='arquivada', end_date=ontem)` → **false** (arquivada não atrasa); `(status='backlog', end_date=amanhã)` → false. **Cobertura de linha = 100%.**

### CA-03 — Refactor de `requireRole` para extrair função pura

- **Given** `lib/auth/require-role.ts` hoje mistura I/O (`getCallerRole`) e regra (`if (!allowed.includes(role))`)
- **When** agente extrai função pura `assertRoleAllowed(caller, allowed)` que recebe um `caller | null` e retorna `RoleGuardError | null`
- **Then** `requireRole` reutiliza a função pura. Comportamento idêntico — confirmado por integration test (Story 07A.2). Função pura tem 100% de cobertura nesta story.

### CA-04 — Cobertura de `assertRoleAllowed`

- **Given** `lib/auth/require-role.ts` com função pura extraída
- **When** rodam testes unit
- **Then** todos cenários cobertos: `caller=null` → `UNAUTHENTICATED`; `caller={role:'efetivo'}, allowed=['admin','coordenador']` → `FORBIDDEN`; `caller={role:'admin'}, allowed=['admin','coordenador']` → `null` (autorizado); `caller={role:'coordenador'}, allowed=['admin']` → `FORBIDDEN`. Mensagem de erro corresponde ao contrato de `RoleGuardError`.

### CA-05 — Extração e cobertura de validações das actions

- **Given** `lib/actions/tasks.ts` hoje faz `data.title.trim()`, `data.description.trim() || null`, decisão `assignee_ids.length > 0 ? 'alocada' : 'backlog'` inline
- **When** agente extrai para `lib/actions/_validation.ts` funções puras: `normalizeTaskInput(data)` (retorna `{title, description, drive_url, ...}` normalizados) e `initialStatusFor(assigneeIds)` (retorna `'alocada' | 'backlog'`)
- **Then** os call sites em `lib/actions/tasks.ts` chamam essas funções. Comportamento idêntico (verificado em Story 07A.2). Funções puras têm 100% cobertura. Casos cobertos: title com whitespace → trimado; title vazio após trim → erro `INVALID_INPUT`; description só whitespace → null; assignee_ids vazio → status `'backlog'`; assignee_ids com 1+ → status `'alocada'`.

### CA-06 — Coerência de datas

- **Given** `TaskModal.tsx` hoje valida `start_date` e coerência start/end ([commit Sprint 03](../../memory/execution/2026-05-07-sprint-03-final.md))
- **When** agente extrai `validateTaskDates(start, end)` em `lib/utils/task-dates.ts` retornando `{ ok: true } | { ok: false, code: 'START_AFTER_END' | 'START_REQUIRED' }`
- **Then** unit tests cobrem: ambas vazias → `START_REQUIRED`; start > end → `START_AFTER_END`; start = end → `ok` (intervalo de 1 dia válido); start < end → `ok`.

### CA-07 — README de testes

- **Given** projeto sem doc de testes
- **When** agente cria `tests/README.md`
- **Then** documenta: como rodar cada suite, pré-requisitos (Docker para integration/e2e), como debugar, link para ADR 0005. Esta story só preenche a seção "Unit"; demais ficam em `<!-- TODO: Story 07A.X -->`.

### CA-08 — Script `typecheck`

- **Given** `package.json` sem `typecheck`
- **When** agente adiciona `"typecheck": "tsc --noEmit"`
- **Then** `pnpm typecheck` passa. Paga débito explícito da [Sprint 03 §5](../../memory/sprints/03/_summary.md).

## 5. Modelagem de Dados

Nenhuma alteração em schema. Refactors de código:

| Arquivo | Operação | Justificativa |
|---|---|---|
| `lib/utils/task-status.ts` | inalterado | já testável |
| `lib/utils/task-dates.ts` | criar | extrair `validateTaskDates` de `TaskModal.tsx` |
| `lib/auth/require-role.ts` | refactor | extrair `assertRoleAllowed` puro; manter `requireRole` como wrapper de I/O |
| `lib/actions/_validation.ts` | criar | extrair `normalizeTaskInput`, `initialStatusFor`, `validateRequiredFields` |
| `lib/actions/tasks.ts` | refactor leve | usar helpers extraídos; comportamento idêntico |
| `components/features/TaskModal.tsx` | refactor leve | usar `validateTaskDates` |

**Os call sites do código de produção devem permanecer com o mesmo contrato externo.** Story 07A.2 verifica que não houve regressão via integration tests.

## 6. Escopo negativo

- ❌ Mocks de Supabase client — vai para integration (Story 07A.2).
- ❌ Testes de componente React (`@testing-library/react`) — fora desta sprint; revisitar pós-07-A se cobertura de UI for insuficiente.
- ❌ Snapshot tests — usamos screenshot diff em E2E (Story 07A.3), não snapshot serializado.
- ❌ Performance/bench — não é foco.
- ❌ Cobertura de `lib/supabase/{client,server,middleware}.ts` — são wrappers thin de SDK; testar I/O de SDK não tem retorno.

## 7. Dependências

- ADR 0005 aceito (passo 0 da Sprint 07-A).
- Nenhuma dependência externa.
- Stories 07A.2, 07A.3, 07A.4 dependem desta para ter `vitest.config.ts` e `tests/README.md` em vigor.
