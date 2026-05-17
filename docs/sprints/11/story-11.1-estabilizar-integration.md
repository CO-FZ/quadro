# Story 11.1: Estabilizar `pnpm test:integration` (Camada 2 verde)

**Sprint:** 11 — ver [sprint-plan.md](sprint-plan.md)
**Stories herdadas:** [07A.2 — Integration tests](../07A/story-07A.2-integration-tests.md), [07C.1 — Camadas 2/3/4 + CI](../07C/story-07C.1-camadas-2-3-4-ci.md)
**ADRs:** [0001 — RBAC via Supabase RLS](../../spec/adr/0001-rbac-via-supabase-rls.md), [0003 — Defesa em camadas (tasks)](../../spec/adr/0003-defesa-em-camadas-tasks.md), [0005 — Estratégia de testes](../../spec/adr/0005-estrategia-de-testes.md)
**Prioridade:** P0
**Pré-condição:** Docker + Supabase CLI disponíveis no ambiente do agente. Sem isso, story bloqueada por gate humano.

---

## 1. Visão Geral

O scaffolding da Camada 2 (integration) foi entregue no commit `b01c52b`, mas a suíte está **vermelha** desde então. Esta story não cria testes novos: identifica a causa de cada falha atual e a corrige de modo que `pnpm test:integration` saia com exit 0.

**Estado atual capturado em `test_output_2.txt` (último run):**

```
Test Files  2 failed | 4 passed (6)
     Tests  8 failed | 29 passed (37)
```

As 8 falhas se dividem em 2 categorias:

---

## 2. Falhas a resolver

### 2.1 Categoria A — `Cannot find package '@/lib/actions/{tasks,admin}'` (7 falhas)

**Testes afetados (todos em `tests/integration/actions/tasks.actions.test.ts`):**

| CA | Cenário | Import quebrado |
|----|---------|-----------------|
| CA-06 | efetivo creates task → ok | `@/lib/actions/tasks` |
| CA-07 | createTask with assignees → alocada | `@/lib/actions/tasks` |
| CA-08 | efetivo updateTask → FORBIDDEN | `@/lib/actions/tasks` |
| CA-09 | efetivo updateTaskStatus finalizada → FORBIDDEN | `@/lib/actions/tasks` |
| CA-10 | efetivo (assignee) moves backlog → ... → em_desenvolvimento | `@/lib/actions/tasks` |
| CA-14 | bulk add 4 entries via csv/newline/semicolon | `@/lib/actions/admin` |
| CA-15 | duplicate entry → ok with ignore count | `@/lib/actions/admin` |

**Evidência:**
```
Error: Cannot find package '@/lib/actions/tasks' imported from
  /home/.../tests/integration/actions/tasks.actions.test.ts
  ❯ tests/integration/actions/tasks.actions.test.ts:70:26
    70| const { createTask } = await import('@/lib/actions/tasks')
```

**Observações relevantes:**

- Arquivos físicos existem: `lib/actions/tasks.ts` e `lib/actions/admin.ts` (ambos começam com `'use server'`).
- Alias está declarado em `tests/integration.config.ts`:
  ```typescript
  resolve: { alias: { '@': path.resolve(__dirname, '../') } }
  ```
- `pnpm test:unit` (que também usa `@`) está verde — então o alias funciona em algum lugar.
- A diferença: testes unit usam imports **estáticos** (`import x from '@/...'`); o teste de actions usa imports **dinâmicos** (`await import('@/...')`) para permitir hoisting de mocks. Vitest 4 + dynamic import + alias é a hipótese principal de root cause.

**Linha de investigação sugerida (não prescritiva):**

1. Reproduzir local: `pnpm test:integration tasks.actions.test.ts` e confirmar erro idêntico.
2. Testar se import estático no topo do arquivo (após `vi.mock`) resolve — se sim, problema é dynamic import + alias.
3. Se confirmado, opções:
   - (preferida) Reorganizar mocks com `vi.hoisted` e usar imports estáticos.
   - Adicionar `resolve.alias` redundante no `vite.config` raiz (se existir) ou no `tsconfig` paths sincronizado via plugin.
   - Último recurso: substituir `'@/lib/actions/tasks'` por path relativo `'../../../lib/actions/tasks'` no import dinâmico.

### 2.2 Categoria B — Mensagem genérica do trigger (1 falha)

**Teste:** `tests/integration/triggers/handle_new_user.test.ts` → `CA-18: signup with non-whitelisted email → auth error, no profile`

**Evidência:**
```
AssertionError: expected 'Database error saving new user' to match
  /acesso negado|not authorized|denied/i

- Expected: /acesso negado|not authorized|denied/i
+ Received: "Database error saving new user"

❯ tests/integration/triggers/handle_new_user.test.ts:75:26
    73|   // The trigger raises an exception → GoTrue returns error
    74|   expect(error).not.toBeNull()
    75|   expect(error!.message).toMatch(/acesso negado|not authorized|denied/i)
```

**Observações relevantes:**

- O assert sobre `error` não ser null **passa**. Ou seja: o trigger está bloqueando o signup. O que falha é o **conteúdo da mensagem**.
- `"Database error saving new user"` é a mensagem default do GoTrue quando o trigger faz `RAISE EXCEPTION` sem mensagem específica reconhecida pela camada de auth.
- Possíveis root causes:
  - Trigger `handle_new_user` (em `supabase/migrations/20260507000002_*` ou rewrite em `20260510000001_*`) usa `RAISE EXCEPTION` sem `SQLSTATE` ou prefixo que o GoTrue propague.
  - GoTrue intencionalmente mascara mensagens de DB para evitar leak de schema. Nesse caso o teste é que está errado.

**Linha de investigação sugerida (não prescritiva):**

1. Ler a versão atual do trigger `handle_new_user` em `supabase/migrations/`.
2. Tentar `RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'acesso negado'` — verificar se GoTrue propaga.
3. Se GoTrue mascarar mesmo assim, **ajustar o regex do teste** para aceitar tanto `/acesso negado/i` quanto `/database error saving new user/i` (com comentário explicando a opacidade do GoTrue). Não promover ADR adicional por isso — é caracterítica da plataforma.
4. Se a investigação revelar que o trigger faz `RAISE EXCEPTION 'x'` sem `ERRCODE`, propor migration aditiva (P1) e — para não escopo-creep esta story — aceitar o ajuste no teste como solução; abrir débito separado.

---

## 3. Critérios de Aceite

### CA-01 — `pnpm test:integration` verde

- **Given** Docker + Supabase local funcionais.
- **When** `pnpm test:integration` executa.
- **Then** exit 0 e ≥ 37 testes passando, 0 falhando.

### CA-02 — Sem regressão na Camada 1

- **Given** mudanças aplicadas.
- **When** `pnpm test:unit` executa.
- **Then** ≥ 59 testes passando, sem regressão vs. baseline.

### CA-03 — `typecheck` + `lint` verdes

- **Given** mudanças aplicadas.
- **When** `pnpm typecheck && pnpm lint` executam.
- **Then** ambos exit 0.

### CA-04 — Sem mudança de comportamento de produto

- **Given** os fixes desta story.
- **When** os diffs em `lib/`, `app/`, `components/`, `src/` são revisados.
- **Then** zero alteração em código de produto **ou** alteração restrita a 1 migration aditiva no trigger (com nota explícita no Final Artifact). Mudanças preferidas: `tests/integration/**` e/ou `tests/integration.config.ts`.

### CA-05 — Health-check Camadas 3/4

- **Given** Camada 2 verde.
- **When** `pnpm test:e2e --list` e `pnpm test:db` executam.
- **Then** ambos ao menos **iniciam sem erro de configuração** (browsers/pgTAP podem estar ausentes — registrar como débito P1 em `_summary.md` se for o caso). Não é compromisso de passar testes E2E ou pgTAP.

---

## 4. Arquivos esperados no diff

**Modificação esperada (provável):**
- `tests/integration/actions/tasks.actions.test.ts` — reorganização de mocks / imports estáticos com `vi.hoisted`.
- `tests/integration.config.ts` — possível ajuste em `resolve.alias` ou plugin de paths.
- `tests/integration/triggers/handle_new_user.test.ts` — ajuste de regex em CA-18 (se confirmado mascaramento do GoTrue).

**Modificação contingente (só se investigação confirmar):**
- `supabase/migrations/2026...NN_fix_handle_new_user_error_message.sql` — migration aditiva alterando `RAISE EXCEPTION` do trigger. **Só se houver gate humano de aprovação durante a story.**

---

## 5. Escopo negativo

- ❌ Criar testes novos — story é só estabilização.
- ❌ Mudar comportamento de Server Actions ou de RLS para acomodar testes — se o teste expõe bug de produto, é ticket separado, não esta story.
- ❌ Promover ADR 0005 — escopo da Story 11.2.
- ❌ Cobrir `tests/e2e/**` ou `supabase/tests/**` — apenas health-check (CA-05).
- ❌ Fix de race-condition `LAST_ADMIN` ou outros débitos P2/P3 herdados.
