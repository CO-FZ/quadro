# Sprint 11 — Estabilização da suíte + fechamento retroativo da Sprint 07-C

**Sprint goal (1 frase):** colocar `pnpm test:integration` verde, promover ADR 0005 a `aceito` e fechar formalmente a Sprint 07-C, reconciliando o `_summary.md` com o estado real do código.

**Data de início:** 2026-05-17
**Capacidade:** 1 dev humano + 1 agente
**Status:** ⬜ aguardando Gate 1 (Plan Artifact / instanciação aprovada)
**Sprint precedente:** [Sprint 10 — Kanban & Dashboard Improvements](../10/sprint-plan.md)

---

## 1. Contexto — por que esta sprint existe

A análise de status de 2026-05-17 detectou uma divergência grande entre o `docs/memory/sprints/_summary.md` e o código real:

- `_summary.md` lista como **P0 em aberto** os itens "Camadas 2/3/4 da Sprint 07-A" e "Filtro `archived_at IS NULL` no assignee selector".
- No código, esses itens estão **substancialmente entregues** pelo commit `b01c52b — feat: implement comprehensive integration and E2E testing framework with Supabase support and CI automation`:
  - `tests/integration/{rls,actions,triggers,fixtures,globalSetup.ts}` existem.
  - `tests/e2e/{kanban,admin,auth}.spec.ts` + `playwright.config.ts` existem.
  - `supabase/tests/{handle_new_user,check_whitelist,schema_constraints}.sql` (pgTAP) existem.
  - `.github/workflows/ci.yml` orquestra typecheck, lint, unit, integration, db, e2e.
  - `app/(app)/kanban/page.tsx:30` já filtra `.is('archived_at', null)`.

Porém:

- `pnpm test:integration` está **vermelho**: 8/37 falhas no último run (`test_output_2.txt`). 7 falhas por resolução de módulo nos imports dinâmicos `await import('@/lib/actions/{tasks,admin}')`; 1 falha por mensagem genérica `"Database error saving new user"` no trigger `handle_new_user` (espera `/acesso negado/i`).
- ADR 0005 segue `proposto`.
- Sprint 07-C nunca teve `_summary.md`, Final Artifact, nem promoção do ADR.

**Conclusão:** a Sprint 11 não cria nada novo de feature — ela estabiliza a suíte herdada da 07-C e faz a closure documental que ficou em débito. É uma sprint de hygiene técnica curta.

---

## 2. Backlog selecionado

| ID | Story / Task | Tipo | Estimativa | Owner | Prioridade | Status |
|----|--------------|------|-----------|-------|------------|--------|
| Story 11.1 | Estabilizar `pnpm test:integration` (Camada 2 verde) | bug/refactor | S | agente | P0 | ⬜ |
| Story 11.2 | Promover ADR 0005 + fechar Sprint 07-C retroativamente | docs | XS | agente | P0 | ⬜ |

---

## 3. Sequência de execução

```
[agente]  Story 11.1 — fix dos 8 testes vermelhos de integration.
   │       Pré-condição: Docker + Supabase local disponíveis. Sem Docker,
   │       diagnóstico vira artefato e a story é bloqueada (gate humano).
   ▼
[agente]  Story 11.2 — promover ADR 0005, escrever 07C/_summary.md,
           atualizar docs/memory/sprints/_summary.md, marcar 07C.2 done
           retroativamente (fix já em b01c52b → kanban/page.tsx:30).
   ▼
[humano]  Final Artifact da Sprint 11 aprovado.
```

---

## 4. Definition of Ready (DoR)

- [x] Stories 07A.2 / 07A.3 / 07A.4 / 07C.1 com CAs herdados disponíveis.
- [x] Divergência entre `_summary.md` e código documentada (esta seção 1).
- [x] Output de teste reproduzível (`test_output.txt`, `test_output_2.txt`) com root cause inicial isolado.
- [x] `pnpm typecheck && pnpm lint && pnpm test:unit` verde (59/59).
- [ ] Docker disponível no ambiente do agente — confirma na abertura da Story 11.1.

---

## 5. Definition of Done (DoD)

- [ ] `pnpm test:integration` exit 0 — todos os CAs herdados de 07A.2 verdes.
- [ ] `pnpm test:unit` ≥ 59 testes — sem regressão.
- [ ] `pnpm typecheck && pnpm lint` verde.
- [ ] ADR 0005 promovido de `proposto` para `aceito` com data 2026-05-17.
- [ ] `docs/memory/sprints/07C/_summary.md` criado.
- [ ] `docs/memory/execution/2026-05-17-sprint-07C-final.md` criado (Final Artifact retroativo da 07-C).
- [ ] `docs/memory/sprints/_summary.md`: bloco Sprint 07-C completo + P0s da 07-C movidos de "abertos" para "fechados" (referenciando os commits `b01c52b`, `1e42077`, e o desta sprint).
- [ ] `docs/memory/execution/2026-05-17-sprint-11-final.md` (Final Artifact da própria Sprint 11).

---

## 6. Compromissos & não-compromissos

**Vamos entregar:**

- Diagnóstico + fix dos 8 testes vermelhos atuais de integration.
- Validação que pgTAP (`pnpm test:db`) e Playwright (`pnpm test:e2e`) ao menos *iniciam* — não é compromisso de cobertura, só de health-check. Se vermelhos, registrar como débito P1 em `_summary.md` (não bloqueia ADR 0005).
- Promoção do ADR 0005.
- Reconciliação documental Sprint 07-C → `_summary.md`.

**NÃO vamos entregar:**

- ❌ Expansão de cobertura — só estabilizar o que já existe.
- ❌ Gates G1 (migrations remotas) / G2 (smoke staging) — operação humana fora do escopo do agente; permanecem como débitos rastreados.
- ❌ Visual regression desktop, mock da Edge Function `sync-sheets`, race-condition `LAST_ADMIN` — débitos P2/P3 inalterados.
- ❌ Refactor de Server Actions ou domínio — qualquer bug de produto descoberto pelos testes vira ticket separado, não entra nesta sprint.

---

## 7. Riscos

| Risco | Mitigação |
|-------|-----------|
| Docker indisponível no sandbox → Story 11.1 bloqueada | Agente entrega diagnóstico escrito + PR proposto e o humano roda `pnpm test:integration` localmente; ADR 0005 fica `proposto` até verificação humana |
| Fix do `@/lib/actions/*` em vitest requer mudar config global e quebra `test:unit` | Validar `pnpm test:unit && pnpm test:integration` no mesmo run antes do commit; preferir alteração só em `tests/integration.config.ts` |
| Trigger `handle_new_user` retornando "Database error saving new user" é root cause em SQL, não em teste — exige migration | Investigar primeiro se basta `RAISE EXCEPTION 'acesso negado'` no SQL existente; se exigir migration nova, escopo + ADR aplicáveis decididos antes de implementar (ou aceitar como débito e ajustar regex do teste) |
| `pnpm test:e2e` precisa de browsers instalados (`playwright install`) — pode estourar tempo da sprint | Health-check apenas de inicialização; falha de browser ausente vira débito documentado, não bloqueia ADR 0005 |

---

## 8. Cerimônias

| Evento | Quando | Output |
|--------|--------|--------|
| Planning (este doc) | 2026-05-17 | sprint-plan + 2 stories |
| Gate 1 (Plan Artifact) | antes do código | aprovação humana em chat |
| Gate 2 (Final Artifact) | após código | aprovação humana do diff |
| Retro | ao fechar | seção 10 |

---

## 9. Stories

1. [Story 11.1 — Estabilizar `pnpm test:integration`](story-11.1-estabilizar-integration.md)
2. [Story 11.2 — Promover ADR 0005 + fechar Sprint 07-C retroativamente](story-11.2-fechar-07C.md)

---

## 10. Retrospectiva (preencher ao final)

**O que funcionou:**
- `[...]`

**O que não funcionou:**
- `[...]`

**O que vamos mudar na próxima sprint:**
- `[...]`

**Métrica da sprint:**

| Métrica | Valor |
|---------|-------|
| Stories planejadas | 2 |
| Stories concluídas | — |
| P0s fechados (07-C) | — |
| Testes integration verde (antes → depois) | 29/37 → ? |
| ADR 0005 promovido | — |
