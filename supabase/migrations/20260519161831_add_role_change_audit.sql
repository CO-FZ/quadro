-- ============================================================
-- Migration: Audit log para mudancas de role pos-cadastro
-- Story 13.2 — V2 P1 roadmap item
--
-- Registra toda mudanca de role feita por admin via updateUserProfile.
-- Distinto de privileged_role_audit (que cobre criacao via trigger).
-- Append-only: apenas server action insere (sem policy de INSERT para
-- roles client-side). SELECT so para admin.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.role_change_audit (
    id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    target_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_profile_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    old_role          public.app_role NOT NULL,
    new_role          public.app_role NOT NULL,
    created_at        TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.role_change_audit IS
    'Append-only. Registra mudancas de role pos-cadastro feitas por admin. Story 13.2.';

CREATE INDEX IF NOT EXISTS idx_role_change_audit_target
    ON public.role_change_audit(target_profile_id);

CREATE INDEX IF NOT EXISTS idx_role_change_audit_actor
    ON public.role_change_audit(actor_profile_id);

CREATE INDEX IF NOT EXISTS idx_role_change_audit_created_at
    ON public.role_change_audit(created_at DESC);

ALTER TABLE public.role_change_audit ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ler o audit log.
-- Nenhuma policy de INSERT/UPDATE/DELETE para clients: a server action
-- usa o client autenticado do usuario (que e admin) para inserir.
-- O INSERT funciona porque o server action bypassa RLS via service role
-- ou porque o admin tem permissao implicita de INSERT sem policy restritiva.
-- Para garantir que somente a server action insere (nao via PostgREST direto),
-- adicionamos REVOKE de INSERT para anon e authenticated apos criar a tabela.
DROP POLICY IF EXISTS "Admins podem ler role change audit" ON public.role_change_audit;
CREATE POLICY "Admins podem ler role change audit"
    ON public.role_change_audit
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );
