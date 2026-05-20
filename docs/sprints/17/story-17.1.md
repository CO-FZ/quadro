---
id: 17.1
sprint: 17
title: Loading skeletons para todas as rotas (app)
status: pendente
size: S
tipo: performance
depends_on: []
---

# Story 17.1 — Loading Skeletons

## Problema

Nenhuma rota `(app)` tem `loading.tsx`. Ao navegar entre abas, o usuário vê tela branca ou conteúdo congelado até o Server Component completar todas as queries remotas. Em conexões lentas (campo) isso pode ser 1–3 segundos de freeze.

## Como o Next.js funciona

`loading.tsx` em `app/(app)/<rota>/loading.tsx` é automaticamente envolvido em `<Suspense>`:

```
Link clicado
  └─ Next.js inicia streaming da nova rota
      ├─ loading.tsx → renderizado IMEDIATAMENTE (zero latência)
      └─ page.tsx → aguarda queries; substitui loading ao completar
```

Sem `loading.tsx`, o Suspense boundary usa o layout existente como fallback (congelado).

## Solução

Criar `loading.tsx` em cada rota de `(app)`:

| Arquivo | Skeleton |
|---------|----------|
| `app/(app)/dashboard/loading.tsx` | Cards de stats + tabela de usuários |
| `app/(app)/kanban/loading.tsx` | 5 colunas com cards placeholder |
| `app/(app)/matriz/loading.tsx` | Grid de datas + linhas de usuário |
| `app/(app)/profile/loading.tsx` | Header de perfil + lista de tarefas |
| `app/(app)/admin/loading.tsx` | Tabs + tabela placeholder |

### Padrão de implementação

Skeleton usa `animate-pulse` do Tailwind. Não deve criar componentes novos — JSX inline em cada `loading.tsx`.

```tsx
// Exemplo: kanban/loading.tsx
export default function KanbanLoading() {
  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-32 bg-muted rounded-lg animate-pulse" />
        <div className="h-9 w-40 bg-muted rounded-xl animate-pulse" />
      </div>
      {/* 5 colunas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 flex-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-3 flex flex-col gap-3">
            <div className="h-8 bg-muted rounded-xl animate-pulse" />
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-24 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
```

Skeleton deve ter **mesma estrutura de grid** que o componente real para evitar layout shift (CLS).

## Arquivos

- `app/(app)/dashboard/loading.tsx` — novo
- `app/(app)/kanban/loading.tsx` — novo
- `app/(app)/matriz/loading.tsx` — novo
- `app/(app)/profile/loading.tsx` — novo
- `app/(app)/admin/loading.tsx` — novo

## Critérios de aceite

- `pnpm typecheck` verde
- Navegar para qualquer rota exibe skeleton antes dos dados (verificar em DevTools → Network → Slow 3G)
- Sem layout shift significativo ao substituir skeleton por conteúdo real
- Skeleton usa mesma grade/estrutura visual do componente real
