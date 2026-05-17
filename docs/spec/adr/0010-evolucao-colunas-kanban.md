# ADR 0010 — Evolução de Colunas Kanban e Status `arquivada`

**Status:** `Aceito`
**Data:** 2026-05-17
**Aprovado retroativamente:** Sprint 09 (migration `20260516140000_em_revisao_status.sql`)
**Autor:** Agente (Sprint 10 — retroativo)
**Relaciona-se com:** [ADR 0006 — Modular Monolith](0006-modular-monolith-clean-architecture.md), [ADR 0007 — State Architecture](0007-state-architecture.md)

---

## Contexto

Na Sprint 09 foi adicionada a coluna **"Em revisão"** ao fluxo Kanban para permitir que tarefas passassem por uma etapa de revisão antes de serem marcadas como concluídas. A migration correspondente adicionou o valor `em_revisao` ao enum `task_status` no Postgres.

Simultaneamente, existe o status `arquivada` no enum, utilizado para soft-delete de tarefas. Este status **não é uma coluna do Kanban** — tarefas arquivadas não aparecem no board.

A ausência de documentação gerou a inconsistência: `KANBAN_COLUMNS` no domínio não inclui `arquivada`, mas o código trata o status como válido em queries de arquivamento.

---

## Decisão

### 1. Colunas Kanban (visíveis no board)

```typescript
// src/modules/task-board/domain/entities.ts
export const KANBAN_COLUMNS = ['backlog', 'em_andamento', 'em_revisao', 'concluida'] as const
export type KanbanColumn = typeof KANBAN_COLUMNS[number]
```

Estas são as colunas visíveis no Kanban board. Toda tarefa no board deve ter um status pertencente a este conjunto.

### 2. Status `arquivada` — fora do board

```typescript
export type TaskStatus = KanbanColumn | 'arquivada'
```

`arquivada` é um **status de ciclo de vida**, não uma coluna. Tarefas arquivadas:
- **Não aparecem** no Kanban board.
- São filtradas via `status != 'arquivada'` em todas as queries de listagem.
- São acessíveis apenas via página de arquivo (futura) ou via admin.

### 3. Regra de transição

```
backlog → em_andamento → em_revisao → concluida
qualquer_status → arquivada  (ação admin/coordenador)
arquivada → qualquer_status  (restauração — ação admin)
```

---

## Consequências

**Positivas:**
- Distinção explícita entre "coluna de trabalho" e "status de ciclo de vida".
- Código de filtragem alinhado com a intenção arquitetural.

**Negativas:**
- A tipo `TaskStatus` é mais amplo que `KanbanColumn` — componentes que renderizam colunas devem usar `KanbanColumn`, não `TaskStatus`.

---

## Migrations relacionadas

| Migration | Conteúdo |
|-----------|----------|
| `20260506000002_archived_status.sql` | Adição do status `arquivada` ao enum |
| `20260516140000_em_revisao_status.sql` | Adição do status `em_revisao` ao enum e view |
| `20260516140001_update_user_task_stats_view.sql` | Atualização da view de estatísticas |

---

## Referências

- [`src/modules/task-board/domain/entities.ts`](../../../../src/modules/task-board/domain/entities.ts)
- [ADR 0006 — Modular Monolith](0006-modular-monolith-clean-architecture.md)
