# Plan Artifact — Sprint 07-A (Gate 1)

**Data:** 2026-05-09
**Sprint:** 07-A — Suíte de testes em camadas
**Sprint plan:** [docs/sprints/07A/sprint-plan.md](../../sprints/07A/sprint-plan.md)
**ADR:** [0005 — Estratégia de testes](../../spec/adr/0005-estrategia-de-testes.md) (`proposto` — ser promovido a `aceito` neste Gate 1)
**Operador:** agente Opus 4.7 / aprovação humana pendente

---

## 1. Resumo executivo (≤5 linhas)

Iniciar a Sprint 07-A entregando ADR 0005 + 4 stories de teste (Vitest unit, Vitest integration com Supabase local, Playwright E2E com screenshot diff mobile, pgTAP). Antes de qualquer teste, destravar o baseline `pnpm typecheck && pnpm lint` que está vermelho desde 2026-05-07 (8 erros tsc em Deno + 1 erro lint em ThemeToggle). A sprint termina com CI rodando 4 jobs paralelos e cobertura mínima nas partes críticas.

## 2. Pré-condições (estado do repositório)

- ✅ Branch atual: `claude/fix-technical-debt-bTaB7` (commits planos `4a584df`).
- ✅ Sprints 05/06 fechadas retroativamente nesta sessão (commits subsequentes).
- ✅ ADR 0004 promovido a `Aceito`.
- ❌ `pnpm typecheck` (via `tsc --noEmit`) — **falha**, 8 erros em `supabase/functions/sync-sheets/index.ts` (tsconfig do Next está incluindo arquivo Deno).
- ❌ `pnpm lint` — **falha**, 1 erro `react-hooks/set-state-in-effect` em `components/ui/ThemeToggle.tsx:11`.
- ✅ Migrations sincronizadas (10 aplicadas).
- ✅ `package.json` sem scripts de teste — exigirá adição.

## 3. Objetivos verificáveis ao fim da sprint

1. ADR 0005 promovido para `aceito` com data.
2. `pnpm typecheck` verde (gate de DoD; primeira coisa a destravar).
3. `pnpm lint` verde.
4. `pnpm test:unit` passa cobrindo `lib/utils/task-status.ts`, `lib/utils/task-dates.ts`, `lib/auth/require-role.ts` (parte pura), `lib/actions/_validation.ts`. Cobertura ≥80% nas funções de `lib/utils/`, 100% em `assertRoleAllowed`.
5. `pnpm test:integration` passa cobrindo RLS de 4 tabelas × 4 personas + 9 cenários de Server Actions + 2 de spoofing.
6. `pnpm test:db` passa cobrindo 4 triggers + enums + cascades.
7. `pnpm test:e2e` passa cobrindo Kanban/Admin/Auth + 4 screenshots mobile baseline em `tests/e2e/__screenshots__/`.
8. CI configurado (GitHub Actions) rodando os 4 jobs.
9. `tests/README.md` documentando workflow de baseline + pré-requisitos.
10. `_summary.md` da Sprint 07-A escrito.

## 4. Arquivos que pretendo tocar

### 4.1 Configuração e baseline (passo 0 — destrava typecheck/lint)

| Arquivo | Operação | Justificativa |
|---|---|---|
| `tsconfig.json` | atualizar | adicionar `"supabase/functions"` em `exclude` para tsc não verificar arquivos Deno |
| `eslint.config.mjs` | atualizar | adicionar `globalIgnores` para `supabase/functions/**` |
| `components/ui/ThemeToggle.tsx` | atualizar | corrigir `setMounted(true)` no `useEffect` — usar lazy init ou `useSyncExternalStore` (escopo cirúrgico, não-funcional) |
| `package.json` | atualizar | adicionar scripts: `typecheck`, `test`, `test:unit`, `test:unit:coverage`, `test:integration`, `test:db`, `test:e2e`, `test:e2e:update-snapshots` |
| `package.json` | atualizar | adicionar devDependencies: `vitest`, `@vitest/coverage-v8`, `@playwright/test` |

### 4.2 Story 07A.1 — Domain (Vitest unit)

| Arquivo | Operação | Justificativa |
|---|---|---|
| `vitest.config.ts` | criar | config base — `environment: 'node'`, `globals: false`, `coverage.provider: 'v8'` |
| `tests/README.md` | criar | doc geral; preenche seção "Unit"; outras seções vazias com `<!-- TODO: Story 07A.X -->` |
| `tests/unit/lib/utils/task-status.test.ts` | criar | cobre `isOverdue` × 6 combinações (CA-02 da Story 07A.1) |
| `tests/unit/lib/utils/task-dates.test.ts` | criar | cobre `validateTaskDates` × 4 cenários (CA-06) |
| `tests/unit/lib/auth/require-role.test.ts` | criar | cobre `assertRoleAllowed` × 4 cenários (CA-04) |
| `tests/unit/lib/actions/_validation.test.ts` | criar | cobre `normalizeTaskInput`, `initialStatusFor` (CA-05) |
| `lib/utils/task-dates.ts` | criar | extrair `validateTaskDates` de `TaskModal.tsx` |
| `lib/auth/require-role.ts` | refactor | extrair `assertRoleAllowed(caller, allowed)` puro; manter `requireRole` como wrapper |
| `lib/actions/_validation.ts` | criar | extrair `normalizeTaskInput`, `initialStatusFor` |
| `lib/actions/tasks.ts` | refactor | usar helpers extraídos; comportamento idêntico |
| `components/features/TaskModal.tsx` | refactor | usar `validateTaskDates` |

### 4.3 Story 07A.2 — Integration (Vitest + Supabase local)

| Arquivo | Operação | Justificativa |
|---|---|---|
| `tests/integration.config.ts` | criar | Vitest config separado com `globalSetup`, timeout maior, sequencial |
| `tests/integration/fixtures/supabase.ts` | criar | `createPersonaClient(role)` com session JWT real |
| `tests/integration/fixtures/seed.ts` | criar | seed de 3 personas via admin SDK |
| `tests/integration/fixtures/cleanup.ts` | criar | cleanup por ID entre testes |
| `tests/integration/fixtures/server-action.ts` | criar | wrapper que zera `cache()` do React entre invocações |
| `tests/integration/rls/tasks.rls.test.ts` | criar | 4 ops × 4 personas (CA-02) |
| `tests/integration/rls/task_assignees.rls.test.ts` | criar | self-assign + spoofing (CA-03) |
| `tests/integration/rls/profiles.rls.test.ts` | criar | (CA-04) |
| `tests/integration/rls/whitelist.rls.test.ts` | criar | admin-only (CA-05) |
| `tests/integration/actions/tasks.actions.test.ts` | criar | createTask × 2; updateTask FORBIDDEN; updateTaskStatus condicional (CA-06–10, 11, 12) |
| `tests/integration/actions/admin.actions.test.ts` | criar | last-admin × 2; bulk parsing × 2 (CA-13–16) |
| `tests/integration/triggers/handle_new_user.test.ts` | criar | precedência email > domínio (CA-17, CA-18) |

### 4.4 Story 07A.3 — Feature/E2E (Playwright)

| Arquivo | Operação | Justificativa |
|---|---|---|
| `playwright.config.ts` | criar | projects: desktop-chromium, mobile-chromium (360x740), webkit smoke |
| `tests/e2e/fixtures/auth.ts` | criar | `signInAs(role)` injeta cookies de sessão |
| `tests/e2e/fixtures/seed.ts` | criar | reusa fixtures da Story 07A.2 |
| `tests/e2e/kanban.spec.ts` | criar | criar tarefa, drag-drop, optimistic rollback (CA-03 a CA-07) |
| `tests/e2e/admin.spec.ts` | criar | bulk add, last-admin, soft-delete (CA-08 a CA-10) |
| `tests/e2e/auth.spec.ts` | criar | rejeição não-whitelisted (CA-11 — depende de Story 07B.2 para passar verde) |
| `tests/e2e/mobile-visual.spec.ts` | criar | screenshot diff em 4 rotas (CA-12, CA-13) |
| `tests/e2e/__screenshots__/` | criar (dir) | baseline versionado (4 PNGs) |
| `tests/e2e/README.md` | criar | workflow de update de baseline (CA-15) |
| `components/ui/ToastProvider.tsx` | refactor | adicionar `data-testid="toast"` (sem mudança funcional) |
| `components/features/TaskCard.tsx` | refactor | adicionar `data-testid="task-card"` + `data-task-id` |
| `components/features/KanbanBoard.tsx` | refactor | `data-testid="kanban-column"` + `data-status`, `data-testid="fab-new-task"` |
| `components/features/AdminView.tsx` | refactor | `data-testid` em tabs e botões críticos |

### 4.5 Story 07A.4 — pgTAP

| Arquivo | Operação | Justificativa |
|---|---|---|
| `supabase/tests/triggers/check_whitelist.sql` | criar | CA-02–05 |
| `supabase/tests/triggers/handle_new_user.sql` | criar | CA-06–09 |
| `supabase/tests/triggers/sync_google_metadata.sql` | criar | CA-10–11 |
| `supabase/tests/triggers/handle_updated_at.sql` | criar | CA-12 |
| `supabase/tests/schema/enums.sql` | criar | CA-13 |
| `supabase/tests/schema/constraints.sql` | criar | CA-14 |
| `supabase/tests/schema/cascades.sql` | criar | CA-15–16 |

### 4.6 CI

| Arquivo | Operação | Justificativa |
|---|---|---|
| `.github/workflows/ci.yml` | criar | jobs: typecheck-lint, unit, integration (Supabase Docker), db (pgTAP), e2e (Playwright); paralelizar onde possível |

## 5. Subagentes / paralelização

- **Sequencial.** Plan-plan da Sprint 07-A (§7) já estabelece sequencial. Conflito principal: `package.json` é tocado por todas as 4 stories (scripts e devDependencies). Paralelizar 07A.1 com 07A.4 (pgTAP) é permitido — não tocam `package.json` no mesmo eixo (07A.1 adiciona Vitest, 07A.4 só adiciona script `test:db`).
- **Browser subagent:** indisponível no Claude Code. Playwright roda local com headless via Docker — sem dependência de subagent.

## 6. Riscos identificados antes de executar

| Risco | Mitigação |
|-------|-----------|
| Refactor de `requireRole` para extrair `assertRoleAllowed` quebrar comportamento atual | Story 07A.2 cobre via integration test antes de declarar pronto. Refactor é mecânico (extract function); pouco espaço para regressão |
| Refactor de `lib/actions/tasks.ts` para usar `_validation.ts` introduzir off-by-one (e.g., trim que mudou) | Comparar resultado byte-a-byte: dump de tasks antes/depois com mesmo input deve ser idêntico |
| `tsconfig.exclude` adicionar `supabase/functions` esconder erros legítimos do Edge Function | Aceito — Edge Function é Deno; precisa de tsconfig próprio em `supabase/functions/sync-sheets/deno.json` (já existe). Sprint 07-B 07B.1 vai migrar Edge Function para `lib/logger` e validará separadamente |
| `useSyncExternalStore` no `ThemeToggle` ser overkill | Alternativa: `useEffect` + `useDeferredValue`. Decidir no momento, escopo cirúrgico |
| Supabase local + Playwright + pgTAP em CI estourar 5 min | Cache de Docker layers, paralelização por shard. Se estourar, mover E2E para job opcional (ainda no PR, mas com `continue-on-error: false`) |
| `data-testid` proliferar sem padrão | Documentar regra em `tests/e2e/README.md`: só adicionar test-id quando `data-task-id` ou seletor semântico não basta |
| Screenshot diff falsos-positivos em CI por fontes diferentes | Forçar instalação de fonte via Playwright config; mask em elementos não-determinísticos |
| Story 07A.3 CA-11 depende da Sprint 07-B 07B.2 | Documentar como `test.fixme` ou `test.skip` com TODO; ativar quando 07B.2 entregar |
| Cobertura de RLS subir para 16+ testes só de `tasks` | Aceito — testes triviais (≤10 linhas cada). Quantidade ≠ complexidade |

## 7. O que NÃO vou fazer nesta sprint

- ❌ Migrar `console.log` para `lib/logger` — Sprint 07-B.
- ❌ Adicionar mensagem amigável na auth callback — Sprint 07-B (Story 07B.2). E2E spec `auth.spec.ts` CA-11 vai usar `test.fixme` até lá.
- ❌ Filtrar `archived_at IS NULL` no kanban (descoberto na auditoria da Sprint 05) — vira ticket P0 na Sprint 07-B (apêndice à Story 07B.4).
- ❌ ADR para `is_admin()` SECURITY DEFINER — vira ticket P2 na Sprint 07-B.
- ❌ Refatorar Edge Function `sync-sheets` — débito da Sprint 06; logger entra na Sprint 07-B.
- ❌ Coverage thresholds altos (>90%) — alvo realista é cobertura **das partes críticas**.
- ❌ Mutation testing.
- ❌ Visual regression desktop.

## 8. Plano de execução (passos coesos)

```
Passo 0 — Destravar baseline (≤30 min de trabalho)
  ├─ tsconfig.json + eslint.config.mjs excluem supabase/functions
  ├─ ThemeToggle.tsx corrige useEffect
  ├─ package.json adiciona "typecheck"
  └─ Validar: pnpm typecheck && pnpm lint passam → SIM/NÃO?
  
Passo 1 — Story 07A.1 (Vitest unit)
  ├─ devDependencies vitest + coverage
  ├─ vitest.config.ts + tests/README.md
  ├─ Refactors leves (extract _validation, validateTaskDates, assertRoleAllowed)
  ├─ Testes unit
  └─ Validar: pnpm test:unit passa, coverage ≥ alvos
  
Passo 2 — Story 07A.4 (pgTAP) — pode paralelizar com Passo 1 se autorizado
  ├─ supabase/tests/* arquivos
  ├─ Adicionar script test:db
  └─ Validar: pnpm test:db passa
  
Passo 3 — Story 07A.2 (integration)
  ├─ Fixtures (supabase, seed, cleanup, server-action)
  ├─ RLS tests por tabela
  ├─ Action tests
  ├─ Trigger smoke ponta-a-ponta
  └─ Validar: pnpm test:integration passa
  
Passo 4 — Story 07A.3 (E2E)
  ├─ devDep @playwright/test + install browsers
  ├─ playwright.config + fixtures
  ├─ data-testid em componentes
  ├─ Specs (kanban, admin, auth com fixme, mobile-visual)
  ├─ Capturar baselines mobile (revisar visualmente)
  └─ Validar: pnpm test:e2e passa
  
Passo 5 — CI
  ├─ .github/workflows/ci.yml
  └─ Push branch + verificar workflow run
  
Passo 6 — Fechamento
  ├─ ADR 0005 → "aceito"
  ├─ docs/memory/sprints/07A/_summary.md
  ├─ Final Artifact em docs/memory/execution/
  └─ Atualizar índice global
```

## 9. Critério de "pronto para Gate 2"

- Todos os 4 comandos verdes: `pnpm typecheck && pnpm lint && pnpm test:unit && pnpm test:integration && pnpm test:db && pnpm test:e2e`.
- CI rodando em PR com os 4 jobs.
- Screenshots mobile baseline visualmente revisados pelo humano (não basta verde do diff — primeiro baseline precisa ser aprovado).
- `_summary.md` da Sprint 07-A e Final Artifact escritos.
- ADR 0005 com status `aceito`.

## 10. Pergunta para o humano antes de iniciar

1. **Confirmação:** posso adicionar Vitest, Playwright e pgTAP nesta branch (`claude/fix-technical-debt-bTaB7`) ou prefere PR separado para a infraestrutura de testes?
2. **`ThemeToggle.tsx`:** posso aplicar o fix do `useEffect` agora (Passo 0) ou prefere isolar em PR de "lint baseline" antes da Sprint 07-A começar?
3. **`tsconfig.exclude`:** alternativa é criar `tsconfig.functions.json` próprio para Deno em vez de excluir do principal. Aceitável "excluir e pronto" (mais simples) ou prefere a separação cirúrgica?
4. **Filtro de assignees arquivados** (achado da auditoria Sprint 05): trato como bugfix dentro do Passo 0 da Sprint 07-A, ou empurro para Sprint 07-B Story 07B.4?

Sem resposta a essas 4 perguntas, **não executo o Passo 0**. Resposta padrão se você só responder "go": (1) sim, mesma branch; (2) sim, no Passo 0; (3) excluir e pronto; (4) Sprint 07-B.

---

## Aprovação

- [ ] Plan Artifact lido e aprovado pelo humano
- [ ] Resposta às 4 perguntas registrada
- [ ] Sinal verde para iniciar Passo 0
