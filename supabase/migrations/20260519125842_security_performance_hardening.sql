-- ============================================================
-- Migration: Security hardening + Performance optimization
-- Resolves: Technical Debt Audit 2026-05-18
--
-- Phase 1: Fix SECURITY DEFINER functions (search_path + REVOKE)
--   - check_whitelist: missing SET search_path, no REVOKE
--   - handle_task_sync: missing SET search_path, no REVOKE
--   - is_admin: missing REVOKE from anon, should be STABLE
-- Phase 2: FK indexes (5 unindexed foreign keys)
-- Phase 3: Fix auth_rls_initplan — auth.uid() -> (SELECT auth.uid())
-- Phase 4: Consolidate multiple permissive policies
--   - profiles SELECT: 2 policies -> 1
--   - task_assignees: 4 policies (SELECT x2, INSERT x3) -> 4 clean ops
-- ============================================================


-- ============================================================
-- PHASE 1A: check_whitelist -- SET search_path + REVOKE EXECUTE
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created_whitelist_check ON auth.users;
DROP FUNCTION IF EXISTS public.check_whitelist() CASCADE;

CREATE OR REPLACE FUNCTION public.check_whitelist()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    is_whitelisted BOOLEAN;
    domain_part    TEXT;
BEGIN
    domain_part := '@' || split_part(NEW.email, '@', 2);

    SELECT EXISTS (
        SELECT 1 FROM public.whitelist
        WHERE identifier = NEW.email OR identifier = domain_part
    ) INTO is_whitelisted;

    IF NOT is_whitelisted THEN
        RAISE EXCEPTION 'Acesso negado: Seu e-mail nao consta na Whitelist.';
    END IF;

    RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_whitelist() FROM anon, authenticated;

CREATE TRIGGER on_auth_user_created_whitelist_check
    BEFORE INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.check_whitelist();


-- ============================================================
-- PHASE 1B: handle_task_sync -- SET search_path + REVOKE EXECUTE
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_task_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    payload      jsonb;
    function_url text;
    anon_key     text;
BEGIN
    SELECT value INTO function_url FROM public.app_config WHERE key = 'supabase_function_url';
    SELECT value INTO anon_key     FROM public.app_config WHERE key = 'supabase_anon_key';

    IF function_url IS NULL OR anon_key IS NULL THEN
        RAISE WARNING 'handle_task_sync: supabase_function_url or supabase_anon_key not configured in app_config -- skipping sync';
        RETURN NULL;
    END IF;

    payload := jsonb_build_object(
        'type',       TG_OP,
        'table',      TG_TABLE_NAME,
        'schema',     TG_TABLE_SCHEMA,
        'record',     CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW)::jsonb END,
        'old_record', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE row_to_json(OLD)::jsonb END
    );

    PERFORM net.http_post(
        url     := function_url,
        headers := jsonb_build_object(
            'Content-Type',  'application/json',
            'Authorization', 'Bearer ' || anon_key
        ),
        body := payload
    );

    RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_task_sync() FROM anon, authenticated;


-- ============================================================
-- PHASE 1C: is_admin -- STABLE + initplan fix + REVOKE from anon
-- authenticated keeps EXECUTE: RLS policies call this function directly.
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN (
        SELECT role = 'admin'
        FROM public.profiles
        WHERE id = (SELECT auth.uid())
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;


-- ============================================================
-- PHASE 2: FK indexes -- prevent full-table scans on joins/cascades
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_privileged_role_audit_profile_id
    ON public.privileged_role_audit(profile_id);

CREATE INDEX IF NOT EXISTS idx_privileged_role_audit_whitelist_entry_id
    ON public.privileged_role_audit(whitelist_entry_id);

CREATE INDEX IF NOT EXISTS idx_task_assignees_user_id
    ON public.task_assignees(user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_created_by
    ON public.tasks(created_by);

CREATE INDEX IF NOT EXISTS idx_whitelist_created_by
    ON public.whitelist(created_by);


-- ============================================================
-- PHASE 3: RLS initplan -- replace auth.uid() with (SELECT auth.uid())
-- Forces Postgres to evaluate auth.uid() once per query, not once per row.
-- ============================================================

-- profiles: "Users can view own profile"
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    USING ((SELECT auth.uid()) = id);

-- tasks: "Atualizacao de tarefas baseada na role e alocacao"
DROP POLICY IF EXISTS "Atualização de tarefas baseada na role e alocação" ON public.tasks;
CREATE POLICY "Atualização de tarefas baseada na role e alocação"
    ON public.tasks
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'coordenador')
        )
        OR
        EXISTS (
            SELECT 1 FROM public.task_assignees
            WHERE task_id = tasks.id AND user_id = (SELECT auth.uid())
        )
    );

-- tasks: "Admins e Coordenadores podem deletar tarefas"
DROP POLICY IF EXISTS "Admins e Coordenadores podem deletar tarefas" ON public.tasks;
CREATE POLICY "Admins e Coordenadores podem deletar tarefas"
    ON public.tasks
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'coordenador')
        )
    );

-- tasks: "Authenticated cria a propria tarefa"
DROP POLICY IF EXISTS "Authenticated cria a própria tarefa" ON public.tasks;
CREATE POLICY "Authenticated cria a própria tarefa"
    ON public.tasks
    FOR INSERT
    TO authenticated
    WITH CHECK (created_by = (SELECT auth.uid()));

-- privileged_role_audit: "Admins podem ler audit log"
DROP POLICY IF EXISTS "Admins podem ler audit log" ON public.privileged_role_audit;
CREATE POLICY "Admins podem ler audit log"
    ON public.privileged_role_audit
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );


-- ============================================================
-- PHASE 4: Consolidate multiple permissive policies
-- ============================================================

-- profiles SELECT: merge "Users can view own profile" + "Admins can view all profiles"
-- into one policy -- reduces 2 permissive SELECT evaluations to 1 per row.
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Profiles select"
    ON public.profiles
    FOR SELECT
    USING ((SELECT auth.uid()) = id OR public.is_admin());

-- task_assignees: consolidate into single-op policies (no overlap).
-- Before: "Usuarios podem ver alocacoes" (SELECT) + SELECT side of FOR ALL +
--         FOR ALL (INSERT, UPDATE, DELETE) + self-assign (INSERT) + creator-assign (INSERT)
-- After: 1 SELECT, 1 INSERT, 1 UPDATE, 1 DELETE
DROP POLICY IF EXISTS "Usuários podem ver alocações" ON public.task_assignees;
DROP POLICY IF EXISTS "Admins e Coordenadores gerenciam alocações" ON public.task_assignees;
DROP POLICY IF EXISTS "Authenticated pode se auto-alocar" ON public.task_assignees;
DROP POLICY IF EXISTS "Criadores podem alocar usuários em suas tarefas" ON public.task_assignees;

CREATE POLICY "task_assignees_select"
    ON public.task_assignees
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "task_assignees_insert"
    ON public.task_assignees
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.tasks
            WHERE id = task_id AND created_by = (SELECT auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'coordenador')
        )
    );

CREATE POLICY "task_assignees_update"
    ON public.task_assignees
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'coordenador')
        )
    );

CREATE POLICY "task_assignees_delete"
    ON public.task_assignees
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'coordenador')
        )
    );
