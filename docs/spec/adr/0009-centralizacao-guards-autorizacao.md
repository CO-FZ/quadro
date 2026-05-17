# ADR 0009 — Centralização dos Guards de Autorização

**Status:** `Aceito`
**Data:** 2026-05-17
**Autor:** Agente (Sprint 10)
**Substitui:** Implementação local `requireAdmin()` em `lib/actions/admin.ts`
**Relaciona-se com:** [ADR 0001 — RBAC via Supabase RLS](0001-rbac-via-supabase-rls.md), [ADR 0003 — Defesa em camadas](0003-defesa-em-camadas-tasks.md)

---

## Contexto

O projeto acumulou dois estilos divergentes de guard de autorização nas Server Actions:

**Estilo A — centralizado** (`lib/actions/tasks.ts`):
```typescript
import { getCallerRole } from '@/lib/auth/require-role'
const caller = await getCallerRole()   // memoizado com React.cache
```

**Estilo B — local** (`lib/actions/admin.ts`):
```typescript
async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // consulta direta sem cache, sem logger unificado
  ...
}
```

Problemas do Estilo B:
1. **Sem `React.cache`**: cada chamada dispara uma nova query ao banco, mesmo dentro do mesmo request cycle.
2. **Logger diferente**: `admin.ts` não emite `role_forbidden` para o logger centralizado.
3. **Manutenção duplicada**: qualquer mudança na lógica de role requer atualização em dois lugares.
4. **`getWhitelist()` sem guard**: a função retornava dados privilegiados sem verificar a role do caller, violando o ADR 0003 (Defesa em Camadas).

---

## Decisão

Todos os guards de autorização nas Server Actions devem usar exclusivamente o módulo `lib/auth/require-role.ts`.

### Exports canônicos

```typescript
// lib/auth/require-role.ts

export const getCallerRole = cache(async (): Promise<Caller> => { ... })
// ↑ memoizado com React.cache — única consulta por request cycle

export function assertRoleAllowed(caller, allowed): RoleGuardError | null { ... }
// ↑ função pura, testável em unit test sem I/O

export async function requireRole(allowed: AppRole[]): Promise<RoleGuardError | null> { ... }
// ↑ combina getCallerRole + assertRoleAllowed + logger

export async function requireAdmin(): Promise<RoleGuardError | null>
// ↑ shorthand: requireRole(['admin'])

export async function requirePrivileged(): Promise<RoleGuardError | null>
// ↑ shorthand: requireRole(['admin', 'coordenador'])
```

### Padrão de uso nas Server Actions

```typescript
'use server'
import { requireAdmin } from '@/lib/auth/require-role'

export async function minhaAction(...): Promise<ActionResult> {
  const deny = await requireAdmin()
  if (deny) return deny
  // ...lógica de negócio
}
```

---

## Consequências

**Positivas:**
- Consulta de role memoizada: zero queries extras para múltiplas ações no mesmo request.
- Logger unificado: todos os `FORBIDDEN` emitem `role_forbidden` automaticamente.
- Ponto único de mudança: alterar a lógica de role requer edição apenas em `require-role.ts`.
- `getWhitelist()` agora tem guard explícito — conformidade com ADR 0003.

**Negativas:**
- Migração necessária de qualquer `requireAdmin()` local que surgir futuramente.
- `requireAdmin()` do módulo centralizado retorna `RoleGuardError | null` (tipagem diferente do retorno `{ ok: false }` do estilo antigo) — componentes que consomem o resultado devem verificar `.code` em vez de `.ok`.

---

## Mudanças aplicadas

| Arquivo | Mudança |
|---------|---------|
| `lib/auth/require-role.ts` | Adicionados `requireAdmin()` e `requirePrivileged()` |
| `lib/actions/admin.ts` | Removida `requireAdmin()` local; import do módulo centralizado |
| `lib/actions/admin.ts` | Adicionado guard em `getWhitelist()` |

---

## Regra para novas Server Actions

> Toda Server Action que retorna ou muta dados privilegiados **deve** chamar `requireAdmin()`, `requirePrivileged()` ou `requireRole([...])` como **primeira instrução** após o início da função.

---

## Referências

- [ADR 0001 — RBAC via Supabase RLS](0001-rbac-via-supabase-rls.md)
- [ADR 0003 — Defesa em camadas (tasks)](0003-defesa-em-camadas-tasks.md)
- [`lib/auth/require-role.ts`](../../../../lib/auth/require-role.ts)
