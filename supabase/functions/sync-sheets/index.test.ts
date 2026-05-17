// Tests for sync-sheets handler logic.
// Covers request validation paths that don't require Google Sheets API.
// Run with: deno test --allow-env supabase/functions/sync-sheets/index.test.ts
//
// The Google Sheets API call paths are tested manually / via staging.
// Full DI-based testing is tracked as a future improvement.

import { assertEquals } from "jsr:@std/assert@^1"
import { stub } from "jsr:@std/testing@^1/mock"
import { handleRequest } from "./index.ts"

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/sync-sheets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

Deno.test("returns 400 for non-tasks table", async () => {
  using _env = stub(Deno.env, "get", (key: string) => {
    if (key === "GOOGLE_SERVICE_ACCOUNT_JSON") return '{"type":"service_account","project_id":"x"}'
    if (key === "GOOGLE_SHEET_ID") return "sheet-123"
    return undefined
  })

  const req = makeRequest({
    type: "INSERT",
    table: "profiles",
    schema: "public",
    record: { id: "abc" },
    old_record: {},
  })

  const res = await handleRequest(req)
  assertEquals(res.status, 400)
  const body = await res.json()
  assertEquals(body.error, "Invalid table")
})

Deno.test("returns 500 when GOOGLE_SERVICE_ACCOUNT_JSON is missing", async () => {
  using _env = stub(Deno.env, "get", (key: string) => {
    if (key === "GOOGLE_SHEET_ID") return "sheet-123"
    return undefined
  })

  const req = makeRequest({
    type: "INSERT",
    table: "tasks",
    schema: "public",
    record: { id: "abc", title: "T", sector: "DT", status: "backlog" },
    old_record: {},
  })

  const res = await handleRequest(req)
  assertEquals(res.status, 500)
  const body = await res.json()
  assertEquals(body.error, "Missing config")
})

Deno.test("returns 500 when GOOGLE_SHEET_ID is missing", async () => {
  using _env = stub(Deno.env, "get", (key: string) => {
    if (key === "GOOGLE_SERVICE_ACCOUNT_JSON") return '{"type":"service_account","project_id":"x"}'
    return undefined
  })

  const req = makeRequest({
    type: "INSERT",
    table: "tasks",
    schema: "public",
    record: { id: "abc", title: "T", sector: "DT", status: "backlog" },
    old_record: {},
  })

  const res = await handleRequest(req)
  assertEquals(res.status, 500)
  const body = await res.json()
  assertEquals(body.error, "Missing config")
})

Deno.test("returns 500 on malformed JSON body", async () => {
  const req = new Request("http://localhost/sync-sheets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "not-json{{{",
  })

  const res = await handleRequest(req)
  assertEquals(res.status, 500)
  const body = await res.json()
  assertEquals(typeof body.error, "string")
})
