-- ============================================================
-- Migration: Audit log para criação de profile com role privilegiada
-- Story 07B.3 — débito de ADR 0002 §"Riscos a fechar"
-- ============================================================
-- Cria tabela `public.privileged_role_audit` (append-only) e estende
-- `handle_new_user` para registrar evento sempre que um profile é
-- criado com role ≠ 'efetivo' via whitelist (match exato ou domínio).
--
-- Política operacional:
--   - SELECT só admin (RLS).
--   - INSERT/UPDATE/DELETE bloqueados para todos os clients (sem
--     policies). Apenas o trigger `SECURITY DEFINER` escreve.
--   - Best-effort: falha do INSERT da audit nunca pode bloquear o
--     signup — bloco EXCEPTION captura e emite RAISE WARNING.
--   - Sem backfill automático (eventos pré-existentes não auditados;
--     limitação documentada em docs/memory/sprints/07B/_summary.md).
-- ============================================================

-- 1. Tabela
CREATE TABLE IF NOT EXISTS public.privileged_role_audit (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role public.app_role NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('whitelist_email','whitelist_domain','manual')),
    whitelist_entry_id UUID REFERENCES public.whitelist(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.privileged_role_audit IS
    'Append-only. Registra criação automática de profile com role ≠ efetivo via whitelist. Story 07B.3.';

CREATE INDEX IF NOT EXISTS idx_privileged_role_audit_created_at
    ON public.privileged_role_audit(created_at DESC);

-- 2. RLS — só admin lê; nenhuma policy de escrita (apenas trigger SECURITY DEFINER)
ALTER TABLE public.privileged_role_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins podem ler audit log" ON public.privileged_role_audit;
CREATE POLICY "Admins podem ler audit log"
    ON public.privileged_role_audit
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    ));

-- 3. Reescrever handle_new_user com captura do whitelist_entry_id e INSERT na audit
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
    resolved_source TEXT;
    resolved_entry_id UUID;
    domain_part TEXT;
BEGIN
    domain_part := '@' || split_part(NEW.email, '@', 2);

    -- Match exato (precedência)
    SELECT id, default_role
      INTO resolved_entry_id, resolved_role
    FROM public.whitelist
    WHERE identifier = NEW.email
    LIMIT 1;

    IF resolved_role IS NOT NULL THEN
        resolved_source := 'whitelist_email';
    ELSE
        -- Match por domínio
        SELECT id, default_role
          INTO resolved_entry_id, resolved_role
        FROM public.whitelist
        WHERE identifier = domain_part
        LIMIT 1;

        IF resolved_role IS NOT NULL THEN
            resolved_source := 'whitelist_domain';
        END IF;
    END IF;

    -- Fallback (não deveria ocorrer — check_whitelist barra antes)
    IF resolved_role IS NULL THEN
        resolved_role := 'efetivo'::public.app_role;
        resolved_source := 'manual';
        resolved_entry_id := NULL;
    END IF;

    INSERT INTO public.profiles (id, email, avatar_url, role)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url',
        resolved_role
    );

    -- Audit log — best-effort. Só registra criações privilegiadas.
    IF resolved_role IN ('admin'::public.app_role, 'coordenador'::public.app_role) THEN
        BEGIN
            INSERT INTO public.privileged_role_audit
                (profile_id, email, role, source, whitelist_entry_id)
            VALUES
                (NEW.id, NEW.email, resolved_role, resolved_source, resolved_entry_id);
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'privileged_role_audit insert failed for %: %', NEW.email, SQLERRM;
        END;
    END IF;

    RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

CREATE TRIGGER on_auth_user_created_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
