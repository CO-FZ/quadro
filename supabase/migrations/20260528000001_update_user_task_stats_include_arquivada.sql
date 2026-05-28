-- Inclui tarefas arquivadas na contagem de finished_tasks
DROP VIEW IF EXISTS public.user_task_stats;
CREATE VIEW public.user_task_stats
WITH (security_invoker = true)
AS
SELECT
    p.id          AS user_id,
    p.email,
    p.full_name,
    p.nome_guerra,
    p.avatar_url,
    p.role,
    p.patente,
    p.divisao,
    COUNT(t.id)   FILTER (WHERE NOT t.is_servico)                                                           AS total_tasks,
    COUNT(t.id)   FILTER (WHERE NOT t.is_servico AND t.status = 'alocada')                                  AS alocada_tasks,
    COUNT(t.id)   FILTER (WHERE NOT t.is_servico AND t.status IN ('finalizada', 'arquivada'))               AS finished_tasks,
    COUNT(t.id)   FILTER (WHERE NOT t.is_servico AND t.status = 'em_desenvolvimento')                       AS in_progress_tasks,
    COUNT(t.id)   FILTER (WHERE NOT t.is_servico AND t.status = 'em_revisao')                               AS in_review_tasks
FROM public.profiles p
LEFT JOIN public.task_assignees ta ON ta.user_id = p.id
LEFT JOIN public.tasks t ON t.id = ta.task_id
GROUP BY p.id, p.email, p.full_name, p.nome_guerra, p.avatar_url, p.role, p.patente, p.divisao;
