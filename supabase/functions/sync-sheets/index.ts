import "@supabase/functions-js/edge-runtime.d.ts"
import { google } from "npm:googleapis@133.0.0"

// Interface for the incoming webhook payload
interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE"
  table: string
  schema: string
  record: Record<string, unknown>
  old_record: Record<string, unknown>
}

Deno.serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json()
    console.log("Received payload:", payload.type, payload.record?.id)

    if (payload.table !== "tasks") {
      return new Response(JSON.stringify({ error: "Invalid table" }), { status: 400 })
    }

    const credentialsJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON")
    const spreadsheetId = Deno.env.get("GOOGLE_SHEET_ID")

    if (!credentialsJson || !spreadsheetId) {
      console.error("Missing Google Sheets credentials in environment variables")
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
      record.division || "",
      record.status,
      record.priority || "",
      record.created_at,
      record.due_date || "",
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
      console.log(`Successfully appended task ${record.id}`)
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
        console.log(`Successfully updated task ${record.id} at row ${rowIndex + 1}`)
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
        console.log(`Task ${record.id} not found for update, appended instead.`)
      }
    } else if (type === "DELETE") {
      // For deletes, we could clear the row or mark it as deleted
      // We'll mark the status as "Deleted"
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Tasks!A:A",
      })
      const rows = response.data.values || []
      const rowIndex = rows.findIndex((row) => row[0] === payload.old_record.id)
      
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
        console.log(`Successfully marked task ${payload.old_record.id} as Deleted`)
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (err) {
    console.error("Error syncing to Google Sheets:", err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    })
  }
})
