# Sprint 07-A — Suíte de testes em camadas (domain + integration + feature + pgTAP)

**Sprint goal (1 frase):** zerar a dívida de cobertura automatizada acumulada das Sprints 02–06 entregando ADR 0005 + suítes Vitest unit/integration + Playwright E2E (com screenshot diff mobile) + pgTAP de triggers.

**Data de início:** 2026-05-09
**Capacidade:** 1 dev humano + 1 agente (Opus 4.7)
**Status:** ⬜ aguardando Gate 1 (Plan Artifact)
**Sprint precedente:** [Sprint 06 — Google Sheets Sync](../06/sprint-plan.md) (encerrada parcialmente; débitos retroativos serão fechados na Sprint 07-B)
**Sprint seguinte:** [Sprint 07-B — Débitos transversais](../07B/sprint-plan.md) (sequencial, depende desta para gates de CI)

---

## 1. Backlog selecionado

| ID | Story / Task | Tipo | Estimativa | Owner | Prioridade | Status |
|----|--------------|------|-----------|-------|------------|--------|
| ADR-0005 | Estratégia de testes em camadas | tech-doc | XS | agente | P0 | ⬜ |
| Story 07A.1 | Domain layer tests (Vitest unit) | story | S | agente | P0 | ⬜ |
| Story 07A.2 | Integration tests (Vitest + Supabase local) | story | M | agente | P0 | ⬜ |
| Story 07A.3 | Feature/E2E tests (Playwright + screenshot diff mobile) | story | M | agente | P0 | ⬜ |
| Story 07A.4 | pgTAP — triggers e schema | story | S | agente | P1 | ⬜ |

> **Estimativa global L.** Se durante o Plan Artifact a Story 07A.2 ou 07A.3 estourar para L isolada, quebrar em sub-stories antes do Gate 1. **Nenhuma story de produto** entra nesta sprint — escopo cirúrgico em testes e infraestrutura de teste.

---

## 2. Definition of Ready (DoR)

- [x] ADR 0005 redigido como passo 0 ([docs/spec/adr/0005-estrategia-de-testes.md](../../spec/adr/0005-estrategia-de-testes.md), status `proposto`).
- [x] Cada story tem critérios de aceite Given/When/Then em arquivo dedicado.
- [x] Persona definida: **mantenedor do código** — todas as personas existentes (admin/coord/efetivo) são exercitadas como fixtures.
- [x] Dependências mapeadas: nenhuma externa. Supabase CLI já presente em `devDependencies` (`supabase: ^2.98.2`).
- [x] Cabe em L se executada sequencialmente. Se virar XL, dividir em 07-A.1 (unit + integration) e 07-A.2 (E2E + pgTAP).

---

## 3. Definition of Done (DoD)

- [ ] ADR 0005 promovido de `proposto` para `aceito`.
- [ ] `pnpm test:unit` passa com ≥ 80% de cobertura nas funções de `lib/utils/` e 100% em `lib/auth/require-role.ts`.
- [ ] `pnpm test:integration` passa cobrindo as 4 tabelas (tasks, task_assignees, profiles, whitelist) × 4 personas (admin/coord/efetivo/anon).
- [ ] `pnpm test:e2e` passa cobrindo Kanban, Admin e Auth callback. Screenshot diff mobile (360x740) verde em `/kanban`, `/dashboard`, `/profile`, `/admin`.
- [ ] `pnpm test:db` passa cobrindo `handle_new_user`, `check_whitelist`, `sync_google_metadata`, `handle_updated_at`.
- [ ] Script `pnpm typecheck` adicionado ao `package.json` (paga débito transversal mais antigo, é pré-requisito do CI).
- [ ] CI (GitHub Actions ou equivalente) rodando os 4 jobs em paralelo onde possível, com baseline de screenshot versionado.
- [ ] `pnpm typecheck && pnpm lint && pnpm test:unit && pnpm test:integration && pnpm test:db && pnpm test:e2e` passam fim-a-fim — gate explícito antes do Final Artifact.
- [ ] Diff revisado pelo humano (Gate 2).
- [ ] Final Artifact + `_summary.md` da Sprint 07-A escritos.

---

## 4. Compromissos & não-compromissos

**Vamos entregar:**

- ADR 0005 aceito.
- 4 suítes de teste (unit, integration, e2e, pgTAP) cobrindo o estado atual do código.
- Baseline de screenshots mobile versionado para 4 rotas.
- CI rodando todos os gates em PR.
- Documentação `tests/README.md` explicando como rodar localmente, atualizar baseline, debugar flakiness.
- Script `pnpm typecheck` no `package.json`.

**NÃO vamos entregar:**

- ❌ Coverage thresholds altos (>90%) — alvo realista inicial é cobertura **das partes críticas**, não cobertura total.
- ❌ Mutation testing.
- ❌ Visual regression para desktop (só mobile, conforme decisão do PRD).
- ❌ Testes contra produção remota — tudo local com Supabase CLI + banco efêmero.
- ❌ Pagamento dos débitos transversais não-teste (logger, callback mapping, fechamento Sprint 05/06) — vai para Sprint 07-B.
- ❌ Refactor de Server Actions ou RLS — se um teste expõe bug, registrar como ticket para Sprint 07-B; não consertar inline.

---

## 5. Riscos da sprint

| Risco | Mitigação |
|-------|-----------|
| `cache()` do React em `requireRole` quebra fora de request scope (Vitest unit) | Wrappar `requireRole` em fixture de teste que simula request; documentar em `tests/unit/lib/auth/README.md` |
| Supabase CLI requer Docker — devs sem Docker bloqueados | Documentar pré-requisito em `tests/README.md`; CI usa imagem oficial; permitir rodar só `test:unit` localmente sem Docker |
| Playwright em CI mais lento que budget (>5min) | Usar `fullyParallel: true`, sharding (2 shards em CI), e cache de browsers no GitHub Actions |
| Screenshot diff falsos-positivos por antialiasing | `toHaveScreenshot({ maxDiffPixelRatio: 0.01 })` + `mask` em elementos não-determinísticos (timestamps, avatares vindos de URL externa) |
| `supabase db reset` entre testes pesa demais | Usar transação por teste (`BEGIN; ... ROLLBACK;`) onde possível; reset só em `globalSetup` |
| pgTAP indisponível na imagem default do Supabase | `CREATE EXTENSION IF NOT EXISTS pgtap;` em migration de teste (não em produção); rodar `supabase test db` que já carrega a extensão |
| Escopo XL escondido — RLS de `tasks` tem 4 políticas × 4 personas = 16 testes só para uma tabela | Aceitar como custo. Cada teste é trivial (≤ 10 linhas) — quantidade não é complexidade |
| Auth do Playwright sem hit no Google OAuth real | Usar `supabase.auth.admin.createUser` + injetar cookie de sessão; ADR 0005 §"Camada 3" já registra esse caminho |

---

## 6. Cerimônias

| Evento | Quando | Output |
|--------|--------|--------|
| Planning (este doc) | 2026-05-09 | sprint-plan + 4 stories + ADR 0005 |
| Gate 1 (Plan Artifact) | antes do código | aprovação humana em chat |
| Gate 2 (Final Artifact) | depois do código | aprovação humana do diff + screenshot baseline |
| Retro | ao fechar | seção 8 |

---

## 7. Workspace por agente

| Workspace | Agente | Stories | Modo |
|-----------|--------|---------|------|
| `quadro` (cwd) | Opus 4.7 | 07A.1 → 07A.4 sequenciais | agent-assisted |

> **Sequencial.** As stories tocam arquivos sobrepostos (`package.json`, `tests/*`, fixtures comuns). Paralelizar geraria conflito em `package.json` e fixtures de seed. Se quiser ganhar tempo, paralelizar apenas 07A.4 (pgTAP) com 07A.1 (unit) — não tocam os mesmos arquivos.

---

## 8. Retrospectiva (preencher ao final)

**O que funcionou:**
- `[...]`

**O que não funcionou:**
- `[...]`

**O que vamos mudar na próxima sprint:**
- `[...]`

**Métrica da sprint:**

| Métrica | Valor |
|---------|-------|
| Stories planejadas | 4 |
| Stories concluídas | — |
| Bugs encontrados pelos novos testes | — |
| Bugs introduzidos | — |
| Cobertura `pnpm test:unit` | — |
| Cobertura integration (% de policies RLS testadas) | — |
| Tempo de CI fim-a-fim | — |
