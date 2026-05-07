-- Adiciona o status 'arquivada' ao enum task_status
-- NOTA: Este enum foi criado diretamente com 'arquivada' na migration task_management.
-- Este arquivo existe para rastreamento histórico da adição do status.
-- Se rodando em ambiente onde task_management já foi aplicado sem 'arquivada':
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'arquivada';

-- Security hardening: set search_path nas funções SECURITY DEFINER
ALTER FUNCTION public.check_whitelist() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.handle_updated_at() SET search_path = public;

-- Revogar EXECUTE das funções trigger para anon/authenticated
REVOKE EXECUTE ON FUNCTION public.check_whitelist() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- Recriar view com SECURITY INVOKER (padrão seguro)
DROP VIEW IF EXISTS public.user_task_stats;
CREATE VIEW public.user_task_stats
WITH (security_invoker = true)
AS
SELECT 
    p.id AS user_id,
    p.email,
    p.role,
    COUNT(t.id) AS total_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'finalizada') AS finished_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'em_desenvolvimento') AS in_progress_tasks
FROM public.profiles p
LEFT JOIN public.task_assignees ta ON ta.user_id = p.id
LEFT JOIN public.tasks t ON t.id = ta.task_id
GROUP BY p.id, p.email, p.role;
