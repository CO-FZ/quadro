# Story 22.3 — App layer: Efetivo edita detalhes da tarefa

**Sprint:** 22  
**Prioridade:** P1  
**Depende de:** 22.1 (profiles visíveis para dropdowns)

## Contexto

Efetivo não consegue editar título, datas, setor, urgência de nenhuma tarefa porque:
1. RLS `tasks UPDATE`: requer admin/coordenador OU ser assignee
2. `use-cases.ts:updateTask()`: chama `requirePrivileged()` 
3. UI: `canManage` único boolean esconde TODOS os controles de gestão (editar, arquivar, deletar, finalizar)

## O que fazer

### 1. Migration — tasks UPDATE aberto para todos autenticados

Arquivo: `supabase/migrations/<timestamp>_relax_tasks_update_policy.sql`

```sql
DROP POLICY IF EXISTS "Atualização de tarefas baseada na role e alocação" ON public.tasks;

CREATE POLICY "tasks_update"
    ON public.tasks
    FOR UPDATE
    TO authenticated
    USING (true);
```

### 2. use-cases.ts — remover requirePrivileged de updateTask

Arquivo: `src/modules/task-board/application/use-cases.ts:32-40`

```ts
// ANTES: verifica role IN ('admin','coordenador')
// DEPOIS: qualquer autenticado pode atualizar campos da tarefa
// Manter: updateTaskStatus() para finalizada/arquivada ainda requer coordenador+admin (linha 49-50)
```

### 3. Refatorar canManage → três flags em KanbanBoard.tsx

Arquivo: `components/features/KanbanBoard.tsx:184` e interface de props

```ts
// Substituir:
const canManage = currentUserRole === 'admin' || currentUserRole === 'coordenador'

// Por:
const canEdit     = true   // todos editam detalhes e alocam
const canAssign   = true
const canFinalize = currentUserRole === 'admin' || currentUserRole === 'coordenador'
```

Passar as três flags para `TaskDetailModal` e `TaskCard`.

### 4. TaskDetailModal.tsx — usar flag correta por bloco

| Bloco (linha aprox.) | Flag a usar |
|----------------------|-------------|
| 127 — assignee checkboxes | `canAssign` |
| 209 — botão Editar / EditTaskModal | `canEdit` |
| 264 — botão Arquivar | `canFinalize` |
| 283 — botão Deletar | `canFinalize` |
| Transições de status → finalizada/arquivada | `canFinalize` |
| Demais transições de status | `canEdit` |

### 5. TaskCard.tsx — canDrag

Linha 70: `canDrag = canManage || isAssignee`  
Substituir por: `canDrag = canEdit || isAssignee` (efetivo pode arrastar qualquer card)

> Atenção: arrastar para coluna "Finalizada" deve ser bloqueado para efetivo. Verificar lógica de drop no KanbanBoard — filtrar destino `finalizada`/`arquivada` quando `!canFinalize`.

## Critérios de aceite

- [ ] Efetivo: vê e clica no botão Editar de qualquer tarefa
- [ ] Efetivo: consegue salvar edição de título/data sem erro
- [ ] Efetivo: NÃO vê botões Arquivar e Deletar
- [ ] Efetivo: NÃO vê botão de transição para "Finalizada"  
- [ ] Efetivo: NÃO consegue arrastar card para coluna Finalizada
- [ ] Coordenador: vê e usa Arquivar, Deletar, Finalizar
- [ ] `pnpm typecheck` passou — sem `any` implícito nas novas props
- [ ] `pnpm lint` passou
