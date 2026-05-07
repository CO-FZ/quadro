-- ============================================================
-- Migration: Whitelist com default_role + handle_new_user lookup
-- Implements ADR 0002 §"Revisão 2026-05-07"
-- ============================================================
-- Adiciona coluna `default_role` em `whitelist` (DEFAULT 'efetivo' para
-- backward compat). Reescreve `handle_new_user` para ler a role da
-- whitelist no primeiro signup, em vez de fixar 'efetivo'.
-- Precedência: match exato de email > match de domínio > fallback efetivo.
-- ============================================================

-- 1. Adicionar coluna default_role (idempotente)
ALTER TABLE public.whitelist
    ADD COLUMN IF NOT EXISTS default_role public.app_role NOT NULL DEFAULT 'efetivo';

COMMENT ON COLUMN public.whitelist.default_role IS
    'Role atribuída ao usuário no primeiro signup. Match exato de email tem precedência sobre match de domínio.';

-- 2. Reescrever handle_new_user com lookup na whitelist
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    resolved_role public.app_role;
    domain_part TEXT;
BEGIN
    domain_part := '@' || split_part(NEW.email, '@', 2);

    -- Match exato (precedência)
    SELECT default_role INTO resolved_role
    FROM public.whitelist
    WHERE identifier = NEW.email
    LIMIT 1;

    -- Match por domínio
    IF resolved_role IS NULL THEN
        SELECT default_role INTO resolved_role
        FROM public.whitelist
        WHERE identifier = domain_part
        LIMIT 1;
    END IF;

    -- Fallback (não deveria ocorrer — check_whitelist barra antes)
    IF resolved_role IS NULL THEN
        resolved_role := 'efetivo'::public.app_role;
    END IF;

    INSERT INTO public.profiles (id, email, avatar_url, role)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url',
        resolved_role
    );

    RETURN NEW;
END;
$$;

-- Hardening (alinhado com migration 20260506000002)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

CREATE TRIGGER on_auth_user_created_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
