-- Recria view user_task_stats com avatar_url, full_name e in_review_tasks
-- Separada de 20260516140000 porque ADD VALUE não pode ser usado na mesma transação
DROP VIEW IF EXISTS public.user_task_stats;
CREATE VIEW public.user_task_stats
WITH (security_invoker = true)
AS
SELECT
    p.id          AS user_id,
    p.email,
    p.full_name,
    p.avatar_url,
    p.role,
    COUNT(t.id)                                                      AS total_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'finalizada')              AS finished_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'em_desenvolvimento')      AS in_progress_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'em_revisao')              AS in_review_tasks
FROM public.profiles p
LEFT JOIN public.task_assignees ta ON ta.user_id = p.id
LEFT JOIN public.tasks t ON t.id = ta.task_id
GROUP BY p.id, p.email, p.full_name, p.avatar_url, p.role;
