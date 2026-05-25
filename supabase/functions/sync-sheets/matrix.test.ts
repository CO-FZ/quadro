// Tests for the pure matrix-building logic (Story 21.1).
// Run with: deno test supabase/functions/sync-sheets/matrix.test.ts

import { assertEquals } from "jsr:@std/assert@^1"
import {
  addDaysIso,
  buildDayRange,
  buildMatrix,
  formatCell,
  formatDayLabel,
  formatNomeCompleto,
  parseExistingGrid,
  patenteRank,
  type ProfileRow,
  type TaskRow,
} from "./matrix.ts"

const cap: ProfileRow = { id: "p-cap", full_name: "Fulano", nome_guerra: "FULANO", patente: "Cap", archived_at: null }
const sd: ProfileRow = { id: "p-sd", full_name: "Ciclano", nome_guerra: "CICLANO", patente: "SD", archived_at: null }

function task(over: Partial<TaskRow>): TaskRow {
  return {
    id: "t1",
    title: "Projeto X",
    sector: "DT",
    status: "em_revisao",
    is_servico: false,
    start_date: "2026-05-23",
    end_date: "2026-05-23",
    task_assignees: [{ user_id: "p-cap" }],
    ...over,
  }
}

Deno.test("patenteRank orders by hierarchy, unknown last", () => {
  assertEquals(patenteRank("Cel") < patenteRank("SD"), true)
  assertEquals(patenteRank(null), 11)
})

Deno.test("formatNomeCompleto joins patente and name", () => {
  assertEquals(formatNomeCompleto("Cap", "FULANO"), "Cap FULANO")
  assertEquals(formatNomeCompleto(null, "FULANO"), "FULANO")
  assertEquals(formatNomeCompleto("Cap", null), "")
})

Deno.test("addDaysIso handles month boundaries", () => {
  assertEquals(addDaysIso("2026-05-31", 1), "2026-06-01")
  assertEquals(addDaysIso("2026-05-01", -1), "2026-04-30")
})

Deno.test("buildDayRange is inclusive", () => {
  assertEquals(buildDayRange("2026-05-23", "2026-05-25"), ["2026-05-23", "2026-05-24", "2026-05-25"])
})

Deno.test("formatDayLabel renders pt-BR abbreviations", () => {
  assertEquals(formatDayLabel("2026-05-23"), "sáb, 23 mai")
})

Deno.test("formatCell: normal task is title · sector · status", () => {
  assertEquals(formatCell(task({})), "Projeto X · DT · Em revisão")
})

Deno.test("formatCell: serviço task drops title", () => {
  assertEquals(formatCell(task({ is_servico: true, sector: "DA" })), "Serviço · DA")
})

Deno.test("buildMatrix pivots people into columns sorted by patente", () => {
  const m = buildMatrix({
    profiles: [sd, cap],
    tasks: [task({ task_assignees: [{ user_id: "p-cap" }] })],
    existing: parseExistingGrid([]),
    today: "2026-05-23",
    forwardBufferDays: 2,
  })
  // header row 1 (uuids): ['', '', 'p-cap', 'p-sd'] — Cap before SD
  assertEquals(m.values[0], ["", "", "p-cap", "p-sd"])
  assertEquals(m.values[1], ["", "Data", "Cap FULANO", "SD CICLANO"])
  assertEquals(m.columnCount, 4)
})

Deno.test("buildMatrix places task in the correct person/day cell", () => {
  const m = buildMatrix({
    profiles: [cap, sd],
    tasks: [task({ start_date: "2026-05-23", end_date: "2026-05-24", task_assignees: [{ user_id: "p-cap" }] })],
    existing: parseExistingGrid([]),
    today: "2026-05-23",
    forwardBufferDays: 0,
  })
  const todayRow = m.values[m.todayRowIndex!]
  assertEquals(todayRow[0], "2026-05-23")
  assertEquals(todayRow[2], "Projeto X · DT · Em revisão") // Cap column
  assertEquals(todayRow[3], "") // SD column empty
})

Deno.test("buildMatrix joins multiple tasks in one cell with newline", () => {
  const m = buildMatrix({
    profiles: [cap],
    tasks: [
      task({ id: "a", title: "A", task_assignees: [{ user_id: "p-cap" }] }),
      task({ id: "b", title: "B", task_assignees: [{ user_id: "p-cap" }] }),
    ],
    existing: parseExistingGrid([]),
    today: "2026-05-23",
    forwardBufferDays: 0,
  })
  const todayRow = m.values[m.todayRowIndex!]
  assertEquals(todayRow[2], "A · DT · Em revisão\nB · DT · Em revisão")
})

Deno.test("buildMatrix preserves past-day cells from existing grid", () => {
  // Existing sheet had a value for p-cap on a past day; current tasks no longer cover it.
  const existingValues = [
    ["", "", "p-cap"],
    ["", "Data", "Cap FULANO"],
    ["2026-05-20", "qua, 20 mai", "Histórico antigo · DT · Finalizada"],
  ]
  const m = buildMatrix({
    profiles: [cap],
    tasks: [], // no current tasks
    existing: parseExistingGrid(existingValues),
    today: "2026-05-23",
    forwardBufferDays: 0,
  })
  const pastRow = m.values.find((r) => r[0] === "2026-05-20")!
  assertEquals(pastRow[2], "Histórico antigo · DT · Finalizada")
})

Deno.test("buildMatrix remaps preserved history when column order changes", () => {
  // History has only p-sd; now p-cap joins (sorts before p-sd), shifting columns.
  const existingValues = [
    ["", "", "p-sd"],
    ["", "Data", "SD CICLANO"],
    ["2026-05-20", "qua, 20 mai", "Tarefa do SD · DA · Finalizada"],
  ]
  const m = buildMatrix({
    profiles: [cap, sd],
    tasks: [],
    existing: parseExistingGrid(existingValues),
    today: "2026-05-23",
    forwardBufferDays: 0,
  })
  // Columns now Cap (idx 2), SD (idx 3). Historical SD cell must land under SD, not Cap.
  const pastRow = m.values.find((r) => r[0] === "2026-05-20")!
  assertEquals(pastRow[2], "") // Cap had no history
  assertEquals(pastRow[3], "Tarefa do SD · DA · Finalizada")
})

Deno.test("buildMatrix keeps a column for archived person referenced in history", () => {
  const archived: ProfileRow = { id: "p-old", full_name: "Antigo", nome_guerra: "ANTIGO", patente: "Ten", archived_at: "2026-05-01" }
  const existingValues = [
    ["", "", "p-old"],
    ["", "Data", "Ten ANTIGO"],
    ["2026-05-20", "qua, 20 mai", "Algo · DT · Finalizada"],
  ]
  const m = buildMatrix({
    profiles: [archived],
    tasks: [],
    existing: parseExistingGrid(existingValues),
    today: "2026-05-23",
    forwardBufferDays: 0,
  })
  assertEquals(m.values[0].includes("p-old"), true)
})

Deno.test("parseExistingGrid returns empty for fresh/short grids", () => {
  const parsed = parseExistingGrid([])
  assertEquals(parsed.byDatePerson.size, 0)
  assertEquals(parsed.minDate, null)
})
