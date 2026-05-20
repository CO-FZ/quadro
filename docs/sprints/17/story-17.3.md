---
id: 17.3
sprint: 17
title: Deduplicar fetch de perfil com React cache()
status: pendente
size: XS
tipo: performance
depends_on: []
---

# Story 17.3 — Deduplicação de Fetch com React cache()

## Problema

`layout.tsx` e `kanban/page.tsx` fazem `supabase.auth.getUser()` separadamente na mesma render-pass RSC. Em `/kanban`, isso gera 4 queries ao DB onde 2 bastam:

| Chamador | Query |
|----------|-------|
| `layout.tsx` | `auth.getUser()` |
| `layout.tsx` | `profiles.select('*').eq('id', user.id)` |
| `kanban/page.tsx` | `auth.getUser()` (duplicata) |
| `kanban/page.tsx` | `profiles.select('id,role').eq('id', user.id)` (duplicata parcial) |

## Solução

`cache()` do React (não `unstable_cache`) — deduplicates chamadas com mesmos argumentos dentro da **mesma** requisição RSC. Não persiste entre requests (comportamento correto para auth).

### Criar `lib/supabase/queries.ts`

```ts
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

/** Deduplicated within the same RSC render-pass. */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

export const getCurrentProfile = cache(async () => {
  const user = await getCurrentUser()
  if (!user) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, role, email, full_name, nome_guerra, avatar_url, patente, archived_at, created_at, updated_at')
    .eq('id', user.id)
    .single()
  return data
})
```

### Atualizar `layout.tsx`

```ts
import { getCurrentUser, getCurrentProfile } from '@/lib/supabase/queries'

export default async function AppLayout(...) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const profile = await getCurrentProfile()
  ...
}
```

### Atualizar `kanban/page.tsx`

```ts
import { getCurrentUser, getCurrentProfile } from '@/lib/supabase/queries'

export default async function KanbanPage() {
  const [{ data: tasks }, { data: profiles }, user, currentProfile] = await Promise.all([
    supabase.from('tasks').select(...),
    supabase.from('profiles').select(...),
    getCurrentUser(),         // deduplicated — zero cost se layout já chamou
    getCurrentProfile(),      // deduplicated — zero cost se layout já chamou
  ])
  ...
}
```

## Observação importante

`cache()` do React deduplicates calls **por argumentos** dentro da **mesma request**. Como layout e page renderizam na mesma requisição RSC, a segunda chamada a `getCurrentUser()` retorna o valor cacheado sem ir ao DB. Isso é garantido pela spec do React.

## Arquivos

- `lib/supabase/queries.ts` — novo
- `app/(app)/layout.tsx`
- `app/(app)/kanban/page.tsx`

## Critérios de aceite

- `pnpm typecheck` verde
- Comportamento de auth idêntico (redirect para `/login` se sem sessão)
- Sem regressão nos dados de `currentProfile` exibidos no `AppShell`
