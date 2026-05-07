-- ============================================================
-- Migration: Sync Google OAuth metadata → profiles
-- Adds full_name column and keeps avatar_url + full_name
-- fresh via auth trigger on every sign-in.
-- ============================================================

-- 1. Add full_name column (idempotent)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT;

-- 2. Backfill existing rows from auth.users metadata
UPDATE public.profiles p
SET
  full_name  = (u.raw_user_meta_data ->> 'full_name'),
  avatar_url = COALESCE(
                 u.raw_user_meta_data ->> 'avatar_url',
                 u.raw_user_meta_data ->> 'picture'
               )
FROM auth.users u
WHERE u.id = p.id
  AND (
    (u.raw_user_meta_data ->> 'full_name') IS NOT NULL
    OR (u.raw_user_meta_data ->> 'avatar_url') IS NOT NULL
    OR (u.raw_user_meta_data ->> 'picture') IS NOT NULL
  );

-- 3. Drop old trigger if it exists (safe re-run)
DROP TRIGGER IF EXISTS on_auth_user_login_sync ON auth.users;
DROP FUNCTION IF EXISTS public.sync_google_metadata();

-- 4. Function: sync metadata on every sign-in / update
CREATE OR REPLACE FUNCTION public.sync_google_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    full_name  = COALESCE(
                   NEW.raw_user_meta_data ->> 'full_name',
                   full_name
                 ),
    avatar_url = COALESCE(
                   NEW.raw_user_meta_data ->> 'avatar_url',
                   NEW.raw_user_meta_data ->> 'picture',
                   avatar_url
                 ),
    updated_at = NOW()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Revoke public execute (security hardening)
REVOKE EXECUTE ON FUNCTION public.sync_google_metadata() FROM anon, authenticated;

-- 5. Trigger fires on INSERT (first sign-in) and UPDATE (subsequent sign-ins)
CREATE TRIGGER on_auth_user_login_sync
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_google_metadata();
