---
id: 16.2
sprint: 16
title: Lazy loading de modais pesados (next/dynamic)
status: concluida
size: S
tipo: performance
depends_on: []
---

# Story 16.2 — Lazy Loading de Modais

## Problema

`TaskDetailModal` (315 linhas) e os modais do `AdminView` (726 linhas) fazem parte do bundle inicial mesmo quando nunca são abertos numa sessão. Em dispositivos de campo com conexão limitada, isso atrasa o TTI (Time to Interactive).

## Solução

1. `TaskCard.tsx` importa `TaskDetailModal` estaticamente → substituir por `next/dynamic` com `{ ssr: false }`.
2. `AdminView.tsx` já é `'use client'`; os modais de edição internos (`EditModal`, `WhitelistModal`) são componentes inline — candidatos a extrair para arquivos separados e lazy-loadar se o bundle crescer. **Escopo desta story: apenas `TaskDetailModal`** (impacto direto e claro).

## Arquivos

- `components/features/TaskCard.tsx`

## Critérios de aceite

- [x] `pnpm typecheck` verde
- [x] `next build` → chunk de `TaskDetailModal` separado do bundle de `/kanban`
- [x] Funcionalidade do modal: abre, fecha, edita — sem regressão
