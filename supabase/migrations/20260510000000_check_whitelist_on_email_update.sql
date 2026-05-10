-- Story 07B.2 CA-05 — Cobre o gap apontado em ADR 0002 §"Riscos a fechar":
-- usuário já autenticado podia chamar `supabase.auth.updateUser({ email })`
-- e burlar a whitelist (trigger original só cobria INSERT em auth.users).
--
-- Investigação: Supabase Auth permite updateUser() pelo cliente, e o GoTrue
-- escreve em auth.users.email após confirmação por email. Sem este trigger,
-- um usuário whitelisted poderia trocar para um email fora da whitelist.
--
-- Decisão: aplicar o mesmo `check_whitelist()` em UPDATE OF email.
-- Custo: zero — função já existe e é idempotente.

DROP TRIGGER IF EXISTS on_auth_user_email_updated_whitelist_check ON auth.users;

CREATE TRIGGER on_auth_user_email_updated_whitelist_check
  BEFORE UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.check_whitelist();
