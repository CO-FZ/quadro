-- Adiciona nome de guerra (nome de exibição) e divisão ao perfil
ALTER TABLE public.profiles
    ADD COLUMN nome_guerra TEXT NULL,
    ADD COLUMN divisao public.task_sector NULL;
