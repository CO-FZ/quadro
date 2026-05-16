# Clean Architecture — Quadro CO-FZ

**ADR:** [0006](../spec/adr/0006-modular-monolith-clean-architecture.md) (proposto)
**Sprint de primeira implementação:** 09 (`task-board/domain`)

---

## Camadas e regras de dependência

```text
┌──────────────────────────────────────────────────────┐
│  presentation  (Server Components, Server Actions)   │
├──────────────────────────────────────────────────────┤
│  infrastructure  (Supabase adapter, cache, storage)  │
├──────────────────────────────────────────────────────┤
│  application  (use cases, portas/interfaces)         │
├──────────────────────────────────────────────────────┤
│  domain  (entidades, regras puras, eventos)          │
└──────────────────────────────────────────────────────┘
```

**Regra de ouro:** dependências apontam sempre para dentro (domain ← application ← infrastructure/presentation).

### domain

- TypeScript puro. Sem imports de React, Next, Supabase, banco ou browser APIs.
- Contém: entidades, value objects, regras de negócio puras, eventos de domínio, interfaces de repositório.
- Testável com Vitest unit sem mocks de I/O.

### application

- Orquestra use cases.
- Depende de interfaces (portas) definidas no domain ou application.
- Nunca importa adapters concretos (Supabase, cache, `next/cache`).

### infrastructure

- Implementa adapters concretos: `SupabaseTaskRepository`, `NextCacheAdapter`, `GoogleSheetsAdapter`.
- Depende de application (portas). Não é importada pelo domain.

### presentation

- Adapta dados de use cases para Server Components, Server Actions e props de UI.
- Server Actions são facades finas: validam input (Zod), chamam use case, retornam `{ ok: true } | { ok: false, code }`.
- `app/` continua sendo o roteamento Next.js — não move para `src/modules`.

---

## Exemplos — permitido vs. proibido

### ✅ Permitido

```typescript
// domain/task.ts
export type TaskStatus = 'pendente' | 'em_andamento' | 'finalizada' | 'arquivada'
export function isOverdue(task: { due_date: string | null }): boolean {
  if (!task.due_date) return false
  return new Date(task.due_date) < new Date()
}

// application/use-cases/move-task.ts
import type { TaskRepository } from '../ports/task-repository'
export async function moveTask(repo: TaskRepository, id: string, status: TaskStatus) { ... }

// infrastructure/supabase-task-repository.ts
import { createClient } from '@/lib/supabase/server'
export class SupabaseTaskRepository implements TaskRepository { ... }
```

### ❌ Proibido

```typescript
// domain/task.ts — PROIBIDO: importar Supabase no domain
import { createClient } from '@supabase/supabase-js'

// application/use-cases/move-task.ts — PROIBIDO: importar adapter concreto
import { createClient } from '@/lib/supabase/server'

// presentation/actions/tasks.ts — PROIBIDO: lógica de negócio inline na action
export async function moveTask(id: string, status: string) {
  if (status === 'arquivada' && !isAdmin) throw new Error('...')
  await supabase.from('tasks').update({ status })
}
```

---

## Estrutura de módulo

```text
src/modules/<context>/
  domain/
    entities.ts         ← tipos puros
    rules.ts            ← funções puras de negócio
    events.ts           ← tipos de eventos de domínio
    ports/
      <context>-repository.ts  ← interface (porta)
  application/
    use-cases/
      create-<entity>.ts
      update-<entity>.ts
  infrastructure/
    supabase-<entity>-repository.ts
    cache-adapter.ts
  presentation/
    actions.ts          ← Server Actions como facades
    mappers.ts          ← domain ↔ DTO
```

---

## Sequência de migração

1. **Sprint 09** — `task-board/domain`: extrair tipos puros e regras (`isOverdue`, `validateTaskDates`, `assertStatusTransition`). Sem mover UI.
2. **Sprint 09** — `task-board/application`: criar `TaskRepository` (porta) + use cases `CreateTask`, `MoveTask`, `ArchiveTask`.
3. **Sprint 09** — `task-board/infrastructure`: `SupabaseTaskRepository` sem alterar comportamento.
4. **Sprint 09** — `lib/actions/tasks.ts` vira facade temporária chamando use cases.
5. **Sprint 10** — `task-board/presentation`: extrair componentes da `app/(app)/kanban/`.
6. **Sprint 11+** — repetir para identity, reporting, administration.

Em cada passo: `pnpm typecheck && pnpm lint && pnpm test:unit` devem continuar verdes.
