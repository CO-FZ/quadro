# Event Flow — Quadro CO-FZ

**Contexto:** Task Board × Integrations
**Formato:** command → use case → domain event → adapter

---

## CreateTask

```text
[User] ──POST──▶ createTask (Server Action)
                 │
                 ├─ requireRole(['admin','coordenador','efetivo'])
                 ├─ validateTaskDates(input)
                 ▼
           CreateTaskUseCase
                 │
                 ├─ TaskRepository.insert(task)
                 ▼
           TaskCreated { id, title, created_by, status: 'pendente' }
                 │
                 └─ (futuro) EventBus.publish(TaskCreated)
```

**Hoje:** Server Action chama Supabase diretamente. Evento implícito via trigger `pg_net.http_post`.

---

## MoveTask

```text
[User] ──POST──▶ updateTaskStatus (Server Action)
                 │
                 ├─ requireRole (condicional por status alvo)
                 ├─ assertStatusTransition(current, target)
                 ▼
           MoveTaskUseCase
                 │
                 ├─ TaskRepository.updateStatus(id, status)
                 ▼
           TaskMoved { id, from: TaskStatus, to: TaskStatus, moved_by }
                 │
                 └─ SyncAdapter.onTaskMoved(event) ──▶ SyncTaskToSheets
```

---

## ArchiveTask

```text
[User] ──POST──▶ archiveTask (Server Action)
                 │
                 ├─ requireRole(['admin'])
                 ▼
           ArchiveTaskUseCase
                 │
                 ├─ TaskRepository.archive(id)
                 ▼
           TaskArchived { id, archived_by, archived_at }
                 │
                 └─ SyncAdapter.onTaskArchived(event) ──▶ SyncTaskToSheets
```

---

## SyncTaskToSheets

```text
Database trigger (pg_net.http_post)
  ▼
Edge Function: sync-sheets (Deno)
  │
  ├─ autenticar via Service Account JSON
  ├─ mapear operação (INSERT/UPDATE/DELETE) → row Sheets
  ▼
Google Sheets API v4
  │
  └─ confirma sync | loga erro (sem retry hoje)
```

**Débito:** sem retry, sem dead-letter queue. Ver [docs/product/roadmap.md](../product/roadmap.md).

---

## Notas para Sprint 09

Ao extrair `task-board/domain` e `application`:

- `TaskCreated`, `TaskMoved`, `TaskArchived` virarão tipos explícitos em `domain/events.ts`.
- `SyncAdapter` será uma porta em `application/ports/sync-adapter.ts`.
- A Edge Function permanece como adapter concreto em `infrastructure/`.
