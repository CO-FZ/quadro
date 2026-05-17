import "@supabase/functions-js/edge-runtime.d.ts"
import { google } from "npm:googleapis@133.0.0"
import { logger } from "../_shared/logger.ts"

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE"
  table: string
  schema: string
  record: Record<string, unknown>
  old_record: Record<string, unknown>
}

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

export async function handleRequest(req: Request): Promise<Response> {
  let opType: WebhookPayload["type"] | "unknown" = "unknown"
  let taskId: string | null = null

  try {
    const payload: WebhookPayload = await req.json()
    opType = payload.type
    taskId = (payload.record?.id as string) ?? (payload.old_record?.id as string) ?? null
    logger.info("sync_sheets_received", { operation: opType, task_id: taskId })

    if (payload.table !== "tasks") {
      return new Response(JSON.stringify({ error: "Invalid table" }), { status: 400 })
    }

    const credentialsJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON")
    const spreadsheetId = Deno.env.get("GOOGLE_SHEET_ID")

    if (!credentialsJson || !spreadsheetId) {
      logger.error("sync_sheets_missing_config", { operation: opType, task_id: taskId })
      return new Response(JSON.stringify({ error: "Missing config" }), { status: 500 })
    }

    const credentials = JSON.parse(credentialsJson)

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    })

    const sheets = google.sheets({ version: "v4", auth })

    const { type, record } = payload
    const range = "Tasks!A:H"

    const rowData = [
      record.id,
      record.title,
      record.sector || "",
      record.status,
      record.description || "",
      record.created_at,
      record.end_date || "",
      record.created_by || "",
    ]

    if (type === "INSERT") {
      await withRetry(() =>
        sheets.spreadsheets.values.append({
          spreadsheetId,
          range,
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [rowData] },
        })
      )
      logger.info("sync_sheets_appended", { operation: type, task_id: taskId })
    } else if (type === "UPDATE") {
      const response = await withRetry(() =>
        sheets.spreadsheets.values.get({
          spreadsheetId,
          range: "Tasks!A:A",
        })
      )

      const rows = response.data.values || []
      const rowIndex = rows.findIndex((row: unknown[]) => row[0] === record.id)

      if (rowIndex !== -1) {
        const updateRange = `Tasks!A${rowIndex + 1}:H${rowIndex + 1}`
        await withRetry(() =>
          sheets.spreadsheets.values.update({
            spreadsheetId,
            range: updateRange,
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [rowData] },
          })
        )
        logger.info("sync_sheets_updated", { operation: type, task_id: taskId, row: rowIndex + 1 })
      } else {
        await withRetry(() =>
          sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [rowData] },
          })
        )
        logger.warn("sync_sheets_update_fallback_append", { operation: type, task_id: taskId })
      }
    } else if (type === "DELETE") {
      const response = await withRetry(() =>
        sheets.spreadsheets.values.get({
          spreadsheetId,
          range: "Tasks!A:A",
        })
      )
      const rows = response.data.values || []
      const oldId = payload.old_record.id
      const rowIndex = rows.findIndex((row) => row[0] === oldId)

      if (rowIndex !== -1) {
        await withRetry(() =>
          sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Tasks!D${rowIndex + 1}`,
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [["Deleted"]] },
          })
        )
        logger.info("sync_sheets_deleted", { operation: type, task_id: String(oldId ?? "") })
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)

    let credentialKeys: string[] | null = null
    try {
      const credentialsJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON")
      if (credentialsJson) {
        credentialKeys = Object.keys(JSON.parse(credentialsJson))
      }
    } catch {
      credentialKeys = null
    }

    logger.error("sync_sheets_failed", {
      operation: opType,
      task_id: taskId,
      message,
    })

    return new Response(
      JSON.stringify({
        error: message,
        ...(credentialKeys ? { credential_keys: credentialKeys } : {}),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}

Deno.serve(handleRequest)
