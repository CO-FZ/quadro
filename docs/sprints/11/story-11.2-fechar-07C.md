# Story 11.2: Promover ADR 0005 + fechar Sprint 07-C retroativamente

**Sprint:** 11 — ver [sprint-plan.md](sprint-plan.md)
**Depende de:** [Story 11.1 — Estabilizar integration](story-11.1-estabilizar-integration.md) (DoD verde).
**ADRs:** [0005 — Estratégia de testes em camadas](../../spec/adr/0005-estrategia-de-testes.md)
**Prioridade:** P0
**Estimativa:** XS (puramente documental, executada após 11.1).

---

## 1. Visão Geral

Esta story reconcilia o sistema de memória (`docs/memory/sprints/_summary.md`, ADRs, Final Artifacts) com o estado real do código que vem sendo evoluído sem closure formal desde a Sprint 07-C. Não há código de produto envolvido.

**Razão de existir:** o `_summary.md` ainda lista como **P0 em aberto** itens que estão entregues:

| P0 listado em aberto | Estado real | Commit/local |
|----------------------|-------------|--------------|
| Camadas 2/3/4 + CI | Scaffolding entregue; Camada 2 verde após Story 11.1 | `b01c52b`, validação desta sprint |
| Filtro `archived_at IS NULL` no assignee selector | Aplicado | `app/(app)/kanban/page.tsx:30` (rastrear commit de origem via `git log --follow`) |
| ADR 0005 promovido a `aceito` | Pendente — este é o último passo | esta story |

Manter esses itens listados como em aberto contamina o planning futuro e desinforma análises de status (como a que motivou esta sprint).

---

## 2. Critérios de Aceite

### CA-01 — ADR 0005 promovido

- **Given** `pnpm test:integration` verde (CA-01 da Story 11.1) e health-check Camadas 3/4 registrado.
- **When** `docs/spec/adr/0005-estrategia-de-testes.md` é editado.
- **Then** o campo `**Status:**` muda de `proposto` para `aceito`, com uma linha logo abaixo registrando a data: `**Aceito em:** 2026-05-17 — após Sprint 11 estabilizar integration tests; scaffolding Camadas 2/3/4 em `b01c52b`.`

### CA-02 — Final Artifact retroativo da Sprint 07-C

- **Given** o trabalho da 07-C foi feito em múltiplos commits (principalmente `b01c52b`, `1e42077`) sem closure formal.
- **When** `docs/memory/execution/2026-05-17-sprint-07C-final.md` é criado.
- **Then** o arquivo segue o template de Final Artifact (sumário, escopo entregue, débitos rastreados, gates pendentes G1/G2, links para commits e PRs).

### CA-03 — `_summary.md` Sprint 07-C escrito

- **Given** os outros docs da 07-C (sprint-plan, stories, gate guides) já existem.
- **When** `docs/memory/sprints/07C/_summary.md` é criado.
- **Then** o arquivo segue o padrão de resumo de fase usado em `docs/memory/sprints/07B/_summary.md` (status, fechado, aberto, débitos transferidos).

### CA-04 — Índice global atualizado

- **Given** `docs/memory/sprints/_summary.md` lista até a Sprint 07-B no índice principal.
- **When** o índice é atualizado.
- **Then**:
  - Adicionar bloco "Sprint 07-C — Fechar a suíte e P0s remanescentes" com status `🟢 fechada retroativamente — 2026-05-17`, links para sprint-plan, stories, gates, e Final Artifact desta sprint.
  - Mover os P0s da 07-C da seção "🔴 P0 — entram na Sprint 07-C (a planejar)" para uma seção nova "✅ P0s fechados via Sprints 08–11" com referência aos commits.
  - Atualizar a linha `**Última atualização:**` no topo.

### CA-05 — Sprints 08/09/10 referenciadas no índice

- **Given** o índice global pula da 07-B direto para a seção de débitos, sem registrar 08/09/10 que já foram concluídas.
- **When** o índice é atualizado.
- **Then** blocos resumidos das Sprints 08, 09, 10 são adicionados — cada um com 3-5 linhas (status, plano, stories, escopo entregue), seguindo o padrão das sprints anteriores. **Conteúdo já documentado** em `docs/memory/execution/2026-05-16-*.md`.

### CA-06 — Final Artifact da própria Sprint 11

- **Given** Stories 11.1 e 11.2 concluídas.
- **When** `docs/memory/execution/2026-05-17-sprint-11-final.md` é criado.
- **Then** segue template: sumário em 5 linhas, arquivos alterados, como testar (`pnpm typecheck && pnpm lint && pnpm test:unit && pnpm test:integration`), riscos conhecidos, próximo passo sugerido.

---

## 3. Arquivos a criar / editar

**Criar:**

- `docs/memory/sprints/07C/_summary.md`
- `docs/memory/execution/2026-05-17-sprint-07C-final.md`
- `docs/memory/execution/2026-05-17-sprint-11-final.md`

**Editar:**

- `docs/spec/adr/0005-estrategia-de-testes.md` — status + data de aceite.
- `docs/memory/sprints/_summary.md` — novo bloco 07-C; blocos 08/09/10 resumidos; reorganização da seção de débitos abertos vs. fechados; data de atualização.
- `docs/sprints/07C/sprint-plan.md` — status `⬜ aguardando` → `🟢 fechada — 2026-05-17` (campo Status no header e item 2 da retro).
- `docs/sprints/11/sprint-plan.md` — preencher seção 10 (retrospectiva + métricas).

---

## 4. Escopo negativo

- ❌ Editar `docs/product/roadmap.md` para refletir P0s fechados — uma atualização derivada, fica como ação follow-up (mencionar em "Próximo passo sugerido" do Final Artifact, não fazer aqui).
- ❌ Gates G1 (`supabase db push`) e G2 (smoke staging) — permanecem como **débitos abertos** referenciados no `_summary.md`; são operação humana fora do escopo de qualquer agente.
- ❌ Reescrever histórico de commits ou mudar autoria — only forward-only docs.
- ❌ Mudar ADRs 0001/0002/0003/0004 — fora de escopo.

---

## 5. Verificação humana esperada

O humano valida (Gate 2):

- Diff só toca arquivos `.md` em `docs/`.
- ADR 0005 com `Status: aceito` + data.
- `_summary.md` consistente — débitos P0 ex-07-C removidos da seção "abertos".
- Final Artifact reflete o que de fato foi feito nesta sprint.
