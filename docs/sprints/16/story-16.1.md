---
id: 16.1
sprint: 16
title: Memoização de TaskCard + callbacks no KanbanBoard
status: pendente
size: S
tipo: performance
depends_on: []
---

# Story 16.1 — Memoização de TaskCard + callbacks

## Problema

`KanbanBoard` mantém estado de drag (`dragOverColumn`, `draggingId`) e filtros. Qualquer mudança de estado (ex: hover em coluna durante drag) causa re-render em **todos** os `TaskCard` do board, mesmo os que nada têm a ver com o evento.

## Solução

1. Envolver `TaskCard` em `React.memo` — evita re-render se props não mudaram.
2. No `KanbanBoard`, usar `useCallback` para `handleDragStart`, `handleDragEnd`, `onRefresh` passados como prop por card.
3. Memoizar `getTasksByStatus` derivados com `useMemo`.

## Arquivos

- `components/features/TaskCard.tsx` — adicionar `React.memo`
- `components/features/KanbanBoard.tsx` — `useCallback` + `useMemo`

## Critérios de aceite

- `pnpm typecheck` verde
- React DevTools Profiler: durante drag, só o card em movimento e a coluna alvo re-renderizam
