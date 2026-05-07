# Sprint 05 — Admin Enhancements (Soft-delete, Busca e Bulk Add)

**Sprint goal (1 frase):** Melhorar a usabilidade e segurança do painel admin permitindo busca rápida, arquivamento de usuários antigos e adição em lote na whitelist.

**Data de início:** 2026-05-07
**Capacidade:** 1 dev humano + 1 agente Antigravity (Opus 4.7)
**Status:** ⬜ aguardando Gate 1 (Plan Artifact)

---

## 1. Backlog selecionado

| ID | Story / Task | Tipo | Estimativa | Owner | Prioridade | Status |
|----|--------------|------|-----------|-------|------------|--------|
| Story 05 | Admin Enhancements (Soft-delete, Busca e Bulk Add) | story | M | agente | P0 | ⬜ |

---

## 2. Definition of Ready (DoR)

- [x] Story tem critérios de aceite Given/When/Then ([story-05-admin-enhancements.md](story-05-admin-enhancements.md)).
- [x] Persona definida: admin gerenciando usuários em volume.
- [x] Referenciada nos gaps 4/5/6 levantados em Sprints anteriores.
- [x] Cabe em M (≤3 dias-agente).

---

## 3. Definition of Done (DoD)

- [ ] Critérios de aceite com evidência manual (testes locais).
- [ ] `pnpm exec tsc --noEmit && pnpm lint` passam.
- [ ] PR/diff revisado pelo humano (Gate 2).
- [ ] Migration aplicada em remoto via `pnpm supabase db push` (sem reset).
- [ ] Final Artifact + `_summary` da Sprint 05 escritos.

---

## 4. Compromissos & não-compromissos

**Vamos entregar:**
- Busca na lista de usuários (filtro local por e-mail).
- Soft-delete: coluna `archived_at` na tabela `profiles`, botão "Arquivar" e "Restaurar" na UI, com `archived_at` opcional `timestamptz`.
- Bulk Add: transformar o input de whitelist em algo que aceita vários e-mails e adicionar múltiplos usando `insert`.

**NÃO vamos entregar:**
- ❌ Bloqueio de Auth: O login ainda será possível para usuários "arquivados", o bloqueio será primariamente visual e nas instâncias do app.
- ❌ Sincronização Google Sheets — exige ADR próprio (provavelmente na próxima sprint).

---

## 5. Riscos da sprint

| Risco | Mitigação |
|-------|-----------|
| Bulk Add com e-mails repetidos lançar erro e falhar os demais | Tratar `insert` ignorando os duplicados (`ON CONFLICT DO NOTHING`) e processando de forma resiliente |
| Soft-delete não impacta tarefas ativas e pode causar inconsistência | Decisão tomada: tarefas passadas continuam pertencendo ao usuário arquivado; ele apenas não aparece para ser selecionado para novas. |

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
| `quadro` (cwd) | Opus 4.7 | Story 05 | agent-assisted |

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
