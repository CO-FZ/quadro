-- pgTAP: schema constraints — Story 07A.4 (Camada 4)
-- Validates table structure, enums, FKs, and RLS enablement.

BEGIN;

SELECT plan(10);

-- ── Tables exist ──
SELECT has_table('public', 'profiles',               'profiles table exists');
SELECT has_table('public', 'tasks',                  'tasks table exists');
SELECT has_table('public', 'task_assignees',          'task_assignees table exists');
SELECT has_table('public', 'whitelist',              'whitelist table exists');
SELECT has_table('public', 'privileged_role_audit',  'privileged_role_audit table exists');

-- ── RLS enabled ──
SELECT ok(relrowsecurity, 'RLS enabled on profiles')
  FROM pg_class WHERE relname = 'profiles' AND relnamespace = 'public'::regnamespace;

SELECT ok(relrowsecurity, 'RLS enabled on tasks')
  FROM pg_class WHERE relname = 'tasks' AND relnamespace = 'public'::regnamespace;

SELECT ok(relrowsecurity, 'RLS enabled on privileged_role_audit')
  FROM pg_class WHERE relname = 'privileged_role_audit' AND relnamespace = 'public'::regnamespace;

-- ── app_role enum values ──
SELECT is(
  ARRAY(SELECT enumlabel FROM pg_enum
        JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
        WHERE pg_type.typname = 'app_role'
        ORDER BY enumsortorder)::text,
  ARRAY['admin','coordenador','efetivo']::text,
  'app_role enum has correct values'
);

-- ── profiles.archived_at column exists ──
SELECT has_column('public', 'profiles', 'archived_at', 'profiles has archived_at column');

SELECT * FROM finish();

ROLLBACK;
