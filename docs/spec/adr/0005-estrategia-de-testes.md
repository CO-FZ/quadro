# ADR 0005 — Estratégia de testes em camadas (domain + integration + feature + pgTAP)

**Status:** proposto
**Data:** 2026-05-09
**Decisores:** Eng Carlos Eduardo
**Substitui:** —
**Substituído por:** —
**Relaciona-se com:** [ADR 0001 — RBAC via Supabase RLS](0001-rbac-via-supabase-rls.md), [ADR 0002 — Whitelist trigger](0002-whitelist-emails-trigger.md), [ADR 0003 — Defesa em camadas](0003-defesa-em-camadas-tasks.md)

---

## Contexto

O projeto chega à Sprint 06 com **0% de cobertura de testes automatizados**. Toda regra de domínio, RLS, trigger Postgres e fluxo de UI depende de smoke manual. Os `_summary.md` das Sprints 02, 03 e 04 registram explicitamente esse débito como "vira sprint dedicada":

- [Sprint 02 §5](../../memory/sprints/02/_summary.md): "Cobertura de testes: 0% — projeto ainda sem suite. Débito carregado para sprint dedicada."
- [Sprint 03 §6](../../memory/sprints/03/_summary.md): "Não há suite de testes ainda. Cada mudança em policy de RLS ou Server Action precisa smoke manual. Considerar Sprint dedicada."
- [Sprint 04 §7](../../memory/sprints/04/_summary.md): "Sem teste automatizado para trigger Postgres (`handle_new_user`). Considerar adicionar pgTAP em sprint dedicada."

Sem testes, três classes de regressão são impossíveis de detectar antes da produção:

1. **Defesa em camadas (ADR 0003) frágil.** Se um refactor remover `requireRole` de uma Server Action ou desabilitar uma policy RLS, nada falha em CI — só explode em runtime, idealmente antes de chegar em prod.
2. **Triggers Postgres opacos.** `handle_new_user`, `check_whitelist`, `sync_google_metadata` rodam dentro do banco. Mudança em qualquer um deles hoje exige humano logar com 2+ contas Google e confirmar comportamento.
3. **UI mobile não validada.** CA-06 da Sprint 03 (validação visual em viewport 360x740) ficou em débito porque o browser subagent não estava disponível no Claude Code.

Quatro alternativas foram consideradas:

1. **Apenas Vitest unit.** Cobre domínio, mas nada de RLS/trigger/UI. Cobertura ilusória.
2. **Apenas Playwright E2E.** Cobre fluxo de usuário, mas lento, frágil em CI e não pega regressão de regra pura sem subir banco/UI inteira.
3. **Vitest + Playwright (sem pgTAP).** Triggers são exercitados indiretamente via integration tests, mas SQL puro fica sem teste. Aceitável se o número de triggers fosse 1; somos 3+ e crescendo.
4. **Vitest + Playwright + pgTAP.** Cobre as três camadas de risco. Custo: aprender pgTAP (extensão simples, sintaxe SQL).

---

## Decisão

Adotar **(4) — três camadas de testes complementares**, cada uma com escopo, runtime e gate explícitos:

### Camada 1 — Domain (Vitest unit)

**O que cobre:** lógica pura sem I/O. Helpers (`lib/utils/task-status.ts`), validações de input das Server Actions (regras de trim/normalização/coerência de datas), funções puras de derivação (computar `isOverdue`, badges de role, status inicial baseado em assignees).

**O que NÃO cobre:** chamadas a Supabase, Server Actions completas, RLS, banco.

**Runtime:** Node 20+, Vitest com `environment: 'node'`. Sem mocks de Supabase nesta camada — o que precisa de Supabase vai para integration.

**Gate:** `pnpm test:unit` deve passar antes de qualquer commit em `main`. Cobertura mínima inicial: 80% das funções de `lib/utils/` e 100% de `lib/auth/require-role.ts` (excluindo I/O memoizado por `cache()`).

### Camada 2 — Integration (Vitest + Supabase local)

**O que cobre:**
- **RLS por persona.** Para cada policy de `tasks`, `task_assignees`, `profiles`, `whitelist`: subir 3 sessões (admin, coordenador, efetivo + 1 anônima) e verificar que cada operação CRUD retorna o esperado (sucesso ou negação).
- **Server Actions ponta-a-ponta.** `createTask`, `updateTask`, `updateTaskStatus`, `archiveTask`, `deleteTask`, `updateTaskAssignees`, `addToWhitelist`, `removeFromWhitelist`, `updateUserRole`, `archiveUser`, `restoreUser` — chamadas via fixture com session real, banco real local.
- **Spoofing.** `created_by` ≠ `auth.uid()` no INSERT é bloqueado pelo `WITH CHECK`. Cliente tentando fazer self-INSERT em `task_assignees` com `user_id` de outro também bloqueado.
- **Last-admin guard transacional.** Cenário com 2 admins simultâneos rebaixando um ao outro (race) — documenta o débito conhecido.

**O que NÃO cobre:** UI, navegador, screenshots.

**Runtime:** `supabase start` antes da suite (sobe Postgres + auth + studio em Docker). Vitest com `environment: 'node'`, fixture cria 3 perfis seed (admin/coord/efetivo) usando o admin SDK e gera 3 anon clients com session JWT real. Cada teste roda em transação que faz rollback no `afterEach` para isolamento.

**Gate:** `pnpm test:integration` em CI dedicado (mais lento; não roda em pre-commit). Roda obrigatoriamente em pre-merge.

### Camada 3 — Feature / E2E (Playwright + screenshot diff)

**O que cobre:**
- **Fluxo Kanban.** Criar tarefa via FAB; arrastar card entre colunas; tentar arrastar para Finalizada como efetivo (deve voltar com Toast); editar/arquivar/excluir como coord/admin.
- **Fluxo Admin.** Bulk add na whitelist; alterar role; tentativa de rebaixar último admin (Toast LAST_ADMIN); arquivar usuário (soft-delete); restaurar.
- **Fluxo Auth.** Login Google mockado (Supabase Auth helpers); rejeição de email não-whitelisted com mensagem amigável (paga débito do ADR 0002 §"Riscos a fechar").
- **Validação visual mobile.** Viewport 360x740 (Galaxy S8) em `/kanban`, `/dashboard`, `/profile`, `/admin`; screenshot diff contra baseline em `tests/__screenshots__/`. **Paga CA-06 da Story 03.**

**O que NÃO cobre:** detalhe interno de Server Action ou SQL — esses são regression tests da Camada 2.

**Runtime:** Playwright com 2 projects: `chromium` (desktop 1280x800) e `mobile-chrome` (360x740). Server Next em modo `production` build, banco Supabase local. Testes usam contas seed pré-criadas com cookie de sessão injetado (sem hit em Google OAuth real).

**Gate:** `pnpm test:e2e` em CI dedicado. Screenshot diff falha se houver delta > 0.1 (ajustável por baseline). Update de baseline exige PR explícito (`pnpm test:e2e --update-snapshots`).

### Camada 4 — pgTAP (database-only)

**O que cobre:**
- Triggers Postgres em isolamento: `handle_new_user`, `check_whitelist`, `sync_google_metadata`, `handle_updated_at`.
- Casos de borda dos triggers: email não-whitelisted é rejeitado; entry de domínio aplica role correta; precedência email > domínio; trigger `handle_updated_at` atualiza `updated_at` em UPDATE mas não em INSERT.
- Constraints e enums: tentar INSERT com `status` inválido falha; CASCADE de `auth.users → profiles` funciona.

**Runtime:** extensão `pgtap` instalada na imagem Postgres do `supabase start`. Testes em `supabase/tests/*.sql`. Executados via `supabase test db`.

**Gate:** `pnpm test:db` em CI. Roda em pre-merge. Em pre-commit é opcional (depende do dev ter Supabase rodando).

---

## Resumo de gates por etapa

| Hook | Comandos | Quem dispara |
|---|---|---|
| pre-commit (rápido) | `pnpm typecheck && pnpm lint && pnpm test:unit` | dev local |
| pre-merge (CI) | tudo acima + `pnpm test:integration && pnpm test:db && pnpm test:e2e` | GitHub Actions |
| Sprint Final Artifact | tudo acima + screenshot diff visualmente revisado | agente / humano |

`pnpm typecheck` é adicionado nesta sprint (paga débito do `package.json` registrado em [Sprint 03 §5](../../memory/sprints/03/_summary.md)).

---

## Estrutura de arquivos

```
tests/
  unit/
    lib/
      utils/task-status.test.ts
      auth/require-role.test.ts
      actions/tasks.validation.test.ts
      actions/admin.validation.test.ts
  integration/
    fixtures/
      personas.ts          ← cria admin/coord/efetivo + retorna anon clients
      seed.ts              ← reseta DB entre testes via transação
    rls/
      tasks.rls.test.ts
      profiles.rls.test.ts
      whitelist.rls.test.ts
    actions/
      tasks.actions.test.ts
      admin.actions.test.ts
  e2e/
    kanban.spec.ts
    admin.spec.ts
    auth.spec.ts
    mobile-visual.spec.ts  ← screenshot diff
    __screenshots__/       ← baseline versionado
supabase/
  tests/
    triggers/
      handle_new_user.sql
      check_whitelist.sql
      sync_google_metadata.sql
    schema/
      enums.sql
      constraints.sql
```

---

## Consequências

**Positivas**

- Refactor seguro de Server Actions e RLS — qualquer regressão em defesa em camadas (ADR 0003) explode em CI.
- Triggers Postgres ganham contrato testável — `handle_new_user` pode evoluir sem medo.
- CA-06 da Sprint 03 (validação visual mobile) deixa de ser "depende de browser subagent" e vira artefato de CI.
- Documentação executável: cada teste de RLS é uma demonstração viva da policy.

**Negativas**

- Setup inicial pesado: Docker + Supabase local + Playwright browsers ≈ 1.5 GB. Aceitável (CI tem cache de imagem).
- Suíte completa em CI gasta ~3-5 min — aceitável neste estágio. Otimizar paralelização só se virar gargalo.
- pgTAP é niche — equipe precisa aprender, mas a sintaxe é SQL+`SELECT plan(N); SELECT ok(...); SELECT finish();`. Curva curta.
- Manter screenshots de baseline custa atenção em PRs com mudança visual intencional. Mitigação: workflow de aprovação de baseline documentado no `tests/e2e/README.md`.

---

## Riscos conhecidos a fechar

- [ ] Definir política para flaky tests: re-run automático em E2E (max 2 tentativas) ou marcar como `test.fixme` + ticket.
- [ ] Performance budget para suíte unit: alvo p95 < 30s. Monitorar e cortar testes lentos para integration se ultrapassar.
- [ ] Atualização de schema do Supabase: como atualizar fixtures sem dor? Decisão tentativa: `supabase db reset` em `globalSetup` da Vitest integration, com seed via `supabase/seed.sql` consolidado.
- [ ] Auditar uso de `cache()` em `requireRole` em ambiente de teste — `cache()` do React não funciona fora de request scope. Integration tests precisam invocar via fixture que simula request.

---

## Alternativas rejeitadas

- **(1) Apenas Vitest unit.** Rejeitado — não cobre RLS/trigger/UI; falsa sensação de segurança.
- **(2) Apenas Playwright E2E.** Rejeitado — lento, flaky e não cobre regra de domínio pura. E2E não substitui unit.
- **(3) Vitest + Playwright sem pgTAP.** Rejeitado — triggers são lógica de produção crítica (whitelist é o gate de auth). Ter cobertura indireta via integration é insuficiente; queremos teste em isolamento da unidade SQL.
- **Cypress no lugar de Playwright.** Rejeitado — Playwright tem suporte nativo a múltiplos navegadores (WebKit incluído, importante para iOS Safari), screenshot diff embutido, e auth via state injetado é mais simples. Cypress 13+ fechou parte desse gap mas Playwright ainda lidera em CI paralelizado.
- **Jest no lugar de Vitest.** Rejeitado — Next 16 + ESM exige config extra em Jest (transformers, `moduleNameMapper`). Vitest é zero-config para o nosso `tsconfig.json` atual.

---

## Implementação

Sprint 07-A entrega as Camadas 1, 2, 3 e 4 — ver [docs/sprints/07A/sprint-plan.md](../../sprints/07A/sprint-plan.md).

Sprint 07-B entrega os débitos transversais que tornam a suite operacional (script `pnpm typecheck`, `lib/logger`, mapeamento de erro na callback de auth, fechamento retroativo das Sprints 05 e 06) — ver [docs/sprints/07B/sprint-plan.md](../../sprints/07B/sprint-plan.md).
