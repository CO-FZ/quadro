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

-- Apenas admins podem ler o audit log (SELECT policy).
-- Sem policy de INSERT/UPDATE/DELETE: tabela sem policy permissiva bloqueia
-- todos os writes via PostgREST, mas a server action (autenticada como admin)
-- pode inserir via Supabase client com o JWT do admin.
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
