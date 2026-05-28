# Story 23.2 — Domínio `personnel` + Server Actions `leaves`

**Sprint:** 23
**Prioridade:** P0
**Depende de:** 23.1 (tabela `leaves`)
**Arquivos afetados:** módulo novo `src/modules/personnel/*`, `lib/actions/leaves.ts`, `lib/supabase/types.ts`, unit tests

## Contexto

Seguir a Clean Architecture já usada em `src/modules/task-board` (ADR 0006). O módulo `personnel` é a fonte de verdade dos tipos de afastamento. As Server Actions seguem o contrato discriminado `{ ok: true } | { ok: false, code, message }` e os guards de `lib/auth/require-role.ts` (ADR 0009).

## O que fazer

### 1. Domínio — `src/modules/personnel/domain/entities.ts`

```ts
export type LeaveType = 'ferias' | 'instalacao' | 'dispensa'

export const LEAVE_TYPE_OPTIONS: LeaveType[] = ['ferias', 'instalacao', 'dispensa']

export interface Leave {
  id: string
  profile_id: string
  type: LeaveType
  start_date: string   // 'YYYY-MM-DD'
  end_date: string
  description: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface RawLeaveInput {
  profile_id: string
  type: LeaveType
  start_date: string
  end_date: string
  description: string
}

export interface NormalizedLeaveInput {
  profile_id: string
  type: LeaveType
  start_date: string
  end_date: string
  description: string | null
}

export type LeaveDatesValidation =
  | { ok: true }
  | { ok: false; code: 'START_REQUIRED' | 'END_REQUIRED' | 'END_BEFORE_START'; message: string }
```

### 2. Domínio — `src/modules/personnel/domain/leave.ts`

Espelhar `src/modules/task-board/domain/task.ts` + `lib/utils/task-dates.ts`:

- `validateLeaveDates(start, end): LeaveDatesValidation` — exige ambas as datas e `end >= start` (comparação lexicográfica de `'YYYY-MM-DD'`, sem `Date`).
- `normalizeLeaveInput(raw: RawLeaveInput): NormalizedLeaveInput` — `description.trim() || null`.

### 3. Repository (interface) — `src/modules/personnel/domain/repository.ts`

```ts
export interface LeaveRepository {
  listLeaves(filter?: { year?: number; from?: string; to?: string }): Promise<Leave[]>
  createLeave(data: NormalizedLeaveInput & { created_by: string }): Promise<Leave>
  updateLeave(id: string, data: NormalizedLeaveInput): Promise<Leave>
  deleteLeave(id: string): Promise<void>
}
```

### 4. Use cases — `src/modules/personnel/application/use-cases.ts`

`LeaveUseCases` recebendo `Caller` (ver `require-role.ts`):

- `create/update/delete`: exigir `caller` privilegiado (`assertRoleAllowed(caller, ['admin','coordenador'])` → lançar `'FORBIDDEN'`/`'UNAUTHENTICATED'`). Validar datas (`validateLeaveDates`) antes de persistir.
- `list`: leitura, sem guard (RLS já libera).

### 5. Infra — `src/modules/personnel/infrastructure/supabase-leave-repository.ts`

Espelhar `supabase-task-repository.ts`. `listLeaves` aceita filtro por janela (`lte('start_date', to).gte('end_date', from)`) para a Matriz e por ano para o Gantt.

### 6. Server Actions — `lib/actions/leaves.ts`

```ts
'use server'
// getLeaves(filter?), createLeave(raw), updateLeave(id, raw), deleteLeave(id)
// padrão idêntico a lib/actions/tasks.ts:
//   - getCallerRole()
//   - normalizeLeaveInput()
//   - taskUseCases-style LeaveUseCases
//   - revalidatePath('/admin'); revalidatePath('/matriz')
//   - map de erros: UNAUTHENTICATED / FORBIDDEN / VALIDATION / UNEXPECTED
```

### 7. Tipos — `lib/supabase/types.ts`

Re-exportar `Leave`, `LeaveType`, `LEAVE_TYPE_OPTIONS` de `@/src/modules/personnel/domain/entities` (mesmo bloco que re-exporta os tipos de task-board).

### 8. Unit tests

- `tests/unit/src/personnel/leave.test.ts` — `validateLeaveDates` (faltando início/fim, `end < start`, caso válido) e `normalizeLeaveInput` (trim → null).

## Critérios de aceite

- [ ] `pnpm typecheck` passa (sem `any`)
- [ ] `validateLeaveDates` cobre os 3 códigos + sucesso (unit verde)
- [ ] `createLeave` por efetivo → `{ ok: false, code: 'FORBIDDEN' }`
- [ ] `createLeave` por coordenador/admin com datas válidas → `{ ok: true }`
- [ ] Datas invertidas → `{ ok: false, code: 'VALIDATION' }` (não chega ao banco)
- [ ] Actions chamam `revalidatePath('/admin')` e `revalidatePath('/matriz')`
