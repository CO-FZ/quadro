---
sprint: 16
title: Performance Engineering — Mobile-First
status: em_andamento
inicio: 2026-05-20
objetivo: Otimizar renderização do front-end para fluidez em dispositivos móveis de campo; reduzir bundle inicial e re-renderizações desnecessárias.
---

# Sprint 16 — Performance Engineering (Mobile-First)

- **Status:** CONCLUÍDA
- **Início:** 20/05/2026
- **Conclusão:** 20/05/2026
- **Objetivo:** Memoização de componentes quentes, lazy loading de modais pesados, e virtualização das colunas do Kanban para suportar centenas de tarefas.

---

## Stories

| ID | Título | Size | Status |
|----|--------|------|--------|
| 16.1 | Memoização de TaskCard + callbacks no KanbanBoard | S | pendente |
| 16.2 | Lazy loading de modais pesados (next/dynamic) | S | pendente |
| 16.3 | Virtualização das colunas do Kanban | M | pendente |

---

## Dependências

- `@tanstack/react-virtual` (nova dep — Story 16.3)
- Nenhum schema change — sem migration

## Riscos

- **Story 16.3 x DnD**: Virtualização + HTML5 drag nativo são incompatíveis quando lista excede viewport. Ver detalhamento no Plan Artifact.

## Critérios de aceite

- [ ] `pnpm typecheck` verde
- [ ] `pnpm test:unit` verde
- [ ] Zero re-renders desnecessários de TaskCard durante drag (verificar React DevTools Profiler)
- [ ] Bundle inicial do /kanban reduzido (next/dynamic elimina TaskDetailModal do critical path)
- [ ] Coluna com 200+ tarefas renderiza sem jank (Story 16.3)
