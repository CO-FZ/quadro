# Testes — Quadro CO-FZ

Estratégia em 4 camadas — ver [ADR 0005](../docs/spec/adr/0005-estrategia-de-testes.md).

| Camada | Comando | Pré-requisito | Status |
|---|---|---|---|
| 1. Domain (unit) | `pnpm test:unit` | Node ≥ 20 | ✅ Sprint 07-A.1 |
| 2. Integration | `pnpm test:integration` | Docker + Supabase CLI | ⬜ Sprint 07-A.2 |
| 3. Feature / E2E | `pnpm test:e2e` | Docker + Playwright browsers | ⬜ Sprint 07-A.3 |
| 4. pgTAP | `pnpm test:db` | Docker + Supabase CLI | ⬜ Sprint 07-A.4 |

---

## Camada 1 — Unit (Vitest)

**O que cobre:** lógica pura sem I/O. Helpers (`lib/utils/`), regras puras de Server Actions (`lib/actions/_validation.ts`), gate de role (`lib/auth/require-role.ts` — função pura `assertRoleAllowed`).

**O que NÃO cobre:** chamadas a Supabase, RLS, banco. Isso vai para Camada 2.

### Como rodar

```bash
# Watch mode (desenvolvimento)
pnpm test

# Run único (CI / pre-commit)
pnpm test:unit

# Com coverage
pnpm test:unit:coverage
```

Coverage report em `coverage/index.html` após `pnpm test:unit:coverage`.

### Convenções

- Arquivos em `tests/unit/<mesma-estrutura-do-código>/<nome>.test.ts`. Ex: `lib/utils/task-status.ts` é coberto por `tests/unit/lib/utils/task-status.test.ts`.
- Cada `describe` mapeia para uma função pública. Cada `it` é um cenário.
- Sem mocks de Supabase nesta camada. Se um teste exige Supabase, ele pertence à Camada 2.
- `import { describe, it, expect } from 'vitest'` (sem globals).

### Cobertura mínima

- `lib/utils/`: ≥ 80% das funções.
- `lib/auth/require-role.ts` (parte pura `assertRoleAllowed`): 100%.
- `lib/actions/_validation.ts`: 100%.

---

## Camada 2 — Integration

⬜ A entregar em Story 07A.2. Veja [docs/sprints/07A/story-07A.2-integration-tests.md](../docs/sprints/07A/story-07A.2-integration-tests.md).

---

## Camada 3 — Feature / E2E

⬜ A entregar em Story 07A.3. Veja [docs/sprints/07A/story-07A.3-feature-tests.md](../docs/sprints/07A/story-07A.3-feature-tests.md).

---

## Camada 4 — pgTAP

⬜ A entregar em Story 07A.4. Veja [docs/sprints/07A/story-07A.4-pgtap-tests.md](../docs/sprints/07A/story-07A.4-pgtap-tests.md).

---

## Gates por etapa

| Hook | Comandos |
|---|---|
| pre-commit (rápido) | `pnpm typecheck && pnpm lint && pnpm test:unit` |
| pre-merge (CI) | tudo acima + `pnpm test:integration && pnpm test:db && pnpm test:e2e` |

CI será configurado na entrega da Camada 3 (Story 07A.3 §"CI integrado").
