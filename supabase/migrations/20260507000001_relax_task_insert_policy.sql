-- ============================================================
-- Migration: Relax task INSERT policy + allow self-assign
-- Implements ADR 0003 — Decisão B (criação universal de tarefas)
-- ============================================================
-- Antes: apenas admin/coordenador criavam tarefas (RLS).
-- Depois: qualquer authenticated cria tarefa para si próprio.
-- Anti-spoofing: WITH CHECK força created_by = auth.uid().
-- UPDATE/DELETE de tasks permanecem inalterados (admin/coord/alocado).
-- ============================================================

-- ─── tasks: relaxar INSERT ──────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins e Coordenadores podem criar tarefas" ON public.tasks;

CREATE POLICY "Authenticated cria a própria tarefa"
    ON public.tasks
    FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

-- ─── task_assignees: permitir self-assign ───────────────────────────────────
-- Mantém a policy "Admins e Coordenadores gerenciam alocações" (FOR ALL),
-- e adiciona uma de INSERT específica para self-assign.
-- Postgres avalia OR entre policies da mesma operação — basta uma passar.

CREATE POLICY "Authenticated pode se auto-alocar"
    ON public.task_assignees
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());
