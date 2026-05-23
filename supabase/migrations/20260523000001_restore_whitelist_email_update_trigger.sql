-- Restaura o trigger de whitelist em UPDATE OF email em auth.users.
--
-- A migration 20260510000000 criou on_auth_user_email_updated_whitelist_check
-- para impedir que um usuario autenticado burlasse a whitelist via
-- supabase.auth.updateUser({ email }) (o trigger original so cobria INSERT).
--
-- A migration de hardening 20260519125842 rodou
--   DROP FUNCTION public.check_whitelist() CASCADE
-- que derrubou silenciosamente ESTE trigger de UPDATE (dependente da funcao) e
-- recriou apenas o trigger de INSERT. Resultado: UPDATE de email para endereco
-- fora da whitelist deixou de ser bloqueado (regressao coberta pelo pgTAP
-- check_whitelist.sql, test 5).
--
-- Esta migration recria o trigger, espelhando a definicao da 20260510000000.

DROP TRIGGER IF EXISTS on_auth_user_email_updated_whitelist_check ON auth.users;

CREATE TRIGGER on_auth_user_email_updated_whitelist_check
  BEFORE UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.check_whitelist();
