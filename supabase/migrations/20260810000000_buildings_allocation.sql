-- Sprint 24 — Mapa de Alocação do Efetivo em Edificações (ADR 0015)
-- Registra obras (edificações) marcadas no mapa e os fiscais alocados em cada uma.

-- Tabela de obras/edificações
CREATE TABLE public.buildings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabela de junção: quais fiscais estão alocados em qual obra (many-to-many)
CREATE TABLE public.building_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT building_assignments_unique UNIQUE (building_id, profile_id)
);

-- Habilitar RLS
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.building_assignments ENABLE ROW LEVEL SECURITY;

-- Trigger para atualizar o updated_at de buildings
CREATE TRIGGER handle_updated_at_buildings
    BEFORE UPDATE ON public.buildings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Índices de consulta
CREATE INDEX idx_building_assignments_building_id ON public.building_assignments (building_id);
CREATE INDEX idx_building_assignments_profile_id ON public.building_assignments (profile_id);

-- ====================================================================================
-- RLS POLICIES - BUILDINGS
-- ====================================================================================

-- 1. Qualquer usuário autenticado pode ver as obras (mapa é visto por todos)
CREATE POLICY "Usuários podem ver obras"
    ON public.buildings
    FOR SELECT
    TO authenticated
    USING (true);

-- 2. Apenas Admins e Coordenadores gerenciam obras (INSERT/UPDATE/DELETE)
CREATE POLICY "Admins e Coordenadores gerenciam obras"
    ON public.buildings
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

-- ====================================================================================
-- RLS POLICIES - BUILDING_ASSIGNMENTS
-- ====================================================================================

-- 1. Qualquer usuário autenticado pode ver as alocações (mapa é visto por todos)
CREATE POLICY "Usuários podem ver alocações"
    ON public.building_assignments
    FOR SELECT
    TO authenticated
    USING (true);

-- 2. Apenas Admins e Coordenadores gerenciam alocações (INSERT/UPDATE/DELETE)
CREATE POLICY "Admins e Coordenadores gerenciam alocações"
    ON public.building_assignments
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
