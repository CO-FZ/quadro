# Estratégia de Testes Automatizados

> Pirâmide pragmática para Next.js + Tailwind, alinhada com o fluxo de subagentes do Antigravity. Objetivo: detectar regressão **antes** do humano revisar, e dar ao agente sinal claro de "tarefa pronta".

---

## Pirâmide de testes

```
                          ┌──────────────┐
                          │  E2E Critic  │  ← poucos, lentos, alto valor
                          │  (Playwright)│
                          └──────┬───────┘
                    ┌────────────┴────────────┐
                    │   Integração (Vitest)    │  ← Server Actions com DB de teste
                    └────────────┬─────────────┘
                ┌────────────────┴────────────────┐
                │   Componente (Testing Library)   │  ← UI behavior
                └────────────────┬─────────────────┘
            ┌────────────────────┴────────────────────┐
            │   Unit (Vitest)                          │  ← lógica pura, schemas, utils
            └─────────────────────────────────────────┘
```

**Distribuição esperada (por número de testes):**

| Camada | % alvo |
|--------|--------|
| Unit | 60% |
| Componente | 20% |
| Integração | 15% |
| E2E | 5% |

**Distribuição esperada (por tempo de CI):**

| Camada | % alvo |
|--------|--------|
| Unit | 20% |
| Componente | 20% |
| Integração | 30% |
| E2E | 30% |

> Se a pirâmide está invertida (muito E2E, pouco unit), o feedback fica lento e flaky.

---

## Stack

| Tipo | Ferramenta | Justificativa |
|------|------------|---------------|
| Unit | **Vitest** | rápido, ESM, compatível com Next |
| Componente | **Vitest + Testing Library** | testa UI como o usuário a usa |
| Integração | **Vitest + Postgres de teste (Testcontainers ou DB ephemeral)** | valida Server Actions com DB real |
| E2E | **Playwright** | navegador real, tracing, screenshots |
| Acessibilidade | **axe-core / pa11y** | regressão de a11y automatizada |
| Performance | **Lighthouse CI** | budgets do PRD |
| Visual | **browser subagent do Antigravity** | smoke visual durante dev |

---

## 1. Unit (Vitest)

**O que testar:**

- Funções puras em `lib/utils`
- Schemas Zod (casos válidos e inválidos)
- Reducers e máquinas de estado
- Funções de domínio sem I/O

**Localização:** `tests/unit/<feature>.test.ts`

**Exemplo:**

```ts
// tests/unit/inspections.schema.test.ts
import { describe, it, expect } from 'vitest';
import { CreateInspectionInput } from '@/app/(app)/inspections/actions';

describe('CreateInspectionInput', () => {
  it('aceita input válido', () => {
    const result = CreateInspectionInput.safeParse({
      buildingId: '550e8400-e29b-41d4-a716-446655440000',
      notes: 'estrutura ok',
    });
    expect(result.success).toBe(true);
  });

  it('rejeita notes acima de 2000 chars', () => {
    const result = CreateInspectionInput.safeParse({
      buildingId: '550e8400-e29b-41d4-a716-446655440000',
      notes: 'x'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});
```

**Meta de cobertura:** ≥ 85% em `lib/` e em schemas Zod. Bloqueia merge se cair.

---

## 2. Componente (Testing Library)

**O que testar:**

- Comportamento (clicks, foco, navegação por teclado)
- Estados (loading, vazio, erro, sucesso)
- Acessibilidade básica (roles, labels)

**Não testar:** estilo visual, classes Tailwind, snapshots gigantes.

**Exemplo:**

```tsx
// tests/unit/components/inspection-form.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InspectionForm } from '@/components/features/inspections/form';

it('mostra erro quando submete vazio', async () => {
  render(<InspectionForm />);
  await userEvent.click(screen.getByRole('button', { name: /criar/i }));
  expect(await screen.findByRole('alert')).toHaveTextContent(/obrigatório/i);
});
```

---

## 3. Integração (Server Actions)

**O que testar:**

- Server Actions executadas contra DB efêmero (não mock).
- Auth: chamada sem usuário → erro.
- Persistência: dados gravados corretamente.
- Idempotência (quando aplicável).

**Setup recomendado:**

- Testcontainers ou banco efêmero por suite.
- Migrations rodadas no setup.
- Cleanup entre testes.

**Exemplo:**

```ts
// tests/integration/inspections.action.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createInspection } from '@/app/(app)/inspections/actions';
import { createTestUser, resetDb } from '@/tests/helpers';

describe('createInspection', () => {
  beforeEach(async () => { await resetDb(); });

  it('rejeita não autenticado', async () => {
    await expect(createInspection(new FormData())).rejects.toThrow('UNAUTHORIZED');
  });

  it('cria registro válido', async () => {
    await createTestUser({ role: 'inspector' });
    const fd = new FormData();
    fd.set('buildingId', '550e8400-e29b-41d4-a716-446655440000');
    const res = await createInspection(fd);
    expect(res.ok).toBe(true);
  });
});
```

---

## 4. E2E (Playwright)

**O que testar:**

- **Apenas fluxos críticos** do PRD (P0).
- Login → ação principal → resultado visível.
- Casos de erro de alto impacto (pagamento falha, sessão expirada).

**Não testar:** todas as combinações. E2E é caro.

**Estrutura:**

```
tests/e2e/
  auth.spec.ts
  inspections.spec.ts
  fixtures/
    users.ts
playwright.config.ts
```

**Exemplo:**

```ts
// tests/e2e/inspections.spec.ts
import { test, expect } from '@playwright/test';

test('inspetor cria inspeção fim-a-fim', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('inspector@example.com');
  await page.getByLabel('Senha').fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole('button', { name: /entrar/i }).click();

  await page.getByRole('link', { name: /nova inspeção/i }).click();
  await page.getByLabel('Edifício').selectOption({ label: 'Bloco A' });
  await page.getByLabel('Notas').fill('Estrutura sem rachaduras visíveis.');
  await page.getByRole('button', { name: /criar/i }).click();

  await expect(page.getByRole('heading', { name: /inspeção criada/i })).toBeVisible();
});
```

**Configuração-chave:**

- `retries: 2` apenas no CI (não local).
- `trace: 'retain-on-failure'`.
- `video: 'retain-on-failure'`.
- Reporter HTML + JUnit para CI.

**Tempo de execução alvo:** suíte E2E completa < 5 minutos.

---

## 5. Acessibilidade automatizada

```ts
// tests/e2e/a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = ['/', '/dashboard', '/inspections/new'];

for (const route of routes) {
  test(`a11y: ${route}`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}
```

> Falha o build se houver violação `serious` ou `critical`.

---

## 6. Performance — Lighthouse CI

`.lighthouserc.json`:

```json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 0.9 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }]
      }
    }
  }
}
```

---

## 7. Testes de segurança

| Item | Como |
|------|------|
| Dependências vulneráveis | `pnpm audit` no CI; `--audit-level=high` falha |
| SAST | Semgrep ou similar com regras OWASP top-10 |
| Secrets em commit | `gitleaks` em pre-commit + CI |
| Headers de segurança | teste E2E que valida CSP/HSTS no response |

---

## 8. Pipeline de CI sugerido

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push: { branches: [main] }
  pull_request:

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: lts/*, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test:unit
      - run: pnpm audit --audit-level=high
      - name: gitleaks
        uses: gitleaks/gitleaks-action@v2

  integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: test }
        options: >-
          --health-cmd pg_isready --health-interval 10s
          --health-timeout 5s --health-retries 5
        ports: ['5432:5432']
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: lts/*, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm db:migrate
        env: { DATABASE_URL: postgres://postgres:test@localhost:5432/postgres }
      - run: pnpm test:integration
        env: { DATABASE_URL: postgres://postgres:test@localhost:5432/postgres }

  e2e:
    runs-on: ubuntu-latest
    needs: [quality, integration]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: lts/*, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps
      - run: pnpm build
      - run: pnpm exec playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  lighthouse:
    runs-on: ubuntu-latest
    needs: [e2e]
    steps:
      - uses: actions/checkout@v4
      - run: npx --yes @lhci/cli@0.13.x autorun
```

---

## 9. Como o agente trabalha com testes

**Regra de ouro:** uma story só está "pronta" quando os testes que ela introduz **passam localmente**, e os testes existentes **continuam passando**.

**Fluxo recomendado para o agente principal:**

1. Antes de escrever código, escreva (ou planeje) os testes que vão validar o critério de aceite.
2. Implemente o código.
3. Rode `pnpm typecheck && pnpm lint && pnpm test:unit`.
4. Se a story toca UI, invoque o **browser subagent** para smoke visual.
5. Se a story toca fluxo crítico do PRD, adicione/atualize um teste E2E.
6. Anexe ao Artifact final: lista de testes adicionados e screenshot/saída relevante.

**TDD vs. test-after:**

- TDD obrigatório para: lógica de domínio, validações, máquinas de estado.
- Test-after aceitável para: UI, integrações com APIs externas instáveis.

---

## 10. Métricas de saúde da suíte

Acompanhe no Knowledge Base do projeto:

| Métrica | Alvo |
|---------|------|
| Cobertura unit em `lib/` | ≥ 85% |
| Tempo total de CI | < 10 min |
| Flakiness E2E | < 1% (medir por re-runs em main) |
| Testes pulados (`.skip`) | 0, ou justificativa em comentário |

> Se algum dos alvos furar, abrir story de "saúde de testes" na próxima sprint.
