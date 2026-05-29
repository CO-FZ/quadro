# Story 23.4 — Reflexo dos afastamentos na Matriz

**Sprint:** 23
**Prioridade:** P1
**Depende de:** 23.2 (tipos + actions)
**Arquivos afetados:** `components/features/MatrizView.tsx`, `app/(app)/matriz/page.tsx`

## Contexto

A Matriz (`MatrizView.tsx`) tem **dias = linhas**, **membros = colunas**, janela ±7 dias. Cada célula já lista tarefas via `getTasksForCell` (`:64`). Adicionar um badge de afastamento na célula do membro nos dias dentro de um período.

## O que fazer

### 1. `app/(app)/matriz/page.tsx` — carregar afastamentos da janela

Adicionar à `Promise.all` (junto de tasks/profiles) uma busca de `leaves` que intersecta a janela:

```ts
supabase
  .from('leaves')
  .select('id, profile_id, type, start_date, end_date, description')
  .lte('start_date', fmt(windowEnd))
  .gte('end_date', fmt(windowStart)),
```

Passar `leaves={(leaves ?? []) as Leave[]}` para `MatrizView`.

### 2. `MatrizView.tsx`

- Nova prop `leaves: Pick<Leave, 'id'|'profile_id'|'type'|'start_date'|'end_date'|'description'>[]`.
- Helper `getLeavesForCell(leaves, userId, day)` — filtra `profile_id === userId && start_date <= day && end_date >= day`.
- Mapa de cor por tipo (espelhar `STATUS_BADGE`):
  ```ts
  const LEAVE_BADGE: Record<LeaveType, string> = {
    ferias: 'bg-green-500/15 text-green-700 dark:text-green-400',
    instalacao: 'bg-amber-400/20 text-amber-700 dark:text-amber-400',
    dispensa: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  }
  ```
- Na célula do membro (`:248` em diante), **acima** das tarefas, renderizar um badge por afastamento ativo no dia: rótulo via `lib/i18n` (`leaves.type[type]`), `title` com o intervalo. Truncar como os badges de tarefa.

> Decisão de UX: o badge de afastamento vem **primeiro** (topo da célula) para sinalizar indisponibilidade antes das tarefas.

## Critérios de aceite

- [ ] Membro com férias no período: badge verde "Férias" nas células dos dias correspondentes
- [ ] Instalação → badge âmbar; Dispensa → badge azul
- [ ] Badge aparece junto/acima das tarefas existentes, sem quebrar o layout sticky
- [ ] Dias fora do período não mostram badge
- [ ] Query da página filtra `leaves` pela janela (não traz o ano inteiro)
- [ ] `pnpm typecheck` passa
