import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"
import { google } from "npm:googleapis@133.0.0"
import { logger } from "../_shared/logger.ts"
import {
  buildMatrix,
  parseExistingGrid,
  type ProfileRow,
  type TaskRow,
} from "./matrix.ts"

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE"
  table: string
  schema: string
  record: Record<string, unknown> | null
  old_record: Record<string, unknown> | null
}

const SYNC_TABLES = new Set(["tasks", "task_assignees", "profiles"])

async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 200,
): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt < maxAttempts) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1)
        logger.warn("sync_sheets_retry", { attempt, delay_ms: delay })
        await new Promise((r) => setTimeout(r, delay))
      }
    }
  }
  throw lastError
}

// deno-lint-ignore no-explicit-any
async function getOrCreateSheetId(sheets: any, spreadsheetId: string, tabName: string): Promise<number> {
  const meta = await withRetry(() => sheets.spreadsheets.get({ spreadsheetId }))
  // deno-lint-ignore no-explicit-any
  const found = (meta.data.sheets ?? []).find((s: any) => s.properties?.title === tabName)
  if (found) return found.properties.sheetId as number

  const added = await withRetry(() =>
    sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: tabName } } }] },
    })
  )
  return added.data.replies[0].addSheet.properties.sheetId as number
}

export async function handleRequest(req: Request): Promise<Response> {
  let opType: WebhookPayload["type"] | "unknown" = "unknown"
  let table: string | null = null
  let payload: WebhookPayload | null = null

  try {
    payload = await req.json()
    if (!payload) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 })
    }
    opType = payload.type
    table = payload.table
    logger.info("sync_sheets_received", { operation: opType, table })

    if (!SYNC_TABLES.has(payload.table)) {
      return new Response(JSON.stringify({ error: "Invalid table" }), { status: 400 })
    }

    const credentialsJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON")
    const spreadsheetId = Deno.env.get("GOOGLE_SHEET_ID")

    if (!credentialsJson || !spreadsheetId) {
      logger.error("sync_sheets_missing_config", { operation: opType, table })
      return new Response(JSON.stringify({ error: "Missing config" }), { status: 500 })
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!supabaseUrl || !supabaseServiceKey) {
      logger.error("sync_sheets_missing_supabase_config", { operation: opType, table })
      return new Response(JSON.stringify({ error: "Missing config" }), { status: 500 })
    }

    const tabName = Deno.env.get("SHEET_TAB_NAME") ?? "Matriz"
    const forwardBufferDays = Number(Deno.env.get("SHEET_FORWARD_BUFFER_DAYS") ?? "30")
    const today = new Date().toISOString().slice(0, 10)

    // 1. Read current state from the database (service role).
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const [{ data: profilesData, error: profilesErr }, { data: tasksData, error: tasksErr }] =
      await Promise.all([
        supabase.from("profiles").select("id, full_name, nome_guerra, patente, archived_at"),
        supabase
          .from("tasks")
          .select("id, title, sector, status, is_servico, start_date, end_date, task_assignees(user_id)")
          .neq("status", "arquivada"),
      ])

    if (profilesErr) throw new Error(`profiles query failed: ${profilesErr.message}`)
    if (tasksErr) throw new Error(`tasks query failed: ${tasksErr.message}`)

    const profiles = (profilesData ?? []) as ProfileRow[]
    const tasks = (tasksData ?? []) as TaskRow[]

    // 2. Google Sheets client.
    const credentials = JSON.parse(credentialsJson)
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    })
    const sheets = google.sheets({ version: "v4", auth })

    const sheetId = await getOrCreateSheetId(sheets, spreadsheetId, tabName)

    // 3. Read existing grid to preserve past days.
    const existingResp = await withRetry(() =>
      sheets.spreadsheets.values.get({ spreadsheetId, range: tabName })
    )
    const existing = parseExistingGrid(existingResp.data.values as string[][] | undefined)

    // 4. Build the pivoted matrix.
    const matrix = buildMatrix({ profiles, tasks, existing, today, forwardBufferDays })

    // 5. Clear + write the whole tab.
    await withRetry(() => sheets.spreadsheets.values.clear({ spreadsheetId, range: tabName }))
    await withRetry(() =>
      sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${tabName}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: matrix.values },
      })
    )

    // 6. Formatting: freeze header rows + date columns, hide key row/col, highlight today.
    // deno-lint-ignore no-explicit-any
    const requests: any[] = [
      {
        updateSheetProperties: {
          properties: { sheetId, gridProperties: { frozenRowCount: 2, frozenColumnCount: 2 } },
          fields: "gridProperties(frozenRowCount,frozenColumnCount)",
        },
      },
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: "ROWS", startIndex: 0, endIndex: 1 },
          properties: { hiddenByUser: true },
          fields: "hiddenByUser",
        },
      },
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: "COLUMNS", startIndex: 0, endIndex: 1 },
          properties: { hiddenByUser: true },
          fields: "hiddenByUser",
        },
      },
      {
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: 2,
            startColumnIndex: 2,
            endColumnIndex: matrix.columnCount,
          },
          cell: { userEnteredFormat: { wrapStrategy: "WRAP", verticalAlignment: "TOP" } },
          fields: "userEnteredFormat(wrapStrategy,verticalAlignment)",
        },
      },
    ]

    if (matrix.todayRowIndex !== null) {
      requests.push({
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: matrix.todayRowIndex,
            endRowIndex: matrix.todayRowIndex + 1,
            startColumnIndex: 1,
            endColumnIndex: matrix.columnCount,
          },
          cell: {
            userEnteredFormat: { backgroundColor: { red: 0.85, green: 0.92, blue: 1 } },
          },
          fields: "userEnteredFormat.backgroundColor",
        },
      })
    }

    await withRetry(() =>
      sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } })
    )

    logger.info("sync_sheets_rebuilt", {
      operation: opType,
      table,
      columns: matrix.columnCount - 2,
      days: matrix.dayRowCount,
    })

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error("sync_sheets_failed", { operation: opType, table, message })

    // Best-effort DLQ log of the failed synchronization attempt.
    if (payload) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey)
          const { error: dbError } = await supabase
            .from("sync_sheets_failures")
            .insert({
              task_id: null,
              operation: opType,
              payload: payload,
              error_message: message,
            })
          if (dbError) {
            logger.error("sync_sheets_dlq_insert_failed", { error: dbError.message, table })
          } else {
            logger.info("sync_sheets_dlq_inserted", { operation: opType, table })
          }
        } else {
          logger.warn("sync_sheets_dlq_missing_keys", { table })
        }
      } catch (dlqErr) {
        logger.error("sync_sheets_dlq_unexpected_error", {
          error: dlqErr instanceof Error ? dlqErr.message : String(dlqErr),
          table,
        })
      }
    }

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}

Deno.serve(handleRequest)
