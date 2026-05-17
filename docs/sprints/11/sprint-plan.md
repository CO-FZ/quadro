# Sprint 11 — Estabilização da suíte + fechamento retroativo da Sprint 07-C

**Sprint goal (1 frase):** reconciliar o sistema de memória com o estado real do código (Sprints 07-C/08/09/10 entregues sem closure formal) e deixar um runbook para o humano validar `pnpm test:integration` quando Docker estiver disponível.

**Data de início:** 2026-05-17
**Capacidade:** 1 dev humano + 1 agente
**Status:** 🟡 entregue parcialmente — Stories 11.1 (retroativa) e 11.2 (docs) fechadas pelo agente; Story 11.3 aguarda gate humano com Docker para promover ADR 0005 e escrever Final Artifact.
**Sprint precedente:** [Sprint 10 — Kanban & Dashboard Improvements](../10/sprint-plan.md)

---

## 1. Contexto — por que esta sprint existe

A análise de status de 2026-05-17 detectou divergência grande entre `docs/memory/sprints/_summary.md` e o código real:

- `_summary.md` listava como **P0 em aberto** os itens "Camadas 2/3/4 da Sprint 07-A" e "Filtro `archived_at IS NULL` no assignee selector".
- No código, esses itens estão **substancialmente entregues** pelos commits `b01c52b` (scaffolding integration/E2E/pgTAP + CI) e `1e42077` (fix de path do alias + regex de CA-18) — entregues sem fechamento formal da Sprint 07-C.
- O filtro `archived_at IS NULL` já está em `app/(app)/kanban/page.tsx:30`.

A pendência real **não é codar**, é fechar:

- ADR 0005 está `proposto` há semanas — a validação operacional (`pnpm test:integration` verde) que justifica promoção a `aceito` nunca foi feita formalmente.
- Sprint 07-C nunca teve `_summary.md`, Final Artifact ou atualização de status.
- Sprints 08, 09, 10 não foram registradas no índice global `_summary.md`.

**Conclusão:** Sprint 11 é uma sprint de hygiene técnica curta — fecha 07-C retroativamente, atualiza o índice global, e prepara o gate de validação operacional como runbook humano (Story 11.3) porque o sandbox do agente não tem Docker.

---

## 2. Backlog selecionado

| ID | Story / Task | Tipo | Estimativa | Owner | Prioridade | Status |
|----|--------------|------|-----------|-------|------------|--------|
| Story 11.1 | Estabilizar `pnpm test:integration` (fixes alias + regex CA-18) | bug/refactor | S | (já entregue em `1e42077`) | P0 | ✅ retroativa |
| Story 11.2 | Fechar Sprint 07-C retroativamente + reconciliar `_summary.md` | docs | S | agente | P0 | ✅ |
| Story 11.3 | Runbook humano para validar Camada 2 + promover ADR 0005 | ops/gate humano | XS | humano | P0 | ⬜ aguardando Docker |

---

## 3. Sequência de execução

```
[agente]  Story 11.1 — documentar fechamento retroativo dos fixes
   │       já entregues em 1e42077 (alias path + regex CA-18).
   ▼
[agente]  Story 11.2 — promover documentos:
   │       - docs/memory/sprints/07C/_summary.md (novo)
   │       - docs/memory/execution/AAAA-MM-DD-sprint-07C-final.md (novo)
   │       - docs/memory/sprints/_summary.md (atualizar com 07-C/08/09/10
   │         e mover P0s ex-07-C de "aberto" para "fechado")
   │       - docs/sprints/07C/sprint-plan.md (status → fechada)
   │       (NÃO promove ADR 0005 — depende de validação humana com Docker)
   ▼
[humano]  Story 11.3 — quando Docker disponível:
            - pnpm test:integration → verde
            - health-check pnpm test:db e pnpm test:e2e --list
            - promover ADR 0005 a `aceito`
            - escrever Sprint 11 Final Artifact
            - preencher retrospectiva §10
```

---

## 4. Definition of Ready (DoR)

- [x] Stories 07A.2 / 07A.3 / 07A.4 / 07C.1 com CAs herdados disponíveis.
- [x] Divergência entre `_summary.md` e código documentada (esta seção 1).
- [x] Commit `1e42077` identificado como ponto onde os fixes operacionais foram aplicados.
- [x] `pnpm test:unit` verde (59/59 desde Sprint 07-A).
- [ ] Docker disponível **para Story 11.3** (humano confirma).

---

## 5. Definition of Done (DoD)

**Já atendido pelo agente nesta sprint:**

- [x] `docs/sprints/07C/sprint-plan.md` com status `🟢 fechada retroativamente — 2026-05-17`.
- [x] `docs/memory/sprints/07C/_summary.md` criado (padrão da Sprint 07-B).
- [x] `docs/memory/execution/2026-05-17-sprint-07C-final.md` criado (Final Artifact retroativo).
- [x] `docs/memory/sprints/_summary.md` reorganizado: blocos Sprints 07-C/08/09/10 adicionados; P0s ex-07-C movidos para "fechados"; data de atualização revisada.
- [x] Sprint 11 com 3 stories documentadas.

**Pendente da Story 11.3 (humano):**

- [ ] `pnpm test:integration` exit 0 confirmado.
- [ ] `pnpm test:unit` ≥ 59 testes verde (regressão check).
- [ ] `pnpm typecheck && pnpm lint` verde.
- [ ] ADR 0005 promovido de `proposto` para `aceito` com data.
- [ ] `docs/memory/execution/AAAA-MM-DD-sprint-11-final.md` (Final Artifact da própria Sprint 11).
- [ ] `docs/memory/sprints/11/_summary.md` (resumo de fase).
- [ ] Retrospectiva §10 preenchida.
- [ ] (Opcional) Cleanup de `test_output*.txt` se suíte verde.

---

## 6. Compromissos & não-compromissos

**Entregue nesta sprint:**

- Reconciliação documental Sprint 07-C → `_summary.md`.
- Closure retroativa dos fixes operacionais de `1e42077`.
- Runbook humano (Story 11.3) cobrindo validação + troubleshooting + promoção do ADR.
- Atualização do índice global incluindo Sprints 08/09/10.

**NÃO entregue (esperado nas Stories 11.3 ou em sprints futuras):**

- ❌ Validação operacional `pnpm test:integration` — depende de Docker; gate humano da 11.3.
- ❌ Promoção do ADR 0005 — depende da validação acima.
- ❌ Sprint 11 Final Artifact — depende da Story 11.3 fechar.
- ❌ Gates G1 (migrations remotas) / G2 (smoke staging) — operação humana fora do escopo do agente; permanecem como débitos rastreados (referenciados na Story 11.3 §5 e §6).
- ❌ Expansão de cobertura — escopo desta sprint é hygiene, não feature.
- ❌ Visual regression desktop, mock da Edge Function, race-condition `LAST_ADMIN` — débitos P2/P3 inalterados.

---

## 7. Riscos

| Risco | Mitigação |
|-------|-----------|
| Story 11.3 fica em aberto indefinidamente (humano não roda) | ADR 0005 segue `proposto`; P0s da 07-C permanecem fechados; documentação não regride. O risco é só de não-promoção do ADR — aceitável |
| `pnpm test:integration` falhar quando humano rodar (regressão entre `1e42077` e hoje) | Story 11.3 §3.5 inclui árvore de diagnóstico; cada classe de falha tem ação proposta. Falhas fora da árvore viram tickets novos |
| Camadas 3/4 vermelhas — bloqueiam promoção do ADR 0005? | Decisão registrada em 11.3: Camada 2 verde **é suficiente** para promover ADR 0005. Camadas 3/4 viram débito P1 se vermelhas (E2E/pgTAP têm flakiness conhecida) |
| Migration `20260516130000_allow_task_creator_to_assign.sql` (commit `1e42077`) não está rastreada em nenhuma sprint | Documentar no Final Artifact retroativo da 07-C como "out-of-band" — fora do plano original mas alinhada à direção (RLS) |

---

## 8. Cerimônias

| Evento | Quando | Output | Status |
|--------|--------|--------|--------|
| Planning (este doc) | 2026-05-17 | sprint-plan + 3 stories | ✅ |
| Gate 1 (Plan Artifact) | antes do código | aprovação humana em chat | ✅ |
| Execução agente (11.1+11.2) | 2026-05-17 | docs reconciliados; PR push | ✅ |
| Gate 2 parcial (revisão dos docs) | após push do agente | aprovação humana do diff de docs | ⬜ |
| Story 11.3 (humano) | quando Docker disponível | validação + ADR 0005 + Final Artifact | ⬜ |
| Retro | ao fechar 11.3 | seção 10 | ⬜ |

---

## 9. Stories

1. [Story 11.1 — Estabilizar `pnpm test:integration`](story-11.1-estabilizar-integration.md) — ✅ retroativa
2. [Story 11.2 — Fechar Sprint 07-C retroativamente](story-11.2-fechar-07C.md) — ✅ docs entregues
3. [Story 11.3 — Runbook de validação humana](story-11.3-runbook-validacao.md) — ⬜ aguardando humano + Docker

---

## 10. Retrospectiva (preencher ao fechar Story 11.3)

**O que funcionou:**
- `[preencher após Story 11.3]`

**O que não funcionou:**
- `[preencher após Story 11.3]`

**O que vamos mudar na próxima sprint:**
- `[preencher após Story 11.3]`

**Métrica da sprint:**

| Métrica | Valor |
|---------|-------|
| Stories planejadas | 3 |
| Stories concluídas pelo agente | 2 (11.1 retroativa, 11.2 docs) |
| Stories aguardando humano | 1 (11.3) |
| P0s da 07-C fechados (documentalmente) | 2 (Camada 2 fix + filtro assignee) |
| Testes integration baseline (antes → depois) | 29/37 (`1e42077`-) → ? (Story 11.3) |
| ADR 0005 promovido | ⬜ pendente (Story 11.3) |
