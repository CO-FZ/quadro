# Story 07C.2: Bug — Assignee arquivado aparece no selector do Kanban

**Sprint:** 07-C — ver [sprint-plan.md](sprint-plan.md)
**Origem:** [docs/memory/sprints/_summary.md §"Sprint 05 — Aberto"](../../memory/sprints/_summary.md) — regra §2 da Story 05 nunca implementada.
**ADR:** nenhum novo — alinhado com [ADR 0003](../../spec/adr/0003-defesa-em-camadas-tasks.md) (integridade de dados).
**Prioridade:** P0 (afeta produto: um usuário arquivado continua sendo assignável a tarefas).

---

## 1. Visão Geral

O modal de criação/edição de tarefas no Kanban exibe todos os usuários do sistema no selector de assignees — incluindo usuários com `archived_at IS NOT NULL`. Isso permite atribuir uma tarefa a alguém que não está mais ativo, o que quebra a UX e pode gerar inconsistências de relatório.

**Fix:** 1 filtro na query de `profiles` em `app/(app)/kanban/page.tsx`.

---

## 2. Arquivo afetado

`app/(app)/kanban/page.tsx` — linha 29.

**Hoje:**
```typescript
const { data: profiles } = await supabase
  .from('profiles')
  .select('id, email, full_name, avatar_url, role')
  .order('email')
```

**Depois:**
```typescript
const { data: profiles } = await supabase
  .from('profiles')
  .select('id, email, full_name, avatar_url, role')
  .is('archived_at', null)
  .order('email')
```

---

## 3. Critérios de Aceite

### CA-01 — Usuário arquivado não aparece no selector

- **Given** usuário `U` com `archived_at IS NOT NULL` no banco
- **When** admin ou coord abre o modal de criação/edição de tarefa no Kanban
- **Then** `U` não aparece na lista de assignees disponíveis.

### CA-02 — Usuários ativos continuam aparecendo

- **Given** usuários com `archived_at IS NULL`
- **When** modal de assignee abre
- **Then** todos os usuários ativos aparecem, ordenados por email.

### CA-03 — Tarefas existentes com assignee arquivado não quebram

- **Given** task já existente com assignee arquivado (rows em `task_assignees` para profile com `archived_at`)
- **When** Kanban carrega
- **Then** a task renderiza normalmente; o avatar do assignee arquivado continua visível no card (a filtragem é só no *selector de criação/edição*, não nas tasks já atribuídas). Nenhum erro de tipo.

### CA-04 — `pnpm typecheck && pnpm lint` continuam passando

- **Given** fix aplicado
- **When** `pnpm typecheck && pnpm lint` executado
- **Then** saída sem erros.

---

## 4. Escopo negativo

- ❌ Remover assignee arquivado de tasks existentes — decisão de negócio não tomada; não implementar.
- ❌ Avisar o assignee de que foi arquivado — roadmap.
- ❌ Filtrar arquivados na aba Admin de usuários — já implementado desde Sprint 05 (badge "Arquivado").
