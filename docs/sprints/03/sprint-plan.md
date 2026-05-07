# Sprint 03 — Hardening de Tasks + ADR 0003 (defesa em camadas)

**Sprint goal (1 frase):** fechar dívida transversal das Sprints 01 e 02 — defesa em camadas (RLS + Server Action role guard) com ADR explícito, helper único de atrasada, optimistic UI no Kanban e validação visual mobile.

**Data de início:** 2026-05-07
**Capacidade:** 1 dev humano + 1 agente Antigravity (Opus 4.7)
**Status:** ⬜ aguardando Gate 1 (Plan Artifact)

---

## 1. Backlog selecionado

| ID | Story / Task | Tipo | Estimativa | Owner | Prioridade | Status |
|----|--------------|------|-----------|-------|------------|--------|
| ADR-0003 | Defesa em camadas: RLS + Server Action role guard | tech-doc | XS | agente | P0 | ⬜ |
| Story 03 | Hardening de Server Actions de tasks + helper "atrasada" + optimistic UI + validação mobile | story | M | agente | P0 | ⬜ |

> Sprint 03 carrega só uma story de execução porque ela cobre quatro débitos coesos da Sprint 02. Se Story 03 ficar L durante o Plan Artifact, quebrar em sub-stories M antes do Gate 1.

---

## 2. Definition of Ready (DoR)

- [x] Story tem critérios de aceite Given/When/Then ([story-03-tasks-hardening.md](story-03-tasks-hardening.md)).
- [x] Persona e prioridade definidas (P0, todas as personas autenticadas).
- [x] Referenciada no `_summary` da Sprint 02 como débito explícito.
- [x] Dependências mapeadas: nenhuma externa. ADR 0003 é interna e bloqueante (passo 0).
- [x] Cabe em M (≤3 dias-agente).

---

## 3. Definition of Done (DoD)

- [ ] Critérios de aceite todos verdes com evidência (testes manuais + screenshot mobile).
- [ ] `pnpm typecheck && pnpm lint` passam — **gate explícito antes do Final Artifact**.
- [ ] PR (ou commits separados) revisado por humano.
- [ ] ADR 0003 em `accepted` antes de merge.
- [ ] Documentação atualizada: ADR 0003 + atualização de [01-design-system.md](../../spec/01-design-system.md) se houver decisão de UX.
- [ ] Sem `console.log` órfão.
- [ ] Sem `TODO` órfão (vira ticket de Sprint 04).
- [ ] Validação visual mobile com browser subagent — screenshot anexado em `docs/memory/execution/2026-05-XX-sprint-03-final.md`.
- [ ] Final Artifact e `_summary` da Sprint 03 escritos.

---

## 4. Compromissos & não-compromissos

**Vamos entregar:**

- ADR 0003 + hardening de Server Actions de tasks (role guards server-side).
- Helper único `lib/utils/task-status.ts` para regra de "atrasada".
- `useOptimistic` no drag-and-drop do Kanban com rollback em erro.
- Validação visual mobile com screenshots.

**NÃO vamos entregar (e está ok):**

- ❌ Guard "último admin" em código (vira Sprint 04).
- ❌ Mapeamento detalhado de erros RLS para mensagens de UI (vira Sprint 04).
- ❌ Sincronização Google Sheets (US-05) — exige ADR próprio.
- ❌ Suite de testes automatizados (vira sprint dedicada).
- ❌ Refactor da arquitetura de Server Actions (escopo cirúrgico apenas).

---

## 5. Riscos da sprint

| Risco | Mitigação |
|-------|-----------|
| `useOptimistic` introduzir flicker em mobile | testar com browser subagent antes de declarar pronto; rollback se UX piorar |
| `requireRole` em Server Actions duplicar consulta a `profiles` por chamada | centralizar em `lib/auth/require-role.ts` com cache por request via `cache()` do React |
| ADR 0003 conflitar com [ADR 0001](../../spec/adr/0001-rbac-via-supabase-rls.md) | ADR 0003 deve ser **complemento** ("RLS continua sendo o gate de banco; Server Action role guard é defesa em profundidade") — não substituição |
| Helper único de "atrasada" mudar comportamento atual (ex.: `TaskCard` hoje não filtra por status) | preservar regra mais conservadora (`status !== 'finalizada' && end_date < hoje`) e documentar o ajuste |

---

## 6. Cerimônias

| Evento | Quando | Output |
|--------|--------|--------|
| Planning (este doc) | 2026-05-07 | sprint-plan + story + Plan Artifact |
| Gate 1 (Plan Artifact) | antes do código | aprovação humana em chat |
| Gate 2 (Final Artifact) | depois do código | aprovação humana do diff |
| Retro | ao fechar | seção 8 abaixo |

---

## 7. Workspace por agente

| Workspace | Agente | Story | Modo |
|-----------|--------|-------|------|
| `quadro` (cwd) | Opus 4.7 | Story 03 + ADR 0003 | agent-assisted |

> Sequencial. Não paralelizar — todas as mudanças tocam arquivos sobrepostos (`lib/actions/tasks.ts`, `KanbanBoard.tsx`, modais).

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
| Stories planejadas | 1 |
| Stories concluídas | — |
| Bugs introduzidos | — |
| Bugs resolvidos | — |
| Cobertura no fim | n/a (sem suite ainda) |
