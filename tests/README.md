# Testes — Quadro CO-FZ

Estratégia em 4 camadas — ver [ADR 0005](../docs/spec/adr/0005-estrategia-de-testes.md).

| Camada | Comando | Pré-requisito | Status |
|---|---|---|---|
| 1. Domain (unit) | `pnpm test:unit` | Node ≥ 20 | ✅ Sprint 07-A.1 — 59 testes |
| 2. Integration | `pnpm test:integration` | Docker + Supabase CLI | ✅ Sprint 07-C.1 (requer Docker) |
| 3. Feature / E2E | `pnpm test:e2e` | Docker + Playwright browsers | ✅ Sprint 07-C.1 (requer Docker) |
| 4. pgTAP | `pnpm test:db` | Docker + Supabase CLI | ✅ Sprint 07-C.1 (requer Docker) |

---

## Camada 1 — Unit (Vitest)

**O que cobre:** lógica pura sem I/O. Helpers (`lib/utils/`), regras puras de Server Actions (`lib/actions/_validation.ts`), gate de role (`lib/auth/require-role.ts` — função pura `assertRoleAllowed`).

```bash
pnpm test:unit            # run único (CI / pre-commit)
pnpm test                 # watch mode
pnpm test:unit:coverage   # com cobertura (coverage/index.html)
```

---

## Camada 2 — Integration (Vitest + Supabase local)

**O que cobre:** RLS × 4 tabelas × 4 personas, Server Actions ponta-a-ponta, triggers via auth.signUp.

**Pré-requisito:** Docker Desktop com WSL integration ativada + Supabase CLI.

### Setup — Camada 2

```bash
supabase start

supabase status
# copie: API URL, anon key, service_role key

export SUPABASE_URL=http://127.0.0.1:54321
export SUPABASE_ANON_KEY=<anon key>
export SUPABASE_SERVICE_ROLE_KEY=<service_role key>
```

### Executar — Camada 2

```bash
pnpm test:integration        # run único
pnpm test:integration:watch  # watch mode
```

### Estrutura — Camada 2

```text
tests/integration/
  globalSetup.ts          ← supabase check + seedPersonas()
  fixtures/
    personas.ts           ← emails/passwords determinísticos
    supabase.ts           ← adminClient + getPersonaSession(name)
    seed.ts               ← cria 3 usuários de teste (idempotente)
    cleanup.ts            ← limpa rows criados por cada teste
  rls/
    tasks.rls.test.ts
    task_assignees.rls.test.ts
    profiles.rls.test.ts
    whitelist.rls.test.ts
  actions/
    tasks.actions.test.ts   ← Server Actions com mock de next/headers
  triggers/
    handle_new_user.test.ts
```

**Mocks usados nos action tests:**

- `react` → `cache` substituído por identity (sem memoização entre testes).
- `next/cache` → `revalidatePath` é no-op.
- `@/lib/supabase/server` → `createClient()` retorna o cliente da persona ativa.

---

## Camada 3 — E2E (Playwright)

**O que cobre:** fluxos Kanban, Admin e Auth callback × 3 personas. Screenshot diff mobile 360×740.

**Pré-requisito:** Node + Playwright browsers (`pnpm exec playwright install --with-deps chromium`).

### Variáveis de ambiente — Camada 3

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
PLAYWRIGHT_BASE_URL=http://localhost:3000  # opcional, default
```

### Executar — Camada 3

```bash
pnpm test:e2e:update      # primeira execução: gera baseline de screenshots
pnpm test:e2e             # runs subsequentes: compara contra baseline
pnpm exec playwright test --ui  # modo debug (UI interativa)
```

### Estrutura — Camada 3

```text
tests/e2e/
  auth.setup.ts          ← cria storageState por persona (project 'setup')
  fixtures/auth.ts       ← loginAs() via Supabase REST
  kanban.spec.ts
  admin.spec.ts
  auth.spec.ts
  .auth/                 ← storageState JSON (gitignored)
  snapshots/             ← baseline mobile (comitado)
```

---

## Camada 4 — pgTAP

**O que cobre:** triggers `handle_new_user`, `check_whitelist` (INSERT + UPDATE), constraints de schema.

**Pré-requisito:** Supabase local rodando com pgTAP instalado.

### Setup — Camada 4

```bash
supabase start
supabase db execute --local "CREATE EXTENSION IF NOT EXISTS pgtap;"
```

### Executar — Camada 4

```bash
pnpm test:db
```

### Estrutura — Camada 4

```text
supabase/tests/
  handle_new_user.sql    ← 6 assertions: role lookup, precedência, audit log
  check_whitelist.sql    ← 5 assertions: INSERT block, domain allow, UPDATE block
  schema_constraints.sql ← 10 assertions: tabelas, RLS, enum, colunas
```

---

## Gates por etapa

| Hook | Comandos |
|---|---|
| pre-commit (rápido) | `pnpm typecheck && pnpm lint && pnpm test:unit` |
| pre-merge (CI) | tudo acima + `pnpm test:integration && pnpm test:db && pnpm test:e2e` |

CI configurado em `.github/workflows/ci.yml` — jobs: typecheck, lint, unit, integration, db, e2e.
