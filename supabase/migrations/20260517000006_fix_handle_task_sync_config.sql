-- ADR 0004 debt: remove hardcoded anon key and URL from handle_task_sync function body.
-- Config is now stored in public.app_config (locked by RLS) and read at trigger time.
--
-- To override in production (via Supabase SQL Editor):
--   UPDATE public.app_config SET value = '<prod-url>'  WHERE key = 'supabase_function_url';
--   UPDATE public.app_config SET value = '<prod-key>'  WHERE key = 'supabase_anon_key';

CREATE TABLE IF NOT EXISTS public.app_config (
  key   text PRIMARY KEY,
  value text NOT NULL
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- No SELECT policy — only SECURITY DEFINER functions can read this table.
-- Prevents direct reads even by authenticated users.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'app_config' AND policyname = 'no_direct_access'
  ) THEN
    CREATE POLICY no_direct_access ON public.app_config USING (false);
  END IF;
END $$;

INSERT INTO public.app_config (key, value) VALUES
  ('supabase_function_url', 'https://yanveevgpfjopcjnosqq.supabase.co/functions/v1/sync-sheets'),
  ('supabase_anon_key',     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbnZlZXZncGZqb3Bjam5vc3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwOTM0MTUsImV4cCI6MjA5MzY2OTQxNX0.XaVWmT3KA6eM1NfEr_XU4Of_230dPV8BeOnDOaknQmo')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION "public"."handle_task_sync"()
RETURNS TRIGGER AS $$
DECLARE
  payload      jsonb;
  function_url text;
  anon_key     text;
BEGIN
  SELECT value INTO function_url FROM public.app_config WHERE key = 'supabase_function_url';
  SELECT value INTO anon_key     FROM public.app_config WHERE key = 'supabase_anon_key';

  IF function_url IS NULL OR anon_key IS NULL THEN
    RAISE WARNING 'handle_task_sync: supabase_function_url or supabase_anon_key not configured in app_config — skipping sync';
    RETURN NULL;
  END IF;

  payload := jsonb_build_object(
    'type',       TG_OP,
    'table',      TG_TABLE_NAME,
    'schema',     TG_TABLE_SCHEMA,
    'record',     CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW)::jsonb END,
    'old_record', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE row_to_json(OLD)::jsonb END
  );

  PERFORM "net"."http_post"(
    url     := function_url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := payload
  );

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE  public.app_config IS 'Runtime configuration for SECURITY DEFINER functions. Not readable by application users.';
COMMENT ON FUNCTION "public"."handle_task_sync"() IS 'Sends task mutations to sync-sheets Edge Function via pg_net. Config read from public.app_config.';
