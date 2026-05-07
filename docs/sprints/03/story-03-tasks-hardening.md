# Story 03: Hardening de Tasks (defesa em camadas + UX)

**Sprint:** 03 — ver [sprint-plan.md](sprint-plan.md)
**ADRs:** [ADR 0001 RBAC RLS](../../spec/adr/0001-rbac-via-supabase-rls.md), **ADR 0003 (a redigir como passo 0)**
**Glossário:** [docs/prd/01-glossary.md](../../prd/01-glossary.md)
**Origem:** débitos rastreados em [docs/memory/sprints/02/_summary.md](../../memory/sprints/02/_summary.md) §2.

---

## 1. Visão Geral

Esta story fecha a dívida transversal acumulada na Sprint 02:

1. **Defesa em camadas para tasks.** Server Actions de `lib/actions/tasks.ts` hoje só checam `getUser()`. RLS é o único gate de autorização — frágil. Vamos formalizar a decisão em ADR 0003 e implementar `requireRole(['admin','coordenador'])` como guard server-side complementar.
2. **Regra única de "atrasada".** Lógica triplicada em `TaskCard`, `TaskDetailModal`, `ProfileView` com divergência sutil (filtro por status só em dois deles). Centralizar em `lib/utils/task-status.ts`.
3. **Optimistic UI no Kanban.** Hoje `router.refresh()` após cada drop causa flash. Trocar por `useOptimistic` com rollback em erro.
4. **Validação visual mobile.** Browser subagent + screenshots em `docs/memory/execution/`.

## 2. Requisitos de Negócio (Regras)

- **Criação/edição/movimentação/arquivamento/exclusão de task** só por `admin` ou `coordenador` (já era a regra de RLS — agora também garantido server-side).
- **"Atrasada"** = `status !== 'finalizada'` **E** `status !== 'arquivada'` **E** `end_date < hoje (timezone do servidor, comparação por dia)`.
  - Decisão: arquivada não conta como atrasada (não está em fluxo ativo).
  - Decisão: data comparada como dia, não timestamp — `end_date='2026-05-07'` deixa de ser atrasada às 23:59:59 do dia 07, não às 00:00:00.
- **Optimistic UI:** quando o usuário arrasta um card de coluna A → B, o card aparece em B imediatamente. Se a Server Action falha, o card volta para A e o Toast mostra a mensagem de erro.

## 3. Requisitos de UI/UX

- Drag-and-drop com transição visual de ≤150ms (alinhado a [docs/spec/01-design-system.md](../../spec/01-design-system.md)).
- Em erro de Server Action, Toast de erro + restauração automática do estado.
- Validação mobile: largura mínima testada 360px (Galaxy S8). Screenshot em `/kanban` e `/dashboard` em modo mobile.

## 4. Critérios de Aceite

### CA-01 — ADR 0003 redigido e accepted
- **Given** sprint 03 começou
- **When** o agente redige ADR 0003 com base em [referências de Server Actions](../../../.gemini/antigravity/skills/agent-product-harness/agent-product-harness/references/05-execution/03-protocols.md)
- **Then** ADR existe em `docs/spec/adr/0003-defesa-em-camadas.md` com status `accepted`, referenciando ADR 0001 como base.

### CA-02 — Server Actions de tasks com role guard
- **Given** um usuário `efetivo` autenticado
- **When** ele tenta chamar `createTask`/`updateTask`/`updateTaskStatus`/`archiveTask`/`deleteTask` direto (ex.: via curl com cookie de sessão)
- **Then** retorna `{ ok: false, code: 'FORBIDDEN', message: ... }` antes de qualquer operação no banco.

### CA-03 — Helper único de "atrasada"
- **Given** uma task com `end_date` no passado
- **When** qualquer componente (`TaskCard`, `TaskDetailModal`, `ProfileView`, dashboard) renderiza a task
- **Then** a regra de "atrasada" vem de `isOverdue(task)` em `lib/utils/task-status.ts`, com a mesma definição em todos os pontos.

### CA-04 — Optimistic UI no drag-and-drop
- **Given** o usuário arrasta um card da coluna "Backlog" para "Em Desenvolvimento"
- **When** a Server Action `updateTaskStatus` é chamada
- **Then** o card aparece em "Em Desenvolvimento" imediatamente; se a action retorna erro, o card volta para "Backlog" e Toast mostra a mensagem.

### CA-05 — Validação visual mobile
- **Given** browser subagent disponível
- **When** acessar `/kanban` e `/dashboard` em viewport 360x740
- **Then** screenshots anexados em `docs/memory/execution/2026-05-XX-sprint-03-final.md` mostram layout legível, sem overflow horizontal.

## 5. Modelagem de Dados

> Nenhuma alteração de schema nesta story. A defesa em camadas é puramente de aplicação.

## 6. Escopo negativo

- ❌ Suite de testes automatizada — Sprint dedicada.
- ❌ Guard "último admin" — Sprint 04.
- ❌ Mapeamento RLS error → UI message — Sprint 04.
- ❌ Refactor de `lib/actions/admin.ts` (já está OK desde `f0d806e`).

## 7. Dependências

- ADR 0003 é bloqueante (passo 0) para implementar `requireRole`.
- Browser subagent precisa estar disponível na runtime para CA-05.
