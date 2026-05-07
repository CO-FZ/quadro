# Sprint 06 — Integração Google Sheets

**Sprint goal (1 frase):** Implementar a sincronização unidirecional assíncrona das tarefas do Kanban para uma planilha do Google Sheets via Supabase Edge Functions.

**Data de início:** 2026-05-07
**Capacidade:** 1 dev humano + 1 agente Antigravity (Opus 4.7)
**Status:** ⬜ aguardando Gate 1 (Plan Artifact)

---

## 1. Backlog selecionado

| ID | Story / Task | Tipo | Estimativa | Owner | Prioridade | Status |
|----|--------------|------|-----------|-------|------------|--------|
| Story 06 | Integração Google Sheets | story | M | agente | P1 | ⬜ |

---

## 2. Definition of Ready (DoR)

- [x] Story tem critérios de aceite Given/When/Then ([story-06-google-sheets-sync.md](story-06-google-sheets-sync.md)).
- [x] ADR aprovado definindo a arquitetura: [ADR 0004 Google Sheets Sync](../../spec/adr/0004-google-sheets-sync.md).
- [x] Persona definida: Gestor (para consumo de relatórios no Sheets).
- [x] Cabe em M (≤3 dias-agente).

---

## 3. Definition of Done (DoD)

- [ ] Critérios de aceite com evidência manual (testes locais na Edge Function).
- [ ] `pnpm exec tsc --noEmit && pnpm lint` passam (se aplicável ao client code, embora o foco seja backend).
- [ ] PR/diff revisado pelo humano (Gate 2).
- [ ] Edge function e Database Webhook configurados via Supabase CLI (`supabase functions deploy`, migrations).
- [ ] Final Artifact + `_summary` da Sprint 06 escritos.

---

## 4. Compromissos & não-compromissos

**Vamos entregar:**
- Supabase Edge Function `sync-sheets` em Deno.
- Autenticação com a Google API via OAuth2/Service Account (credenciais em Secrets).
- Database Webhook via Postgres Trigger chamando a Edge Function na inserção e atualização de tarefas.

**NÃO vamos entregar:**
- ❌ Sincronização bi-direcional (alterar no Google Sheets e refletir no app).
- ❌ Sincronização em lote retrospectiva (apenas as tarefas novas ou modificadas após o deploy do trigger serão sincronizadas nesta primeira versão; um script à parte poderá ser feito se o cliente pedir).

---

## 5. Riscos da sprint

| Risco | Mitigação |
|-------|-----------|
| Rate Limits da API do Google Sheets | Evitar atualizar a mesma linha múltiplas vezes por segundo. O Webhook deve lidar com alterações eventuais. |
| Tratamento das Variáveis de Ambiente | Usar o vault do Supabase para injetar o JSON do Service Account com segurança. |

---

## 6. Cerimônias

| Evento | Quando | Output |
|--------|--------|--------|
| Planning | 2026-05-07 | sprint-plan + story + Plan Artifact |
| Gate 1 | antes do código | aprovação humana em chat |
| Gate 2 | depois do código | revisão do diff |
| Retro | ao fechar | seção 8 |

---

## 7. Workspace

| Workspace | Agente | Story | Modo |
|-----------|--------|-------|------|
| `quadro` (cwd) | Opus 4.7 | Story 06 | agent-assisted |

> Sequencial.

---

## 8. Retrospectiva (preencher ao final)

**O que funcionou:**
- `[...]`

**O que não funcionou:**
- `[...]`

**Métrica:**

| Métrica | Valor |
|---------|-------|
| Stories planejadas | 1 |
| Stories concluídas | — |
