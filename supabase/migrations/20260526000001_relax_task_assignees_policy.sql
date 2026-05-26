-- Sprint 22 / Story 22.2
-- Permite todos os autenticados alocar/desalocar qualquer membro.
-- Antes: INSERT restrito a self-assign+criador+privileged; UPDATE/DELETE só privileged.
-- Depois: qualquer autenticado pode gerenciar alocações.
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
