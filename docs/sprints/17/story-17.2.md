---
id: 17.2
sprint: 17
title: Paralelizar queries independentes nas pages
status: pendente
size: XS
tipo: performance
depends_on: []
---

# Story 17.2 — Paralelização de Queries

## Problema

Queries independentes dentro de cada `page.tsx` são aguardadas em série com `await`. O TTFB (Time to First Byte) é a soma de todas as latências em vez do máximo.

### Estado atual

**`kanban/page.tsx`** — 3 queries sequenciais antes de uma 4ª dependente:
```ts
const { data: tasks } = await supabase.from('tasks').select(...)       // ~80ms
const { data: profiles } = await supabase.from('profiles').select(...) // ~40ms
const { data: { user } } = await supabase.auth.getUser()               // ~30ms
// 4ª depende de user.id — aceitável
```
Tempo total: ~150ms. Com paralelo: ~80ms.

**`dashboard/page.tsx`** — 2 queries sequenciais independentes:
```ts
const { data: stats } = await supabase.from('user_task_stats').select(...)
const { data: taskCounts } = await supabase.from('tasks').select(...)
```

**`matriz/page.tsx`** — 2 queries sequenciais independentes:
```ts
const { data: tasks } = await supabase.from('tasks').select(...)
const { data: profiles } = await supabase.from('profiles').select(...)
```

## Solução

`Promise.all` para queries sem dependência entre si.

### `kanban/page.tsx`

```ts
const [
  { data: tasks },
  { data: profiles },
  { data: { user } },
] = await Promise.all([
  supabase.from('tasks').select(`...`).order('created_at', { ascending: false }),
  supabase.from('profiles').select('id, email, full_name, nome_guerra, avatar_url, role, patente')
    .is('archived_at', null).order('email'),
  supabase.auth.getUser(),
])

// currentProfile depende de user.id — query separada (sequencial por necessidade)
const { data: currentProfile } = await supabase
  .from('profiles').select('id, role').eq('id', user?.id ?? '').single()
```

### `dashboard/page.tsx`

```ts
const [{ data: stats }, { data: taskCounts }] = await Promise.all([
  supabase.from('user_task_stats').select('*')
    .order('alocada_tasks', { ascending: false })
    .order('total_tasks', { ascending: false }),
  supabase.from('tasks').select('status, sector, end_date').eq('is_servico', false),
])
```

### `matriz/page.tsx`

```ts
const [{ data: tasks }, { data: profiles }] = await Promise.all([
  supabase.from('tasks').select(`...`).lte(...).gte(...).neq(...),
  supabase.from('profiles').select('id, email, full_name, nome_guerra, avatar_url, role, patente')
    .is('archived_at', null),
])
```

## Arquivos

- `app/(app)/kanban/page.tsx`
- `app/(app)/dashboard/page.tsx`
- `app/(app)/matriz/page.tsx`

## Critérios de aceite

- `pnpm typecheck` verde
- Comportamento funcional idêntico ao atual
- Sem erros de tipo nas desestruturações de `Promise.all`
