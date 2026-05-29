-- Sprint 23 — Gestão de Férias e Afastamentos do Efetivo (ADR 0014)
-- Registra períodos de indisponibilidade do colaborador (Férias, Instalação, Dispensa).

-- Enum de tipos de afastamento
CREATE TYPE public.leave_type AS ENUM ('ferias', 'instalacao', 'dispensa');

-- Tabela de afastamentos do efetivo
CREATE TABLE public.leaves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type public.leave_type NOT NULL DEFAULT 'ferias',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT leaves_end_after_start CHECK (end_date >= start_date)
);

-- Habilitar RLS em leaves
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;

-- Trigger para atualizar o updated_at
CREATE TRIGGER handle_updated_at_leaves
    BEFORE UPDATE ON public.leaves
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Índices de consulta (Gantt por membro; janela de datas na Matriz)
CREATE INDEX idx_leaves_profile_id ON public.leaves (profile_id);
CREATE INDEX idx_leaves_date_range ON public.leaves (start_date, end_date);

-- ====================================================================================
-- RLS POLICIES - LEAVES
-- ====================================================================================

-- 1. Qualquer usuário autenticado pode ver os afastamentos (reflexo na Matriz)
CREATE POLICY "Usuários podem ver afastamentos"
    ON public.leaves
    FOR SELECT
    TO authenticated
    USING (true);

-- 2. Apenas Admins e Coordenadores gerenciam afastamentos (INSERT/UPDATE/DELETE)
CREATE POLICY "Admins e Coordenadores gerenciam afastamentos"
    ON public.leaves
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'coordenador')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'coordenador')
        )
    );
