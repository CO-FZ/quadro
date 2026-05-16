-- ============================================================
-- Migration: Allow task creators to assign users on creation
-- Extends ADR 0003 — Decision B
-- ============================================================
-- Since any user can create a task, they must be allowed to 
-- populate the `task_assignees` table for that specific task.
-- ============================================================

CREATE POLICY "Criadores podem alocar usuários em suas tarefas"
    ON public.task_assignees
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tasks
            WHERE id = task_id AND created_by = auth.uid()
        )
    );
