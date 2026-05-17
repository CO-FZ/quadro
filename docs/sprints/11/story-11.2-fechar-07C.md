# Story 11.2: Fechar Sprint 07-C retroativamente + reconciliar índice global

**Sprint:** 11 — ver [sprint-plan.md](sprint-plan.md)
**Tipo:** docs
**Prioridade:** P0
**Estimativa:** S
**Status:** ✅ entregue em 2026-05-17

> Esta story executa apenas a parte documental que o agente pode fazer sem Docker. A promoção do ADR 0005 e o Final Artifact da própria Sprint 11 ficam para a [Story 11.3](story-11.3-runbook-validacao.md), gate humano.

---

## 1. Visão Geral

Reconcilia o sistema de memória (`docs/memory/sprints/_summary.md`, sprint-plans, ADRs) com o estado real do código. Nenhum código de produto é tocado.

**Razão de existir:** `_summary.md` listava como **P0 em aberto** itens que estão entregues há semanas:

| P0 listado em aberto | Estado real | Commit/local |
|----------------------|-------------|--------------|
| Camadas 2/3/4 + CI | Scaffolding entregue; fixes operacionais em `1e42077` | `b01c52b`, `1e42077` |
| Filtro `archived_at IS NULL` no assignee selector | Aplicado | `app/(app)/kanban/page.tsx:30` |
| ADR 0005 promovido a `aceito` | Pendente — depende de validação operacional | Story 11.3 |

E o índice nunca registrou as Sprints 08, 09, 10 que rodaram entre 2026-05-16 e 2026-05-16.

---

## 2. Critérios de Aceite

### CA-01 — Final Artifact retroativo da Sprint 07-C

- **Given** o trabalho da 07-C foi feito em múltiplos commits sem closure formal.
- **When** `docs/memory/execution/2026-05-17-sprint-07C-final.md` é criado.
- **Then** segue o template (sumário 5 linhas, arquivos alterados por commit, como testar, riscos, próximo passo, limitação metodológica retroativa). ✅

### CA-02 — `_summary.md` da Sprint 07-C escrito

- **Given** os outros docs da 07-C (sprint-plan, stories, gate guides) já existem.
- **When** `docs/memory/sprints/07C/_summary.md` é criado.
- **Then** segue o padrão da Sprint 07-B (status, stories, débitos transferidos, notas metodológicas). ✅

### CA-03 — Status do sprint-plan da 07-C atualizado

- **Given** sprint-plan ainda dizia `⬜ aguardando Gate 1`.
- **When** o header e a tabela do backlog são editados.
- **Then** status passa a `🟢 fechada retroativamente em 2026-05-17`; backlog mostra status real de cada item (07C.1 ✅ scaffolding + Story 11.3 para validação; 07C.2 ✅; G1/G2 ⬜ débito). ✅

### CA-04 — Índice global reorganizado

- **Given** `docs/memory/sprints/_summary.md` listava só até a Sprint 07-B.
- **When** o índice é atualizado.
- **Then**: ✅
  - Data de "Última atualização" mudou para 2026-05-17.
  - Blocos novos: Sprint 07-C, Sprint 08, Sprint 09, Sprint 10, Sprint 11.
  - Seção "Débitos abertos pós-Sprint 07" reorganizada: P0s ex-07-C movidos para "✅ fechados via Sprints 07-C / 11"; P0s remanescentes (Story 11.3 + Gates G1/G2) ficam em "🔴 gates humanos remanescentes".

### CA-05 — ADR 0005 não promovido nesta story

- **Given** a promoção depende de `pnpm test:integration` verde, que depende de Docker.
- **When** o ADR é deixado inalterado.
- **Then** segue `proposto`; promoção formal fica em Story 11.3 §3.8. ✅

### CA-06 — Sprint 11 Final Artifact não escrito nesta story

- **Given** Final Artifact descreve o que foi feito numa sprint; Sprint 11 ainda tem Story 11.3 aberta.
- **When** nenhum arquivo `2026-05-17-sprint-11-final.md` é criado.
- **Then** Final Artifact fica para o humano escrever ao concluir Story 11.3. ✅

---

## 3. Arquivos criados / editados

**Criados:**

- `docs/memory/sprints/07C/_summary.md`
- `docs/memory/execution/2026-05-17-sprint-07C-final.md`

**Editados:**

- `docs/sprints/07C/sprint-plan.md` — header de status; tabela do backlog.
- `docs/memory/sprints/_summary.md` — data de atualização; blocos 07-C/08/09/10/11; reorganização da seção de débitos.

**Intencionalmente NÃO tocados (escopo da Story 11.3):**

- `docs/spec/adr/0005-estrategia-de-testes.md`.
- `docs/memory/execution/AAAA-MM-DD-sprint-11-final.md`.
- `docs/sprints/11/sprint-plan.md` §10 (retrospectiva).
- `docs/memory/sprints/11/_summary.md`.
- `test_output.txt` / `test_output_2.txt` (cleanup proposto na 11.3).

---

## 4. Escopo negativo

- ❌ Promover ADR 0005 a `aceito` — escopo da Story 11.3.
- ❌ Editar `docs/product/roadmap.md` para refletir débitos atualizados — follow-up; mencionar no Final Artifact da Sprint 11 (Story 11.3).
- ❌ Gates G1 e G2 — operação humana; permanecem rastreados.
- ❌ Reescrever histórico de commits ou mudar autoria — only forward-only docs.
- ❌ Mexer em ADRs além do 0005 (e nem nesse — fica para 11.3).
