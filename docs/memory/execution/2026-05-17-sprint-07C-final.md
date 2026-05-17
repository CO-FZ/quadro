# Sprint 07-C — Final Artifact retroativo

**Data:** 2026-05-17 (escrito retroativamente — entrega operacional ocorreu entre 2026-05-10 e 2026-05-16)
**Status:** 🟢 fechada retroativamente
**Plano:** [docs/sprints/07C/sprint-plan.md](../../sprints/07C/sprint-plan.md)
**Resumo de fase:** [docs/memory/sprints/07C/_summary.md](../sprints/07C/_summary.md)
**Closure documental por:** [Sprint 11](../../sprints/11/sprint-plan.md)

> Este Final Artifact é retroativo. Diferente do padrão (escrito ao concluir uma sprint), ele reconstrói o que foi entregue a partir do diff e do estado atual do código, porque a Sprint 07-C não teve closure formal à época.

---

## Sumário (5 linhas)

A Sprint 07-C planejou entregar Camadas 2/3/4 + CI + bug do assignee arquivado + dois gates humanos. As duas stories técnicas (07C.1 scaffolding e 07C.2 filtro de assignee) foram entregues out-of-band nos commits `b01c52b` e `1e42077` antes de qualquer sprint posterior, mas nunca tiveram Plan Artifact aprovado nem Final Artifact. A Sprint 11 reconcilia o registro: 07C.2 está plenamente entregue; 07C.1 tem scaffolding + fixes operacionais entregues, faltando apenas a validação `pnpm test:integration` verde (movida para Story 11.3 — gate humano com Docker). Gates G1 e G2 permanecem como débitos abertos. ADR 0005 segue `proposto` até a Story 11.3.

---

## Arquivos alterados (consolidação por commit)

### Commit `b01c52b — feat: implement comprehensive integration and E2E testing framework with Supabase support and CI automation`

| Caminho | Operação | Razão |
|---------|----------|-------|
| `tests/integration/globalSetup.ts` | criado | bootstrap antes da suite (assume `supabase start` rodando) |
| `tests/integration/fixtures/{supabase,cleanup,personas,...}.ts` | criados | `createPersonaClient`, `seedPersonas`, `cleanup({taskIds})` |
| `tests/integration/rls/{tasks,task_assignees,profiles,whitelist}.rls.test.ts` | criados | RLS × persona × tabela |
| `tests/integration/actions/tasks.actions.test.ts` | criado | Server Actions ponta-a-ponta (CA-06 a CA-16) |
| `tests/integration/triggers/handle_new_user.test.ts` | criado | CA-17/CA-18 via signup real |
| `tests/integration.config.ts` | criado | Vitest config para integration (timeouts, `pool: 'forks'`, `maxConcurrency: 1`) |
| `tests/e2e/{kanban,admin,auth}.spec.ts` | criados | Playwright cobrindo 3 fluxos |
| `tests/e2e/auth.setup.ts` + `tests/e2e/fixtures/` | criados | `storageState` por persona |
| `playwright.config.ts` | criado | projects desktop + mobile (Galaxy S8 360×740) |
| `supabase/tests/{handle_new_user,check_whitelist,schema_constraints}.sql` | criados | pgTAP (Camada 4) |
| `.github/workflows/ci.yml` | criado | jobs `typecheck`/`lint`/`unit`/`integration`/`db`/`e2e` |
| `package.json` | editado | scripts `test:integration`, `test:e2e`, `test:db`; devDeps `@playwright/test`, `supabase` CLI, `@vitest/coverage-v8` |

### Commit `1e42077 — feat: allow task creators to assign users and update integration test path and error assertions`

| Caminho | Operação | Razão |
|---------|----------|-------|
| `tests/integration.config.ts` | editado | alias `@/` de `path.resolve(__dirname, '.')` para `'../'` — apontava para `tests/` quebrando `await import('@/lib/actions/...')` |
| `tests/integration/triggers/handle_new_user.test.ts` | editado | regex de CA-18 estendido com `\|database error saving new user` (GoTrue mascara `RAISE EXCEPTION` do trigger) |
| `tests/integration/actions/tasks.actions.test.ts` | editado | cleanup de whitespace |
| `supabase/migrations/20260516130000_allow_task_creator_to_assign.sql` | criado | RLS permitindo criador de task atribuir assignees — escopo out-of-band (não estava no plano da 07-C) |
| `test_output.txt`, `test_output_2.txt` | criados | evidência da falha pré-fix (stale após este commit; sugestão de cleanup na Story 11.3 §3.9) |

### Filtro do assignee selector (07C.2)

| Caminho | Operação | Razão |
|---------|----------|-------|
| `app/(app)/kanban/page.tsx` | editado | `+.is('archived_at', null)` na query de `profiles` — paga regra §2 da Story 05 |

(Commit exato rastreável via `git log --follow app/(app)/kanban/page.tsx` — não isolável nesta reconstrução porque está agrupado a outras mudanças.)

---

## Como testar

Validação operacional plena fica na [Story 11.3](../../sprints/11/story-11.3-runbook-validacao.md). Resumo curto:

```bash
# Pré-condição: Docker daemon ativo
pnpm exec supabase start
pnpm test:unit                 # baseline — ≥ 59 verde
pnpm test:integration          # gate principal — deve sair em exit 0 após 1e42077
pnpm test:db                   # health-check Camada 4
pnpm test:e2e --list           # health-check Camada 3 (config carrega)
```

---

## Riscos conhecidos

- **`pnpm test:integration` ainda não foi rodado pós-`1e42077`** no histórico que temos. Os fixes parecem certos por inspeção de código, mas só Story 11.3 confirma operacionalmente.
- **Camadas 3 (E2E) e 4 (pgTAP) nunca foram exercitadas** no sandbox do agente — flakiness ou ausência de browsers/pgTAP pode pegar de surpresa no primeiro run. Mitigação: na Story 11.3, falhas em 3/4 não bloqueiam ADR 0005, viram débito P1.
- **Mistura de escopo no commit `1e42077`**: o mesmo commit junta fix de testes (escopo Sprint 07-C) com migration nova (`20260516130000_allow_task_creator_to_assign.sql`, escopo não documentado). Isso é fonte de confusão histórica — registrar como antipattern.
- **Gates G1 e G2** permanecem em aberto. Em particular o G1 afeta produção: as migrations `20260510000000` e `20260510000001` (Sprint 07-B) ainda não estão no remoto. Comportamento de produção fica dependente da ausência desses triggers.

---

## Próximo passo sugerido

Executar Story 11.3 — runbook humano — assim que Docker estiver disponível. Resultado esperado: `pnpm test:integration` verde → ADR 0005 promovido a `aceito` → Sprint 11 fechada.

---

## Limitação metodológica

Este Final Artifact é uma **reconstrução retroativa** a partir de:

- `git log` e `git show` dos commits `b01c52b` e `1e42077`.
- Inspeção do estado atual de `tests/integration/**`, `tests/e2e/**`, `supabase/tests/**`, `.github/workflows/ci.yml`, `app/(app)/kanban/page.tsx`.
- `test_output.txt` e `test_output_2.txt` (evidência stale pré-fix).
- `docs/sprints/07C/{sprint-plan,story-*}.md` (intenção planejada).

Não há registro de Plan Artifact ou Gate 2 humano à época da entrega. Marcado retroativo para distinguir de artifacts contemporâneos.
