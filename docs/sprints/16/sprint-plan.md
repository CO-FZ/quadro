---
sprint: 16
title: Performance Engineering — Mobile-First
status: concluida
inicio: 2026-05-20
conclusao: 2026-05-21
objetivo: Otimizar renderização do front-end para fluidez em dispositivos móveis de campo; reduzir bundle inicial e re-renderizações desnecessárias.
---

# Sprint 16 — Performance Engineering (Mobile-First)

- **Status:** CONCLUÍDA
- **Início:** 20/05/2026
- **Conclusão:** 21/05/2026
- **Objetivo:** Memoização de componentes quentes, lazy loading de modais pesados, e virtualização das colunas do Kanban para suportar centenas de tarefas.

---

## Stories

| ID | Título | Size | Status |
|----|--------|------|--------|
| 16.1 | Memoização de TaskCard + callbacks no KanbanBoard | S | ✅ concluída |
| 16.2 | Lazy loading de modais pesados (next/dynamic) | S | ✅ concluída |
| 16.3 | Virtualização das colunas do Kanban | M | ✅ concluída |

---

## Dependências

- `@tanstack/react-virtual` (nova dep — Story 16.3)
- Nenhum schema change — sem migration

## Riscos

- **Story 16.3 x DnD**: Virtualização + HTML5 drag nativo são incompatíveis quando lista excede viewport. Ver detalhamento no Plan Artifact.

## Critérios de aceite

- [x] `pnpm typecheck` verde
- [x] `pnpm test:unit` verde
- [x] Zero re-renders desnecessários de TaskCard durante drag (`React.memo` + `useCallback` em `KanbanBoard`)
- [x] Bundle inicial do /kanban reduzido (`next/dynamic` com `ssr: false` para `TaskDetailModal`)
- [x] Coluna com 200+ tarefas renderiza sem jank (`useVirtualizer` via `@tanstack/react-virtual`)

## Commit de entrega

- `06d7235` — perf: optimize kanban rendering with TaskCard memoization, column virtualization and lazy-loading TaskDetailModal
- `cfc1502` — refactor: update virtualizer measurement logic to use dynamic element heights and keys
