-- ============================================================
-- Migration: Google Sheets Sync Dead-Letter Queue
-- Story 15.3 — Sprint 15
--
-- Cria a tabela public.sync_sheets_failures para registrar
-- permanentemente falhas após todas as tentativas de retry.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.sync_sheets_failures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    operation text NOT NULL,
    payload jsonb NOT NULL,
    error_message text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.sync_sheets_failures ENABLE ROW LEVEL SECURITY;

-- Apenas administradores podem ler os registros de falha
CREATE POLICY "Admins podem ler falhas de sincronizacao"
    ON public.sync_sheets_failures
    FOR SELECT
    TO authenticated
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- Nenhuma permissão de escrita via PostgREST/Client público.
-- O insert é feito pelo client service_role da Edge Function.

-- Criar índices de busca e ordenação
CREATE INDEX IF NOT EXISTS idx_sync_sheets_failures_created_at 
    ON public.sync_sheets_failures (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sync_sheets_failures_task_id 
    ON public.sync_sheets_failures (task_id);

COMMENT ON TABLE public.sync_sheets_failures IS 
    'Dead-letter queue para registrar falhas definitivas na sincronizacao com o Google Sheets. Story 15.3.';
