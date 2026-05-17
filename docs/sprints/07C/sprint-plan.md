# Sprint 07-C — Fechar a suíte e os P0s remanescentes

**Sprint goal (1 frase):** entregar Camadas 2/3/4 + CI (ADR 0005 → aceito), fechar o bug do assignee arquivado e conduzir o humano pelos dois gates de deploy das migrations pendentes.

**Data de início:** 2026-05-16
**Capacidade:** 1 dev humano + 1 agente (Sonnet 4.6)
**Status:** 🟢 **fechada retroativamente em 2026-05-17** — escopo entregue ao longo das Sprints pre-08 (commits `b01c52b`, `1e42077`), sem closure formal à época. Reconciliação documental feita pela Sprint 11. Ver [Sprint 11 sprint-plan §1](../11/sprint-plan.md) e [07C/_summary.md](../../memory/sprints/07C/_summary.md).
**Sprint precedente:** [Sprint 07-B — Débitos transversais](../07B/sprint-plan.md)
**Sprint que fechou retroativamente:** [Sprint 11 — Estabilização](../11/sprint-plan.md)

---

## 1. Backlog selecionado

| ID | Story / Task | Tipo | Estimativa | Owner | Prioridade | Status |
|----|--------------|------|-----------|-------|------------|--------|
| Story 07C.1 | Camadas 2/3/4 + CI (integration + E2E + pgTAP + GitHub Actions) | story | L | agente | P0 | ✅ entregue out-of-band em `b01c52b`; fixes em `1e42077`. Validação operacional pendente em [Story 11.3](../11/story-11.3-runbook-validacao.md). |
| Story 07C.2 | Bug: assignee arquivado aparece no selector do Kanban | bug | XS | agente | P0 | ✅ entregue (`app/(app)/kanban/page.tsx:30` aplica `.is('archived_at', null)`) |
| Gate G1 | Aplicar migrations remotas `000000` e `000001` via `supabase db push` | gate humano | — | humano | P0 | ⬜ permanece em aberto — débito rastreado |
| Gate G2 | Smoke anti-spoofing em staging com `tests/smoke/anti-spoofing.sh` | gate humano | — | humano | P0 | ⬜ permanece em aberto — débito rastreado |

> **Story 07C.1** herda os critérios de aceite das Stories 07A.2, 07A.3 e 07A.4 (arquivos existentes). O bloco é tratado como entrega única porque as três camadas compartilham o mesmo `globalSetup` Docker + a mesma janela de capacidade.

---

## 2. Sequência de execução

```
[agente agora]  Story 07C.2 — independente de Docker, desbloqueada.
       │
       ▼
[humano]        Gate G1 — aplicar migrations no remoto.
                Leia: docs/sprints/07C/gate-07C.G1-migrations-remotas.md
                Aprove e execute antes de subir o CI (o CI usará banco local,
                mas o ambiente de staging/prod precisa estar em sync antes de G2).
       │
       ▼
[agente]        Story 07C.1 — Camadas 2/3/4 + CI.
                Pré-condição: Docker disponível localmente.
                Se Docker indisponível: agente entrega scaffolding de arquivos e
                CI em modo "fail gracefully", humano roda `pnpm test:integration`
                quando Docker estiver disponível.
       │
       ▼
[humano]        Gate G2 — smoke anti-spoofing em staging.
                Leia: docs/sprints/07C/gate-07C.G2-smoke-staging.md
                Depende de G1 aplicado + pelo menos 1 task e 1 efetivo em staging.
```

---

## 3. Definition of Ready (DoR)

- [x] Stories 07A.2, 07A.3, 07A.4 com CAs detalhados já existem — 07C.1 as herda.
- [x] Migrations locais `20260510000000` e `20260510000001` em `supabase/migrations/` prontas para push remoto.
- [x] `tests/smoke/anti-spoofing.sh` entregue em 07B.3.
- [x] `pnpm typecheck && pnpm lint && pnpm test:unit` verde (59/59).
- [x] Origem de cada item rastreada em `docs/memory/sprints/_summary.md` §"P0".
- [ ] Gate G1 executado pelo humano antes de Story 07C.1 (gate de início parcial).

---

## 4. Definition of Done (DoD)

- [ ] ADR 0005 promovido de `proposto` para `aceito`.
- [ ] `pnpm test:unit` ≥ 59 testes — não regredir.
- [ ] `pnpm test:integration` passa — RLS × 4 tabelas × 4 personas, Server Actions ponta-a-ponta.
- [ ] `pnpm test:e2e` passa — Kanban, Admin, Auth callback × 3 personas. Screenshot diff mobile verde.
- [ ] `pnpm test:db` passa — pgTAP cobrindo `handle_new_user`, `check_whitelist`, `sync_google_metadata`.
- [ ] CI rodando (GitHub Actions) — jobs: typecheck, lint, unit, integration, db, e2e; baseline de screenshot versionado.
- [ ] Bug assignee arquivado fechado: profiles query em `kanban/page.tsx` filtra `archived_at IS NULL`.
- [ ] Gate G1 executado e confirmado pelo humano.
- [ ] Gate G2 executado com saída `3 PASS / 0 FAIL` registrada em `docs/memory/deploys/_summary.md`.
- [ ] `_summary.md` da Sprint 07-C escrito.
- [ ] `docs/memory/sprints/_summary.md` atualizado com Sprint 07-C.

---

## 5. Compromissos & não-compromissos

**Vamos entregar:**

- Camada 2: `tests/integration/` com fixtures de persona, testes RLS por tabela e Server Actions ponta-a-ponta.
- Camada 3: `tests/e2e/` com Playwright cobrindo 3 fluxos × 3 personas. Screenshot baseline mobile 360×740.
- Camada 4: `supabase/tests/` com pgTAP cobrindo os 2 triggers + constraints de schema.
- CI: arquivo `/.github/workflows/ci.yml` (ou equivalente) orquestrando os 4 jobs.
- ADR 0005 promovido a `aceito`.
- Fix de 1 linha no assignee selector.
- Gate G1 documentado + executado pelo humano.
- Gate G2 documentado + executado pelo humano.

**NÃO vamos entregar:**

- ❌ Visual regression desktop — só mobile (360×740). Desktop fica como P2.
- ❌ Cobertura da Edge Function `sync-sheets` — precisa de mock Google Sheets API, escopo separado.
- ❌ Fix do race-condition `LAST_ADMIN` — aceito como débito P2/P3.
- ❌ Refactor de URL/anon-key hardcoded em `20260507000005` — débito P2.
- ❌ Migração total de mensagens para `lib/i18n` — débito P1 herdado.

---

## 6. Riscos

| Risco | Mitigação |
|-------|-----------|
| Docker indisponível no ambiente de execução do agente | Entregar scaffolding completo + CI "pass with no-op"; humano executa `pnpm test:integration` localmente |
| Migration `20260510000001` reescreve `handle_new_user` — se houver dado inconsistente em prod, o rollback é manual | Gate G1 inclui checklist de verificação prévia (ver `gate-07C.G1-migrations-remotas.md`) |
| Playwright flaky em CI (timeouts por cold-start do Next.js) | Configurar `webServer.reuseExistingServer = true` + `retries: 2` no `playwright.config.ts` |
| pgTAP não disponível no Supabase local por padrão | Instalar via `CREATE EXTENSION IF NOT EXISTS pgtap` na migration de teste; documentar em `tests/README.md` |
| Screenshot diff mobile falha por diferença de fonte/antialiasing entre ambientes | Usar `--update-snapshots` no primeiro run do CI para criar baseline; marcar como "snapshot creation" no commit |

---

## 7. Gate Guide: G1 — Migrations Remotas

> Leia [gate-07C.G1-migrations-remotas.md](gate-07C.G1-migrations-remotas.md) para entender o que cada migration faz, os riscos e o checklist antes de executar.

**Resumo de 30 segundos:**

- `20260510000000` — adiciona trigger `BEFORE UPDATE OF email` reutilizando a função `check_whitelist()` já existente. Cobre o gap: usuário autenticado não podia mais trocar email para um fora da whitelist. Custo zero — função pré-existente. Reversão: `DROP TRIGGER`.
- `20260510000001` — cria tabela `privileged_role_audit` (append-only, RLS admin-only) e reescreve `handle_new_user` para registrar criações com role admin/coord. A reescrita é aditiva: lógica de criação de profile permanece idêntica, apenas adiciona o bloco de INSERT na audit com `EXCEPTION` handler para garantir best-effort. Reversão: `DROP TABLE + DROP TRIGGER + restore função anterior` (versão anterior disponível na migration `20260507000002`).

**Comando:**
```bash
supabase db push
```

---

## 8. Gate Guide: G2 — Smoke Anti-Spoofing em Staging

> Leia [gate-07C.G2-smoke-staging.md](gate-07C.G2-smoke-staging.md) para entender o que o script valida e como obter as variáveis de ambiente necessárias.

**Resumo de 30 segundos:** o script faz 3 tentativas de spoofing via REST direto com JWT de um `efetivo` real — todas devem retornar bloqueio (RLS). Valida que as policies do ADR 0003 estão ativas em prod/staging, não só em local. Resultado esperado: `3 PASS / 0 FAIL`.

---

## 9. Cerimônias

| Evento | Quando | Output |
|--------|--------|--------|
| Planning (este doc) | 2026-05-16 | sprint-plan + 2 stories + 2 gates |
| Gate 1 (Plan Artifact) | antes do código | aprovação humana em chat |
| Gate G1 (deploy) | humano executa | confirmação + output de `supabase db push` |
| Gate G2 (smoke) | humano executa após G1 | `3 PASS / 0 FAIL` + log em `docs/memory/deploys/` |
| Gate 2 (Final Artifact) | depois do código | aprovação humana do diff |
| Retro | ao fechar | seção 10 |

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
| Stories planejadas | 2 + 2 gates |
| Stories concluídas | — |
| P0s fechados | — |
| Testes adicionados (unit→integration→e2e→db) | — |
| ADR 0005 promovido | — |
| Cobertura RLS automatizada | 0% → ? |
