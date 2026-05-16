# Testing Strategy — Quadro CO-FZ

**Fonte:** [ADR 0005](../spec/adr/0005-estrategia-de-testes.md) (status: `proposto` — promoção a `aceito` pendente de validação com Docker)
**Documentação completa:** [tests/README.md](../../tests/README.md)

---

## Pirâmide de testes (4 camadas)

| Camada | Tipo | Runner | Pré-requisito | Status |
|--------|------|--------|---------------|--------|
| 1 — Domain | Unit | Vitest | Node ≥ 20 | ✅ 59 testes |
| 2 — Integration | Vitest + Supabase local | Vitest | Docker + Supabase CLI | ✅ scaffolded |
| 3 — Feature/E2E | Playwright | Playwright | Docker + browsers | ✅ scaffolded |
| 4 — pgTAP | SQL | Supabase CLI | Docker + pgTAP | ✅ scaffolded |

---

## Comandos

```bash
pnpm test:unit              # camada 1 (CI e pre-commit)
pnpm test:integration       # camada 2 (requer Docker)
pnpm test:e2e               # camada 3 (requer Docker + Next.js)
pnpm test:db                # camada 4 (requer Docker)

pnpm test:unit:coverage     # cobertura HTML em coverage/
```

---

## O que cada camada cobre

**Camada 1 — Unit:**
- Helpers puros em `lib/utils/`
- Validações em `lib/actions/_validation.ts`
- Gate de role `assertRoleAllowed` em `lib/auth/require-role.ts`

**Camada 2 — Integration:**
- RLS × 4 tabelas × 4 personas
- Server Actions ponta-a-ponta com mock de `next/headers`
- Trigger `handle_new_user` via `auth.signUp`

**Camada 3 — E2E:**
- Fluxos Kanban, Admin e Auth × 3 personas
- Screenshot diff mobile 360×740 (Galaxy S8 baseline)

**Camada 4 — pgTAP:**
- Trigger `handle_new_user` (6 assertions)
- Trigger `check_whitelist` (5 assertions)
- Schema constraints (10 assertions)

---

## Setup local (Camadas 2/3/4)

Requer Docker Desktop com WSL integration ativada.

```bash
supabase start
supabase status  # copie: API URL, anon key, service_role key

export SUPABASE_URL=http://127.0.0.1:54321
export SUPABASE_ANON_KEY=<anon key>
export SUPABASE_SERVICE_ROLE_KEY=<service_role key>

pnpm test:integration
pnpm test:db
pnpm test:e2e
```

---

## Pendências

- ADR 0005 promover a `aceito` após primeira execução verde das Camadas 2/3/4 com Docker.
- Visual regression desktop (hoje só mobile) — backlog P3.
