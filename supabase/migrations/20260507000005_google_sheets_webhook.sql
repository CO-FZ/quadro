-- Enable pg_net extension for async HTTP calls
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";

-- Create a function to handle the webhook call to sync-sheets Edge Function
CREATE OR REPLACE FUNCTION "public"."handle_task_sync"()
RETURNS TRIGGER AS $$
DECLARE
  payload jsonb;
  function_url text;
  -- The anon key is used to authenticate with the Edge Function. 
  -- In a real production environment, this could be stored in a vault or config table.
  -- For this setup, we'll use a placeholder or the provided key if available.
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbnZlZXZncGZqb3Bjam5vc3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwOTM0MTUsImV4cCI6MjA5MzY2OTQxNX0.XaVWmT3KA6eM1NfEr_XU4Of_230dPV8BeOnDOaknQmo';
BEGIN
  -- Construct the Edge Function URL based on the current project ref
  -- yanveevgpfjopcjnosqq is the active project ref
  function_url := 'https://yanveevgpfjopcjnosqq.supabase.co/functions/v1/sync-sheets';

  -- Build the payload mimicking Supabase Database Webhook format
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW)::jsonb END,
    'old_record', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE row_to_json(OLD)::jsonb END
  );

  -- Trigger the async HTTP POST request
  PERFORM "net"."http_post"(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := payload
  );

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on the tasks table
-- We only sync INSERT, UPDATE, and DELETE operations
DROP TRIGGER IF EXISTS "on_task_mutation" ON "public"."tasks";
CREATE TRIGGER "on_task_mutation"
AFTER INSERT OR UPDATE OR DELETE ON "public"."tasks"
FOR EACH ROW
EXECUTE FUNCTION "public"."handle_task_sync"();

COMMENT ON TRIGGER "on_task_mutation" ON "public"."tasks" IS 'Trigger to sync task changes to Google Sheets via Edge Function';
