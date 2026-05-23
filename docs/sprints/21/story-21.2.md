---
id: 21.2
sprint: 21
title: Cobertura de gatilhos — task_assignees e profiles disparam o sync
status: planejada
size: S
tipo: infra
depends_on: [21.1]
---

# Story 21.2 — Gatilhos de `task_assignees` e `profiles`

## Problema

O trigger `on_task_mutation` ([migration 20260507000005](../../../supabase/migrations/20260507000005_google_sheets_webhook.sql)) dispara **apenas** em `tasks`. Mas o pivô da Matriz depende de:

- **`task_assignees`** — a alocação em si. `updateTaskAssignees` faz `delete + insert` em `task_assignees` ([supabase-task-repository.ts:51](../../../src/modules/task-board/infrastructure/supabase-task-repository.ts)) **sem tocar `tasks`** ⇒ hoje a planilha não reflete mudança de alocados.
- **`profiles`** — colunas do pivô (patente, nome de guerra, arquivamento, role).

Sem esses gatilhos, o rebuild da Story 21.1 só roda em mutações de `tasks` — incompleto.

## Solução

Nova migration que **reusa** a função de webhook existente (`handle_task_sync`, refatorada para `handle_sheet_sync`) e adiciona triggers em `task_assignees` e `profiles`. A função já lê `function_url`/`anon_key` de `app_config` ([migration 20260517000006](../../../supabase/migrations/20260517000006_fix_handle_task_sync_config.sql)) e é `SECURITY DEFINER` — manter `SET search_path = public`.

### Gatilhos

| Tabela | Evento | Observação |
|--------|--------|------------|
| `tasks` | INSERT/UPDATE/DELETE | já existe (renomear trigger se a função for renomeada) |
| `task_assignees` | INSERT/DELETE | sem UPDATE — a PK é `(task_id, user_id)`, mutação é delete+insert |
| `profiles` | INSERT/DELETE; UPDATE com `WHEN` | `WHEN` restringe a colunas relevantes |

### `WHEN` de `profiles` (evita rebuild a cada toque de perfil)

```sql
WHEN (
  OLD.patente     IS DISTINCT FROM NEW.patente     OR
  OLD.nome_guerra IS DISTINCT FROM NEW.nome_guerra OR
  OLD.full_name   IS DISTINCT FROM NEW.full_name   OR
  OLD.archived_at IS DISTINCT FROM NEW.archived_at OR
  OLD.role        IS DISTINCT FROM NEW.role
)
```

### Compatibilidade com a Edge Function

A função `handle_sheet_sync` envia `TG_TABLE_NAME` no payload. A Edge Function da Story 21.1 **deve aceitar** `tasks`, `task_assignees` e `profiles` (hoje retorna `400 Invalid table` para tudo ≠ `tasks`). Por isso esta story **depende de 21.1**.

### Seeds de config (se não feitos na 21.1)

`INSERT ... ON CONFLICT DO NOTHING` em `app_config`: `sheet_tab_name='Matriz'`, `sheet_forward_buffer_days='30'`.

## Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `supabase/migrations/2026XXXXXXXXXX_sheet_sync_triggers.sql` | **Novo** — renomeia `handle_task_sync`→`handle_sheet_sync`, adiciona triggers em `task_assignees` e `profiles` (com `WHEN`), seeds de `app_config` |

## Critérios de aceite

- [ ] INSERT/DELETE em `task_assignees` dispara o webhook (verificável por log da Edge Function).
- [ ] UPDATE de `profiles` em coluna relevante dispara; UPDATE em coluna irrelevante (ex.: `avatar_url`) **não** dispara.
- [ ] Trigger de `tasks` preservado.
- [ ] Função permanece `SECURITY DEFINER` com `SET search_path = public`.
- [ ] Migration idempotente (`DROP TRIGGER IF EXISTS`, `CREATE OR REPLACE`).
- [ ] Sem reintrodução de URL/anon-key hardcoded — config continua em `app_config`.

## Como testar

```bash
# Aplicar migration em staging
supabase db push   # ou supabase migration up, conforme runbook

# 1. Reatribuir alocados de uma tarefa → confirmar log 'sync_sheets_received' na Edge Function
# 2. Trocar patente de um profile → confirmar disparo
# 3. Trocar avatar_url de um profile → confirmar QUE NÃO dispara
# 4. Conferir que a aba Matriz reflete as mudanças
```

## Riscos

- **`profiles` UPDATE sem `WHEN`** geraria rebuild a cada login/atualização de perfil. O `WHEN` é obrigatório.
- **Volume de webhooks** ao reatribuir muitos alocados — coberto pela idempotência do rebuild (ver Story 21.1 §Coalescência).
