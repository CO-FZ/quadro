-- Marca tarefas de serviço (escala de serviço/plantão)
-- Tarefas de serviço não contabilizam para métricas do dashboard
ALTER TABLE public.tasks
    ADD COLUMN is_servico BOOLEAN NOT NULL DEFAULT FALSE;
