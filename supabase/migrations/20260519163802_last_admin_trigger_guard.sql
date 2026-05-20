-- ============================================================
-- Migration: LAST_ADMIN trigger guard
-- Story 14.2 — Sprint 14
--
-- Garante que o sistema nunca fique sem nenhum admin via trigger
-- BEFORE UPDATE na tabela profiles. Complementa o guard de
-- aplicacao (que continua para UX imediata), eliminando o
-- TOCTOU entre duas requests concorrentes.
--
-- Estrategia:
--   1. pg_advisory_xact_lock() serializa concorrentes que
--      tentem rebaixar admin ao mesmo tempo.
--   2. Conta admins EXCLUINDO o proprio registro (NEW.id) para
--      saber quantos sobraram apos a mudanca.
--   3. Se < 1, levanta excecao e aborta o UPDATE.
-- ============================================================

CREATE OR REPLACE FUNCTION public.prevent_last_admin_demotion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Dispara so se o role esta sendo rebaixado de 'admin'.
    IF OLD.role = 'admin' AND NEW.role <> 'admin' THEN
        -- Lock advisory para serializar tentativas concorrentes.
        PERFORM pg_advisory_xact_lock(hashtext('last_admin_guard'));

        -- Conta admins restantes apos esta mudanca (exclui o proprio registro).
        IF (
            SELECT COUNT(*)
            FROM public.profiles
            WHERE role = 'admin'
              AND id <> NEW.id
              AND archived_at IS NULL
        ) < 1 THEN
            RAISE EXCEPTION 'LAST_ADMIN: nao e possivel rebaixar o unico admin nao-arquivado do sistema'
                USING ERRCODE = 'P0001';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_last_admin_demotion() FROM anon, authenticated;

DROP TRIGGER IF EXISTS trg_prevent_last_admin_demotion ON public.profiles;

CREATE TRIGGER trg_prevent_last_admin_demotion
    BEFORE UPDATE OF role ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_last_admin_demotion();

COMMENT ON FUNCTION public.prevent_last_admin_demotion() IS
    'BEFORE UPDATE trigger: impede que o ultimo admin nao-arquivado seja rebaixado. Story 14.2.';
