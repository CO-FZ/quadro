# Story 11.1: Estabilizar `pnpm test:integration` (Camada 2 verde)

**Sprint:** 11 — ver [sprint-plan.md](sprint-plan.md)
**Stories herdadas:** [07A.2 — Integration tests](../07A/story-07A.2-integration-tests.md), [07C.1 — Camadas 2/3/4 + CI](../07C/story-07C.1-camadas-2-3-4-ci.md)
**ADRs:** [0001](../../spec/adr/0001-rbac-via-supabase-rls.md), [0003](../../spec/adr/0003-defesa-em-camadas-tasks.md), [0005](../../spec/adr/0005-estrategia-de-testes.md)
**Prioridade:** P0
**Status:** ✅ **fechada retroativamente** — fixes já entregues no commit `1e42077` (Sprint pre-08); validação operacional fica a cargo de [Story 11.3](story-11.3-runbook-validacao.md).

---

## 1. Resumo de uma frase

Os dois root causes diagnosticados no Plan Artifact (alias `@/` quebrado e regex CA-18 estreito demais) **já foram corrigidos** pelo commit `1e42077 — feat: allow task creators to assign users and update integration test path and error assertions`. Esta story documenta o fechamento retroativo; a validação que prova a Camada 2 verde fica como Story 11.3 (runbook humano dependente de Docker).

---

## 2. Diagnóstico vs. estado real

### 2.1 Root cause A — `Cannot find package '@/lib/actions/{tasks,admin}'` (7 falhas)

**Estado documentado em `test_output_2.txt` (stale):**

```
Error: Cannot find package '@/lib/actions/tasks' imported from
  tests/integration/actions/tasks.actions.test.ts:70:26
    70| const { createTask } = await import('@/lib/actions/tasks')
```

**Fix já aplicado em `1e42077`:**

```diff
--- a/tests/integration.config.ts
+++ b/tests/integration.config.ts
@@ -4,7 +4,7 @@ import path from 'node:path'
 export default defineConfig({
   resolve: {
     alias: {
-      '@': path.resolve(__dirname, '.'),
+      '@': path.resolve(__dirname, '../'),
     },
   },
```

O alias antes apontava para `tests/` (não havia `tests/lib/actions/...`) — agora aponta para o repo root (onde `lib/actions/{tasks,admin}.ts` existem). Todos os `await import('@/lib/actions/...')` dinâmicos devem resolver após esse commit.

### 2.2 Root cause B — Mensagem genérica do trigger (1 falha, CA-18)

**Estado documentado em `test_output_2.txt` (stale):**

```
AssertionError: expected 'Database error saving new user' to match
  /acesso negado|not authorized|denied/i
```

**Fix já aplicado em `1e42077`:**

```diff
--- a/tests/integration/triggers/handle_new_user.test.ts
+++ b/tests/integration/triggers/handle_new_user.test.ts
@@ -72,7 +72,7 @@ it('CA-18: signup with non-whitelisted email → auth error, no profile', async
   expect(error).not.toBeNull()
-  expect(error!.message).toMatch(/acesso negado|not authorized|denied/i)
+  expect(error!.message).toMatch(/acesso negado|not authorized|denied|database error saving new user/i)
```

Razão: o GoTrue mascara mensagens de DB quando o trigger faz `RAISE EXCEPTION` (comportamento intencional, evita leak de schema). O fix aceita tanto a mensagem específica quanto a genérica do GoTrue, sem alterar o trigger.

---

## 3. Critérios de Aceite (retroativos)

### CA-01 — Fix do alias de path

- **Given** os testes de `tests/integration/actions/tasks.actions.test.ts` usavam `await import('@/lib/actions/{tasks,admin}')`.
- **When** o arquivo `tests/integration.config.ts` é inspecionado.
- **Then** `resolve.alias['@']` aponta para `path.resolve(__dirname, '../')`. ✅ `1e42077`.

### CA-02 — Regex CA-18 aceita mensagem do GoTrue

- **Given** o trigger `handle_new_user` faz `RAISE EXCEPTION` que GoTrue mascara como `"Database error saving new user"`.
- **When** `tests/integration/triggers/handle_new_user.test.ts:75` é inspecionado.
- **Then** o regex aceita `database error saving new user` (case-insensitive). ✅ `1e42077`.

### CA-03 — Sem regressão em Camada 1

- **Given** as mudanças.
- **When** `pnpm test:unit` executa.
- **Then** ≥ 59 testes passando. ✅ verificado em sessões posteriores (Sprint 09/10) que mantiveram 59/59.

### CA-04 — Validação operacional da Camada 2

- **Bloqueado neste ambiente** (Docker daemon ausente no sandbox de execução do agente). Fica como CA da Story 11.3, sob responsabilidade humana.

---

## 4. Arquivos tocados (retroativo)

Nenhum nesta sessão. Tudo já entregue em `1e42077`:

- `tests/integration.config.ts` — alias `@/` apontando para repo root.
- `tests/integration/triggers/handle_new_user.test.ts` — regex de CA-18 estendido.
- `tests/integration/actions/tasks.actions.test.ts` — pequena limpeza de whitespace (linha em branco removida em CA-07).
- Adicionalmente nesse mesmo commit: `supabase/migrations/20260516130000_allow_task_creator_to_assign.sql` (RLS para criador assignar usuários — escopo de Sprint pré-08, não rastreado em sprint-plan).

---

## 5. Observação metodológica

O `test_output.txt` e o `test_output_2.txt` no repo root são **artefatos pré-`1e42077`** (commitados nesse mesmo PR como evidência da falha que motivou o fix). Eles **não refletem o estado atual** da suíte. Story 11.3 define como gerar evidência atualizada e — se o resultado for verde — propor a remoção desses arquivos como cleanup.

---

## 6. Escopo negativo

- ❌ Validar operacionalmente (`pnpm test:integration` exit 0) — escopo da Story 11.3.
- ❌ Promover ADR 0005 a `aceito` — depende da validação acima. Story 11.3 inclui o passo de promoção como o último item do runbook (não promover antes da suíte sair verde).
- ❌ Remover `test_output*.txt` do repo — sugestão de cleanup, decisão humana na Story 11.3.
