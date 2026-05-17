# ADR 0012 — Introdução de Tarefas de Serviço (`is_servico`)

**Status:** `Aceito`
**Data:** 2026-05-17
**Aprovado retroativamente:** Sprint 10 (migrations `20260517000004` e `20260517000005`)
**Autor:** Agente (Sprint 10/11 — débito técnico DT-A3)
**Relaciona-se com:** [ADR 0003 — Defesa em Camadas — Tasks](0003-defesa-em-camadas-tasks.md), [ADR 0006 — Modular Monolith](0006-modular-monolith-clean-architecture.md), [ADR 0011 — Extensão de Perfil Militar](0011-extensao-perfil-militar.md)

---

## Contexto

O Quadro CO-FZ é usado por uma unidade militar onde, além de tarefas técnicas/administrativas, há **atividades de serviço recorrentes** (oficial de dia, escala de ronda, plantão) que precisam ser visíveis no quadro de trabalho — mas:

1. **Não representam produtividade técnica** do efetivo. Contabilizá-las nos KPIs do dashboard distorce métricas e induz comparações injustas (oficial escalado para plantão vs. oficial executando entregáveis).
2. **Não têm título funcional distinto** — toda escala é genericamente "Serviço".
3. **Não comportam descrição livre nem link** — são tarefas operacionais simples, sem entregável documentado.

Antes desta decisão, qualquer escala de serviço era criada como tarefa comum, contaminando o dashboard (`user_task_stats`) e gerando ruído no kanban.

---

## Decisão

### 1. Campo de domínio

Adicionar `is_servico: boolean` (default `false`) ao tipo `Task` e à tabela `tasks`:

```typescript
// src/modules/task-board/domain/entities.ts
export interface Task {
  ...
  is_servico: boolean
}
```

```sql
ALTER TABLE public.tasks
    ADD COLUMN is_servico BOOLEAN NOT NULL DEFAULT FALSE;
```

### 2. Normalização rígida (camada domínio)

Quando `is_servico === true`, `normalizeTaskInput` aplica **invariantes obrigatórias**:

| Campo | Valor forçado |
|-------|---------------|
| `title` | `'Serviço'` (literal) |
| `description` | `null` |
| `drive_url` | `null` |

```typescript
// src/modules/task-board/domain/rules.ts
export function normalizeTaskInput(data: RawTaskInput): NormalizedTaskInput {
  return {
    title:       data.is_servico ? 'Serviço' : data.title.trim(),
    description: data.is_servico ? null      : (data.description.trim() || null),
    drive_url:   data.is_servico ? null      : (data.drive_url.trim() || null),
    ...
  }
}
```

Justificativa: aplicar a regra na **camada de domínio** (em vez de na UI) garante que qualquer caminho de criação/edição — Server Action, sync de Google Sheets, futuras integrações — respeite a invariante. Segue ADR 0003 §B (defesa em camadas).

### 3. Exclusão das métricas (camada de banco)

A view `user_task_stats` exclui explicitamente tarefas de serviço de **todas** as agregações de produtividade:

```sql
-- supabase/migrations/20260517000005_update_user_task_stats_exclude_servico.sql
COUNT(t.id) FILTER (WHERE NOT t.is_servico)                                    AS total_tasks,
COUNT(t.id) FILTER (WHERE NOT t.is_servico AND t.status = 'alocada')           AS alocada_tasks,
COUNT(t.id) FILTER (WHERE NOT t.is_servico AND t.status = 'finalizada')        AS finished_tasks,
COUNT(t.id) FILTER (WHERE NOT t.is_servico AND t.status = 'em_desenvolvimento') AS in_progress_tasks,
COUNT(t.id) FILTER (WHERE NOT t.is_servico AND t.status = 'em_revisao')        AS in_review_tasks
```

A exclusão na view (não no aplicativo) garante que **qualquer consumidor** do dashboard receba a métrica corrigida — incluindo relatórios futuros e queries ad-hoc.

### 4. Visualização no Kanban

Tarefas de serviço **continuam visíveis** no kanban (não são ocultas). Justificativa: o kanban é a fonte operacional do dia a dia; o efetivo precisa ver quem está escalado. A exclusão é estritamente da agregação de produtividade.

---

## Migrations relacionadas

| Migration | Conteúdo |
|-----------|----------|
| `20260517000004_add_is_servico_to_tasks.sql` | Adição da coluna `is_servico BOOLEAN NOT NULL DEFAULT FALSE` |
| `20260517000005_update_user_task_stats_exclude_servico.sql` | Recriação da view `user_task_stats` com filtros `WHERE NOT t.is_servico` |

---

## Consequências

**Positivas:**
- Separação semântica clara entre "tarefa de trabalho" e "tarefa de serviço".
- Métricas do dashboard refletem produtividade técnica real, sem contaminação por escalas.
- Invariantes garantidas na camada de domínio (impossível criar serviço com título customizado via Server Action).

**Negativas:**
- Toda nova métrica baseada em `tasks` precisa lembrar do filtro `WHERE NOT is_servico`. Mitigação: centralizar agregações em `user_task_stats` (já feito) e bloquear queries diretas a `tasks` no dashboard.
- O título `'Serviço'` é não-localizado (string mágica). Aceitável para v1; quando o produto suportar outros idiomas, mover para `lib/i18n`.

---

## Alternativas consideradas

1. **Tabela separada `services`** — descartado: dobraria o modelo de assignees, datas e RLS sem ganho funcional.
2. **Status dedicado `servico`** — descartado: conflita com o conceito de status (lifecycle), poluindo `KANBAN_COLUMNS`.
3. **Tag/label genérica** — descartado: precisaria de tabela de tags e UI dedicada; over-engineering para um caso de uso binário.

---

## Referências

- [`supabase/migrations/20260517000004_add_is_servico_to_tasks.sql`](../../../../supabase/migrations/20260517000004_add_is_servico_to_tasks.sql)
- [`supabase/migrations/20260517000005_update_user_task_stats_exclude_servico.sql`](../../../../supabase/migrations/20260517000005_update_user_task_stats_exclude_servico.sql)
- [`src/modules/task-board/domain/rules.ts`](../../../../src/modules/task-board/domain/rules.ts)
- [`tests/unit/src/modules/task-board/domain/task.test.ts`](../../../../tests/unit/src/modules/task-board/domain/task.test.ts)
- [ADR 0003 — Defesa em Camadas](0003-defesa-em-camadas-tasks.md)
