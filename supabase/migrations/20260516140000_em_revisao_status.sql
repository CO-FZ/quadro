-- Adiciona status 'em_revisao' ao enum task_status
-- ALTER TYPE ADD VALUE é não-transacional: auto-commita mesmo dentro de BEGIN/COMMIT.
-- A view que usa o novo valor deve ficar em migration separada (20260516140001).
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'em_revisao' AFTER 'em_desenvolvimento';
