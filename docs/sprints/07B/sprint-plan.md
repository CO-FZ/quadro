# Sprint 07-B — Débitos transversais (logger, auth callback, audit, fechamento retroativo)

**Sprint goal (1 frase):** zerar a dívida não-teste herdada das Sprints 01–06 — logger estruturado, mapeamento de erro na auth callback, audit log de privilégios, fechamento retroativo das Sprints 05/06 e ADR 0004 — usando a suíte da Sprint 07-A como rede de segurança.

**Data de início:** 2026-05-09 (sequencial após 07-A)
**Capacidade:** 1 dev humano + 1 agente (Opus 4.7)
**Status:** ⬜ aguardando Sprint 07-A fechar
**Sprint precedente:** [Sprint 07-A — Suíte de testes](../07A/sprint-plan.md) (bloqueante)

---

## 1. Backlog selecionado

| ID | Story / Task | Tipo | Estimativa | Owner | Prioridade | Status |
|----|--------------|------|-----------|-------|------------|--------|
| Story 07B.1 | Logger estruturado (`lib/logger`) + integração em `requireRole` e auth callback | story | S | agente | P0 | ⬜ |
| Story 07B.2 | Mapeamento de erro na auth callback + UI de aviso para domínio privilegiado | story | S | agente | P0 | ⬜ |
| Story 07B.3 | Audit log de criação automática com role ≠ efetivo + smoke anti-spoofing fixture | story | M | agente | P1 | ⬜ |
| Story 07B.4 | Fechamento retroativo Sprints 05/06 + ADR 0004 → Aceito + i18n base | story | S | agente | P1 | ⬜ |

> Sprint **independente da 07-A em escopo**, mas só faz sentido depois dela: cada uma destas mudanças exige a suíte de testes para garantir não-regressão. Se 07-A não fechar, 07-B não começa.

---

## 2. Definition of Ready (DoR)

- [x] Suíte da Sprint 07-A em verde (gate explícito de início).
- [x] Cada story tem critérios de aceite Given/When/Then em arquivo dedicado.
- [x] Origem de cada débito mapeada para `_summary.md` ou ADR específico:
  - Logger: [Sprint 03 §"Riscos conhecidos a fechar"](../../spec/adr/0003-defesa-em-camadas-tasks.md), [Sprint 04 §6](../../memory/sprints/04/_summary.md), [AGENTS.md §6](../../../AGENTS.md).
  - Callback mapping: [ADR 0002 §"Riscos conhecidos a fechar"](../../spec/adr/0002-whitelist-emails-trigger.md).
  - Audit log: [ADR 0002 rev §"Riscos a fechar"](../../spec/adr/0002-whitelist-emails-trigger.md), [Sprint 04 §2](../../memory/sprints/04/_summary.md).
  - Sprint 06 fechamento: ADR 0004 ainda em status `Proposto` apesar da implementação em prod.
- [x] Nenhuma dependência externa (não precisa de ferramenta nova).
- [x] Cabe em M.

---

## 3. Definition of Done (DoD)

- [ ] Critérios de aceite com testes automatizados (suite 07-A continua verde + novos testes adicionados quando aplicável).
- [ ] `pnpm typecheck && pnpm lint && pnpm test:unit && pnpm test:integration && pnpm test:db && pnpm test:e2e` passam.
- [ ] PR/diff revisado pelo humano (Gate 2).
- [ ] ADR 0004 promovido a `Aceito` com data.
- [ ] `_summary.md` da Sprint 05 escrito retroativamente.
- [ ] `_summary.md` da Sprint 06 escrito.
- [ ] Migration aplicada em remoto via `supabase db push` (sem reset).
- [ ] `_summary.md` da Sprint 07-B escrito.
- [ ] Index `docs/memory/sprints/_summary.md` atualizado com Sprints 05, 06, 07-A e 07-B.

---

## 4. Compromissos & não-compromissos

**Vamos entregar:**

- `lib/logger` com `info/warn/error` estruturado (JSON em prod, pretty em dev), integrado em `requireRole`, `check_whitelist`-callback e ações sensíveis.
- Auth callback (`app/auth/callback/route.ts`) lê erro do trigger e mostra mensagem amigável na tela de login.
- Trigger Postgres opcional `BEFORE UPDATE OF email` em `auth.users` cobrindo gap do ADR 0002 (UPDATE de email burlava whitelist).
- UI de aviso quando admin adiciona entry de domínio com role privilegiada (admin/coord).
- Tabela `audit_log` (ou uso de `auth.audit_log_entries`) registrando criação automática com role ≠ efetivo.
- Smoke anti-spoofing como fixture de teste (continuação da Story 07A.2 §"CA-11/12").
- ADR 0004 atualizado para `Aceito`.
- `_summary.md` retroativos das Sprints 05 e 06.
- `lib/i18n` com namespace inicial em pt-BR (chaves para mensagens de erro mais comuns).

**NÃO vamos entregar:**

- ❌ Refactor amplo de mensagens espalhadas no código para usar `lib/i18n` — só introduzimos a infra e migramos as 5 mensagens mais críticas (auth, FORBIDDEN, LAST_ADMIN, whitelist erro, validação task). Migração total é débito futuro.
- ❌ `console.log` → logger em todos os lugares — só nos pontos sensíveis (auth, requireRole, sync-sheets Edge Function).
- ❌ Race-condition fix do `LAST_ADMIN` (transação real) — aceito como débito documentado, não vai entrar.
- ❌ Sync bi-direcional Sheets, exportação PDF, alertas de atraso — roadmap pós-v1.
- ❌ Refactor estrutural de `lib/actions/*.ts`.

---

## 5. Riscos da sprint

| Risco | Mitigação |
|-------|-----------|
| Logger novo introduz dependência pesada (winston/pino) | Usar `pino` (lightweight) ou um wrapper minimalista de 30 linhas com `console.{log,warn,error}` + JSON estruturado — decisão final no Plan Artifact |
| Mapeamento de erro na callback quebra fluxo OAuth atual | Story 07A.3 CA-11 já cobre o cenário; teste explode se regredir |
| `BEFORE UPDATE OF email` trigger interfere com sync de OAuth (Google atualiza email) | Validar via integration test antes de aplicar; se interferir, escopo da story reduz para "documentar o gap, não corrigir" |
| Audit log via `auth.audit_log_entries` é gerenciado pelo Supabase — pode não permitir INSERT custom | Fallback: criar tabela própria `public.privileged_role_audit` |
| Fechamento retroativo de Sprints 05/06 esbarrar em código que ninguém lembra mais | Reconstruir a partir dos commits no git log + diffs das migrations correspondentes (`20260507000003`, `20260507000004`, `20260507000005`); se humano não conseguir validar uma decisão antiga, marcar `_summary` como "reconstruído com confiança média" |
| Sprint 07-A não fechar e bloquear esta | Aceitar — é DoR explícita. Não começar 07-B antes de 07-A em verde |

---

## 6. Cerimônias

| Evento | Quando | Output |
|--------|--------|--------|
| Planning (este doc) | 2026-05-09 | sprint-plan + 4 stories |
| Gate 1 (Plan Artifact) | antes do código | aprovação humana em chat |
| Gate 2 (Final Artifact) | depois do código | aprovação humana do diff |
| Retro | ao fechar | seção 8 |

---

## 7. Workspace por agente

| Workspace | Agente | Stories | Modo |
|-----------|--------|---------|------|
| `quadro` (cwd) | Opus 4.7 | 07B.1 → 07B.4 sequenciais | agent-assisted |

> **Sequencial.** 07B.1 (logger) é dependência de 07B.2 (callback usa logger). 07B.3 e 07B.4 podem ser paralelizadas se humano autorizar dois workspaces.

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
| Débitos fechados (de uma lista de ~15) | — |
| Bugs introduzidos | — |
| Cobertura `pnpm test:unit` (deve ser ≥ Sprint 07-A) | — |
