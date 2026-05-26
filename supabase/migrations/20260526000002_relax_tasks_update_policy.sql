-- Sprint 22 / Story 22.3
-- Permite todos os autenticados editar detalhes de tarefas.
-- Antes: UPDATE restrito a admin/coordenador + assignees.
-- Depois: qualquer autenticado pode atualizar. Ações destrutivas (arquivar/deletar)
-- e transição para finalizada seguem restritas na camada de use-cases.
DROP POLICY IF EXISTS "Atualização de tarefas baseada na role e alocação" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update" ON public.tasks;

CREATE POLICY "tasks_update"
    ON public.tasks
    FOR UPDATE
    TO authenticated
    USING (true);
