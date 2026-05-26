-- Sprint 22 / Story 22.1
-- Permite todos os autenticados ver perfis ativos de outros membros.
-- Antes: "Profiles select" → apenas próprio perfil + admin vê tudo.
-- Depois: todos veem perfis ativos; admin vê inclusive arquivados.
DROP POLICY IF EXISTS "Profiles select" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Todos os autenticados veem perfis ativos + o próprio (mesmo se arquivado)
CREATE POLICY "profiles_select_active"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (archived_at IS NULL OR id = (SELECT auth.uid()));

-- Admin vê todos os perfis incluindo arquivados de outros
CREATE POLICY "profiles_select_admin"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (public.is_admin());
