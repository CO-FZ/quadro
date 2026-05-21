---
id: 16.3
sprint: 16
title: Virtualização das colunas do Kanban
status: concluida
size: M
tipo: performance
depends_on: [16.1]
---

# Story 16.3 — Virtualização Kanban

## Problema

Com centenas de tarefas em uma coluna, todos os `TaskCard` são montados no DOM mesmo que estejam fora do viewport da coluna. Isso gera:
- Tempo de montagem O(n) mesmo para tarefas invisíveis
- Scroll jank em mobile
- Consumo de memória desnecessário

## Solução

Usar `@tanstack/react-virtual` (`useVirtualizer`) na scroll-area de cada coluna.

### Restrição crítica: DnD x Virtualização

O DnD nativo do browser (HTML5 drag events) depende dos elementos estarem no DOM. Com virtualização, cards fora do viewport não existem no DOM, quebrando drop em listas longas.

**Decisão de escopo:**
- Virtualização aplicada **com DnD mantido funcional** dentro do viewport visível. Para listas longas, o usuário pode scrollar a coluna antes de arrastar — comportamento aceitável para o caso de uso de campo.
- **Alternativa rejeitada**: substituir por `@hello-pangea/dnd` (ex-`react-beautiful-dnd`) — escopo maior, story separada se necessário.

## Arquivos

- `package.json` — adicionar `@tanstack/react-virtual`
- `components/features/KanbanBoard.tsx` — `useVirtualizer` na scroll-area de cada coluna

## Critérios de aceite

- [x] `pnpm typecheck` verde
- [x] Coluna com 200 cards: scroll fluido, só cards visíveis no DOM (verificar DevTools → Elements)
- [x] DnD funciona para cards dentro do viewport visível

> **Nota de implementação:** a lógica de medida do virtualizer foi ajustada no commit `cfc1502` para usar alturas dinâmicas (measureElement) e keys estáveis, resolvendo jank no scroll após o drag.
