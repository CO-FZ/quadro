-- pgTAP: handle_new_user trigger — Story 07A.4 (Camada 4)
-- Requires: pgTAP installed (`CREATE EXTENSION IF NOT EXISTS pgtap;`)
-- Run via: supabase test db

BEGIN;

SELECT plan(6);

-- Setup: fresh whitelist entries for this test run
INSERT INTO public.whitelist (identifier, default_role)
VALUES
  ('pgtap-exact@cofz.local', 'admin'),
  ('@cofz.local',             'efetivo')
ON CONFLICT (identifier) DO NOTHING;

-- ── Test 1: email match → profile gets email default_role ──
DO $$
DECLARE v_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
  VALUES (v_id, 'pgtap-exact@cofz.local', 'x', now(), '{}'::jsonb);
END;
$$;

SELECT is(
  (SELECT role::text FROM public.profiles WHERE email = 'pgtap-exact@cofz.local'),
  'admin',
  'email match gives admin role'
);

-- ── Test 2: domain match → profile gets domain default_role ──
DO $$
DECLARE v_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
  VALUES (v_id, 'pgtap-domain@cofz.local', 'x', now(), '{}'::jsonb);
END;
$$;

SELECT is(
  (SELECT role::text FROM public.profiles WHERE email = 'pgtap-domain@cofz.local'),
  'efetivo',
  'domain match gives efetivo role'
);

-- ── Test 3: email match has precedence over domain match ──
SELECT is(
  (SELECT role::text FROM public.profiles WHERE email = 'pgtap-exact@cofz.local'),
  'admin',
  'email beats domain precedence'
);

-- ── Test 4: profile id matches auth.users id ──
SELECT is(
  (SELECT p.id FROM public.profiles p
   JOIN auth.users u ON u.id = p.id
   WHERE p.email = 'pgtap-exact@cofz.local'),
  (SELECT id FROM auth.users WHERE email = 'pgtap-exact@cofz.local'),
  'profile id = auth.users id'
);

-- ── Test 5: profile email matches auth.users email ──
SELECT is(
  (SELECT email FROM public.profiles WHERE email = 'pgtap-domain@cofz.local'),
  'pgtap-domain@cofz.local',
  'profile email stored correctly'
);

-- ── Test 6: privileged_role_audit has entry for admin signup ──
SELECT ok(
  EXISTS (
    SELECT 1 FROM public.privileged_role_audit
    WHERE email = 'pgtap-exact@cofz.local' AND role = 'admin'
  ),
  'admin signup logged in privileged_role_audit'
);

SELECT * FROM finish();

ROLLBACK;
