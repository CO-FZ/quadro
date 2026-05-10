import "@supabase/functions-js/edge-runtime.d.ts"
import { google } from "npm:googleapis@133.0.0"
import { logger } from "../_shared/logger.ts"

// Interface for the incoming webhook payload
interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE"
  table: string
  schema: string
  record: Record<string, unknown>
  old_record: Record<string, unknown>
}

Deno.serve(async (req) => {
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

    // We assume the sheet name is 'Tasks'
    const range = "Tasks!A:H"

    // Convert record to row array
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
      // Append new row
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [rowData],
        },
      })
      logger.info("sync_sheets_appended", { operation: type, task_id: taskId })
    } else if (type === "UPDATE") {
      // For updates, we first need to find the row with the matching ID
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Tasks!A:A", // Fetch only IDs to find the row
      })

      const rows = response.data.values || []
      const rowIndex = rows.findIndex((row: unknown[]) => row[0] === record.id)

      if (rowIndex !== -1) {
        // Row is 1-indexed, so rowIndex + 1
        const updateRange = `Tasks!A${rowIndex + 1}:H${rowIndex + 1}`
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: updateRange,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [rowData],
          },
        })
        logger.info("sync_sheets_updated", { operation: type, task_id: taskId, row: rowIndex + 1 })
      } else {
        // Fallback: If for some reason it wasn't there, append it
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [rowData],
          },
        })
        logger.warn("sync_sheets_update_fallback_append", { operation: type, task_id: taskId })
      }
    } else if (type === "DELETE") {
      // For deletes, we could clear the row or mark it as deleted
      // We'll mark the status as "Deleted"
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Tasks!A:A",
      })
      const rows = response.data.values || []
      const oldId = payload.old_record.id
      const rowIndex = rows.findIndex((row) => row[0] === oldId)

      if (rowIndex !== -1) {
        const updateRange = `Tasks!D${rowIndex + 1}` // Status is column D
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: updateRange,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [["Deleted"]],
          },
        })
        logger.info("sync_sheets_deleted", { operation: type, task_id: String(oldId ?? "") })
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)

    // Diagnostic info: only credential keys (no values), for the user.
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
})
