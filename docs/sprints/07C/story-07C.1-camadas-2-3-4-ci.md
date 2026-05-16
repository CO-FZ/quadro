# Story 07C.1: Camadas 2/3/4 + CI

**Sprint:** 07-C — ver [sprint-plan.md](sprint-plan.md)
**ADRs:** [ADR 0005 — Estratégia de testes](../../spec/adr/0005-estrategia-de-testes.md), [ADR 0001](../../spec/adr/0001-rbac-via-supabase-rls.md), [ADR 0003](../../spec/adr/0003-defesa-em-camadas-tasks.md)
**Stories herdadas:** [07A.2](../07A/story-07A.2-integration-tests.md), [07A.3](../07A/story-07A.3-feature-tests.md), [07A.4](../07A/story-07A.4-pgtap-tests.md)
**Bloqueio original:** Docker indisponível no sandbox durante Sprint 07-A.

---

## 1. Visão Geral

Entregar as Camadas 2, 3 e 4 da estratégia de testes (ADR 0005) como bloco único, seguido da configuração de CI. As três camadas compartilham o mesmo `globalSetup` Docker + são entregues na mesma janela, portanto faz mais sentido tratá-las como uma story com seções separadas do que como três stories sequenciais que gerariam overhead de handoff.

**Pré-condição:** Docker disponível no ambiente de execução. Sem Docker, o agente entrega scaffolding completo + CI em modo `no-op` e o humano executa `pnpm test:integration && pnpm test:e2e && pnpm test:db` localmente.

---

## 2. Critérios de Aceite

Os CAs detalhados de cada camada vivem nos arquivos herdados:

- **Camada 2 (integration):** todos os CAs de [07A.2 §4](../07A/story-07A.2-integration-tests.md) — CA-01 a CA-19.
- **Camada 3 (E2E):** todos os CAs de [07A.3 §4](../07A/story-07A.3-feature-tests.md).
- **Camada 4 (pgTAP):** todos os CAs de [07A.4 §4](../07A/story-07A.4-pgtap-tests.md).

CAs adicionais desta story (CI):

### CA-CI-01 — Pipeline CI verde

- **Given** PR aberto ou push em `main`
- **When** GitHub Actions dispara
- **Then** jobs `typecheck`, `lint`, `unit`, `integration`, `db`, `e2e` completam com exit 0. Integration e db jobs sobem Supabase local via `supabase start` no runner.

### CA-CI-02 — Screenshot baseline versionado

- **Given** primeiro run do CI após esta story
- **When** `pnpm test:e2e --update-snapshots` executa no runner
- **Then** arquivos de baseline mobile (360×740) são comitados em `tests/e2e/snapshots/`. PRs futuros comparam contra este baseline.

### CA-CI-03 — ADR 0005 promovido

- **Given** CI verde com todos os jobs
- **When** Final Artifact desta story é aprovado
- **Then** `docs/spec/adr/0005-estrategia-de-testes.md` muda status de `proposto` para `aceito` com data.

---

## 3. Estrutura de arquivos a criar

```
tests/
  integration/
    fixtures/
      supabase.ts           ← createPersonaClient(role)
      seed.ts               ← seedPersonas()
      cleanup.ts            ← cleanup({taskIds})
      server-action.ts      ← runAction() com cache reset
      personas.ts           ← constantes de senha determinística (não usar em prod)
    rls/
      tasks.rls.test.ts
      task_assignees.rls.test.ts
      profiles.rls.test.ts
      whitelist.rls.test.ts
    actions/
      tasks.actions.test.ts
      admin.actions.test.ts
    triggers/
      handle_new_user.test.ts
  integration.config.ts     ← Vitest config com timeout maior
  e2e/
    fixtures/
      auth.ts               ← storageState por persona
    kanban.spec.ts
    admin.spec.ts
    auth.spec.ts
    snapshots/              ← baseline mobile (comitado)
  db/                       ← pgTAP
    handle_new_user.sql
    check_whitelist.sql
    sync_google_metadata.sql
    schema_constraints.sql
  README.md                 ← atualizar com instruções das 3 novas camadas

.github/
  workflows/
    ci.yml

playwright.config.ts        ← novo (raiz)
```

---

## 4. Scripts a adicionar em `package.json`

```json
{
  "test:integration": "vitest run -c tests/integration.config.ts",
  "test:integration:watch": "vitest -c tests/integration.config.ts",
  "test:e2e": "playwright test",
  "test:e2e:update": "playwright test --update-snapshots",
  "test:db": "supabase test db"
}
```

---

## 5. CI: jobs e ordem

```yaml
# .github/workflows/ci.yml (esboço)
jobs:
  typecheck:   runs-on: ubuntu-latest
  lint:        runs-on: ubuntu-latest
  unit:        runs-on: ubuntu-latest
  integration: runs-on: ubuntu-latest   # sobe supabase local (Docker)
  db:          runs-on: ubuntu-latest   # supabase test db
  e2e:         runs-on: ubuntu-latest   # playwright + supabase local

# typecheck e lint paralelos.
# unit paralelo com integration/db/e2e.
# integration, db, e2e podem ser paralelos entre si
# (cada job tem seu próprio supabase start + db reset).
```

---

## 6. Dependências externas

- Docker disponível no runner (GitHub-hosted `ubuntu-latest` tem Docker).
- `supabase` CLI disponível via `npx supabase` ou instalação no runner.
- `@playwright/test` adicionado a `devDependencies` (`pnpm add -D @playwright/test`).
- Browsers Playwright instalados no runner: `npx playwright install --with-deps chromium`.
- Extensão `pgtap` disponível no Supabase local (instalar via migration de teste ou `supabase/tests/`).

---

## 7. Escopo negativo

- ❌ Visual regression desktop — só mobile 360×740.
- ❌ Testes da Edge Function `sync-sheets` — escopo separado.
- ❌ Performance benchmarks.
- ❌ Refactor de código de produto se teste expor bug — registrar como ticket separado.
