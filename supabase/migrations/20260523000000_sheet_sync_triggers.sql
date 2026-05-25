-- Story 21.2 — Cobertura de gatilhos para a planilha-espelho da Matriz.
--
-- O pivô da Matriz depende de mudanças em task_assignees (alocação) e profiles
-- (colunas do efetivo), mas o trigger atual só dispara em tasks. Esta migration
-- generaliza handle_task_sync -> handle_sheet_sync e adiciona os gatilhos faltantes.
-- A Edge Function (Story 21.1) ignora o conteúdo de record/old_record e reconstrói
-- a planilha a partir do estado atual do banco — o payload serve só para acionar.

-- Função genérica: dispara o webhook para a Edge Function sync-sheets.
-- Config (URL + anon key) lida de public.app_config (ADR 0004 debt fix, migration 20260517000006).
CREATE OR REPLACE FUNCTION "public"."handle_sheet_sync"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload      jsonb;
  function_url text;
  anon_key     text;
BEGIN
  SELECT value INTO function_url FROM public.app_config WHERE key = 'supabase_function_url';
  SELECT value INTO anon_key     FROM public.app_config WHERE key = 'supabase_anon_key';

  IF function_url IS NULL OR anon_key IS NULL THEN
    RAISE WARNING 'handle_sheet_sync: supabase_function_url or supabase_anon_key not configured in app_config — skipping sync';
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
$$;

COMMENT ON FUNCTION "public"."handle_sheet_sync"() IS
  'Aciona a Edge Function sync-sheets (rebuild da planilha-espelho) em mutações de tasks, task_assignees e profiles. Config em public.app_config.';

-- Repontar o trigger de tasks para a nova função (mantém o nome do trigger).
DROP TRIGGER IF EXISTS "on_task_mutation" ON "public"."tasks";
CREATE TRIGGER "on_task_mutation"
AFTER INSERT OR UPDATE OR DELETE ON "public"."tasks"
FOR EACH ROW
EXECUTE FUNCTION "public"."handle_sheet_sync"();

-- Gatilho de alocação: a Matriz reflete task_assignees diretamente.
DROP TRIGGER IF EXISTS "on_task_assignee_mutation" ON "public"."task_assignees";
CREATE TRIGGER "on_task_assignee_mutation"
AFTER INSERT OR DELETE ON "public"."task_assignees"
FOR EACH ROW
EXECUTE FUNCTION "public"."handle_sheet_sync"();

-- Gatilho de efetivo (colunas do pivô): INSERT/DELETE sempre disparam.
DROP TRIGGER IF EXISTS "on_profile_mutation" ON "public"."profiles";
CREATE TRIGGER "on_profile_mutation"
AFTER INSERT OR DELETE ON "public"."profiles"
FOR EACH ROW
EXECUTE FUNCTION "public"."handle_sheet_sync"();

-- UPDATE de profiles dispara apenas em colunas relevantes ao pivô — evita rebuild
-- a cada toque de perfil (ex.: avatar_url, updated_at).
DROP TRIGGER IF EXISTS "on_profile_update_mutation" ON "public"."profiles";
CREATE TRIGGER "on_profile_update_mutation"
AFTER UPDATE ON "public"."profiles"
FOR EACH ROW
WHEN (
  OLD.patente     IS DISTINCT FROM NEW.patente     OR
  OLD.nome_guerra IS DISTINCT FROM NEW.nome_guerra OR
  OLD.full_name   IS DISTINCT FROM NEW.full_name   OR
  OLD.archived_at IS DISTINCT FROM NEW.archived_at OR
  OLD.role        IS DISTINCT FROM NEW.role
)
EXECUTE FUNCTION "public"."handle_sheet_sync"();

-- Remover a função antiga, agora órfã (trigger já repontado).
DROP FUNCTION IF EXISTS "public"."handle_task_sync"();
