# Story 22.2 — RLS + App: Efetivo aloca qualquer membro em tarefas

**Sprint:** 22  
**Prioridade:** P0  
**Depende de:** 22.1 (profiles visíveis)

## Contexto

Efetivo não consegue alocar outros membros porque:
1. RLS `task_assignees_insert`: permite apenas self-assign ou criador da task
2. RLS `task_assignees_update/delete`: apenas admin/coordenador
3. `use-cases.ts:updateTaskAssignees()`: chama `requirePrivileged()` antes de qualquer operação
4. UI (`TaskDetailModal.tsx:127`): checkboxes de assignees só renderizam quando `canManage=true`

## O que fazer

### 1. Migration — relaxar task_assignees

Arquivo: `supabase/migrations/<timestamp>_relax_task_assignees_policy.sql`

```sql
DROP POLICY IF EXISTS "task_assignees_insert" ON public.task_assignees;
CREATE POLICY "task_assignees_insert"
    ON public.task_assignees
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "task_assignees_update" ON public.task_assignees;
CREATE POLICY "task_assignees_update"
    ON public.task_assignees
    FOR UPDATE
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "task_assignees_delete" ON public.task_assignees;
CREATE POLICY "task_assignees_delete"
    ON public.task_assignees
    FOR DELETE
    TO authenticated
    USING (true);
```

### 2. use-cases.ts — remover requirePrivileged de updateTaskAssignees

Arquivo: `src/modules/task-board/application/use-cases.ts:57-66`

```ts
// ANTES
export async function updateTaskAssignees(taskId: string, userIds: string[]) {
  const { userId } = await requirePrivileged()
  ...
}

// DEPOIS
export async function updateTaskAssignees(taskId: string, userIds: string[]) {
  const caller = await getCallerRole()
  if (!caller.userId) throw new AppError('UNAUTHENTICATED')
  ...
}
```

### 3. TaskDetailModal.tsx — mostrar assignee UI para todos

Arquivo: `components/features/TaskDetailModal.tsx:127`

Substituir `{canManage && (/* assignee checkboxes */)}` por `{canAssign && (/* assignee checkboxes */)}` onde `canAssign` vem como prop separada (sempre `true` para qualquer role autenticado).

Isso requer adição de prop `canAssign: boolean` na interface `TaskDetailModalProps`.

## Critérios de aceite

- [ ] Efetivo: vê checkboxes de assignees no TaskDetailModal
- [ ] Efetivo: consegue marcar João (outro membro) em uma tarefa sem erro
- [ ] Efetivo: consegue desmarcar um membro de uma tarefa
- [ ] Coordenador/Admin: comportamento inalterado
- [ ] Server action não lança `FORBIDDEN` para efetivo
