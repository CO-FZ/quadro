# API Contracts — Quadro CO-FZ

**Tipo de API:** Server Actions (Next.js) — contratos internos
**Formato de retorno:** `{ ok: true, data?: T } | { ok: false, code: string }`

---

## Tasks

### `createTask(input)`

**Autorização:** `admin | coordenador | efetivo`
**Arquivo:** `lib/actions/tasks.ts`

```typescript
input: {
  title: string          // obrigatório, não vazio
  description?: string
  due_date?: string      // ISO 8601
  assignee_ids?: string[]
}

response: { ok: true } | { ok: false, code: 'UNAUTHORIZED' | 'VALIDATION_ERROR' }
```

---

### `updateTask(id, input)`

**Autorização:** `admin | coordenador` (efetivo → FORBIDDEN)
**Arquivo:** `lib/actions/tasks.ts`

```typescript
input: Partial<{
  title: string
  description: string
  due_date: string
  assignee_ids: string[]
}>

response: { ok: true } | { ok: false, code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' }
```

---

### `updateTaskStatus(id, status)`

**Autorização:** `admin | coordenador | efetivo` (finalizada/arquivada: `admin | coordenador`)
**Arquivo:** `lib/actions/tasks.ts`

```typescript
status: 'pendente' | 'em_andamento' | 'finalizada' | 'arquivada'

response: { ok: true } | { ok: false, code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'INVALID_TRANSITION' }
```

---

### `archiveTask(id)` / `deleteTask(id)`

**Autorização:** `admin`

```typescript
response: { ok: true } | { ok: false, code: 'UNAUTHORIZED' | 'NOT_FOUND' }
```

---

## Admin

### `updateUserRole(userId, role)`

**Autorização:** `admin`
**Guard:** LAST_ADMIN — retorna `LAST_ADMIN` se tentar rebaixar o último admin
**Arquivo:** `lib/actions/admin.ts`

```typescript
role: 'admin' | 'coordenador' | 'efetivo'

response: { ok: true } | { ok: false, code: 'UNAUTHORIZED' | 'LAST_ADMIN' | 'NOT_FOUND' }
```

---

### `archiveUser(userId)` / `restoreUser(userId)`

**Autorização:** `admin`
**Guard:** LAST_ADMIN em `archiveUser`

```typescript
response: { ok: true } | { ok: false, code: 'UNAUTHORIZED' | 'LAST_ADMIN' | 'NOT_FOUND' }
```

---

### `addWhitelistEntry(input)` / `bulkAddWhitelist(text)`

**Autorização:** `admin`

```typescript
input: { email?: string, domain?: string, default_role: 'admin' | 'coordenador' | 'efetivo' }
bulkText: string  // emails/domínios separados por \n, , ou ;

response: { ok: true, added: number } | { ok: false, code: 'UNAUTHORIZED' | 'VALIDATION_ERROR' }
```

---

## Autenticação

Ver [auth.md](auth.md).

---

## Evolução dos contratos (Sprint 09+)

Após Clean Architecture, Server Actions viram facades finas. Os contratos acima permanecem iguais externamente — a implementação interna migra para use cases.
