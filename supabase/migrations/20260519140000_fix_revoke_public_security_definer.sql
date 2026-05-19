-- ============================================================
-- Migration: Fix REVOKE FROM PUBLIC on SECURITY DEFINER functions
-- Resolves: Technical Debt Audit 2026-05-19
--
-- Problem: Previous migration (20260519125842) revoked EXECUTE from
-- `anon` and `authenticated` directly, but those roles inherit from
-- `PUBLIC`. Postgres grant inheritance means the functions remain
-- callable via /rest/v1/rpc/ until PUBLIC is explicitly revoked.
--
-- Affected functions (all are internal triggers/helpers — never
-- meant to be called directly via PostgREST RPC):
--   - check_whitelist()     → BEFORE INSERT trigger on auth.users
--   - handle_new_user()     → AFTER INSERT trigger on auth.users
--   - handle_task_sync()    → AFTER INSERT/UPDATE/DELETE trigger on tasks
--   - sync_google_metadata()→ AFTER UPDATE trigger on auth.users
--   - is_admin()            → called by RLS policies (needs authenticated)
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.check_whitelist()       FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()       FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_task_sync()      FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin()              FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_google_metadata()  FROM PUBLIC;

-- is_admin() is called directly by RLS policies on the `authenticated` role.
-- Re-grant execute only to authenticated so policies keep working.
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
