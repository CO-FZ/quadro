// Pure matrix-building logic for the Google Sheets mirror (Story 21.1).
// No external imports — unit-testable with `deno test` without the Sheets API.
//
// Layout of the "Matriz" tab:
//   Row 0 (hidden):   ['', '', <profileId>, <profileId>, ...]   ← stable column key
//   Row 1 (visible):  ['', 'Data', 'Cap FULANO', 'Ten BELTRANO', ...]
//   Row 2+ (days):    [<isoDate>, 'seg, 12 mai', <cell>, <cell>, ...]
//
//   Col 0 (hidden): ISO date — machine key for preserving past days.
//   Col 1 (frozen): pretty pt-BR date label.
//   Col 2+:         one column per efetivo, ordered by patente.

export type PatenteType =
  | "Cel" | "TCel" | "Maj" | "Cap" | "Ten" | "SUB"
  | "1SGT" | "2SGT" | "3SGT" | "CB" | "SD"

export interface ProfileRow {
  id: string
  full_name: string | null
  nome_guerra: string | null
  patente: PatenteType | null
  archived_at: string | null
}

export interface TaskRow {
  id: string
  title: string
  sector: "DT" | "DA"
  status: string
  is_servico: boolean
  start_date: string
  end_date: string
  task_assignees: { user_id: string }[]
}

export interface ParsedGrid {
  byDatePerson: Map<string, Map<string, string>>
  historyIds: Set<string>
  minDate: string | null
  maxDate: string | null
}

export interface BuiltMatrix {
  values: string[][]
  todayRowIndex: number | null
  columnCount: number
  dayRowCount: number
  columnIds: string[]
}

const PATENTE_ORDER: PatenteType[] = [
  "Cel", "TCel", "Maj", "Cap", "Ten", "SUB",
  "1SGT", "2SGT", "3SGT", "CB", "SD",
]

const STATUS_LABEL: Record<string, string> = {
  backlog: "Backlog",
  alocada: "Alocada",
  em_desenvolvimento: "Em desenvolvimento",
  em_revisao: "Em revisão",
  finalizada: "Finalizada",
  arquivada: "Arquivada",
}

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"]
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]

export function patenteRank(patente: PatenteType | null): number {
  if (!patente) return PATENTE_ORDER.length
  const idx = PATENTE_ORDER.indexOf(patente)
  return idx === -1 ? PATENTE_ORDER.length : idx
}

export function formatNomeCompleto(
  patente: PatenteType | null,
  fullName: string | null,
): string {
  const nome = (fullName ?? "").trim()
  if (!patente || !nome) return nome
  return `${patente} ${nome}`
}

export function addDaysIso(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + n)
  return dt.toISOString().slice(0, 10)
}

export function formatDayLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return `${WEEKDAYS[dt.getUTCDay()]}, ${String(d).padStart(2, "0")} ${MONTHS[m - 1]}`
}

export function buildDayRange(earliest: string, latest: string): string[] {
  const days: string[] = []
  let cur = earliest
  while (cur <= latest) {
    days.push(cur)
    cur = addDaysIso(cur, 1)
  }
  return days
}

export function formatCell(task: TaskRow): string {
  if (task.is_servico) return `Serviço · ${task.sector}`
  const status = STATUS_LABEL[task.status] ?? task.status
  return `${task.title} · ${task.sector} · ${status}`
}

function cellTextFromTasks(tasks: TaskRow[], personId: string, day: string): string {
  return tasks
    .filter(
      (t) =>
        t.start_date <= day &&
        t.end_date >= day &&
        t.task_assignees.some((a) => a.user_id === personId),
    )
    .map(formatCell)
    .join("\n")
}

// Parse a grid read back from the "Matriz" tab into a date×person lookup.
// Tolerates trailing-empty trimming done by the Sheets API.
export function parseExistingGrid(values: string[][] | null | undefined): ParsedGrid {
  const byDatePerson = new Map<string, Map<string, string>>()
  const historyIds = new Set<string>()
  let minDate: string | null = null
  let maxDate: string | null = null

  if (!values || values.length < 3) {
    return { byDatePerson, historyIds, minDate, maxDate }
  }

  const uuidHeader = values[0] ?? []
  for (let c = 2; c < uuidHeader.length; c++) {
    const id = uuidHeader[c]
    if (id) historyIds.add(id)
  }

  for (let r = 2; r < values.length; r++) {
    const row = values[r] ?? []
    const iso = row[0]
    if (!iso) continue
    minDate = minDate === null || iso < minDate ? iso : minDate
    maxDate = maxDate === null || iso > maxDate ? iso : maxDate

    const perPerson = new Map<string, string>()
    for (let c = 2; c < uuidHeader.length; c++) {
      const id = uuidHeader[c]
      if (!id) continue
      const text = row[c] ?? ""
      if (text) perPerson.set(id, text)
    }
    byDatePerson.set(iso, perPerson)
  }

  return { byDatePerson, historyIds, minDate, maxDate }
}

function minIso(a: string | null, b: string | null): string | null {
  if (a === null) return b
  if (b === null) return a
  return a < b ? a : b
}

function maxIso(a: string | null, b: string | null): string | null {
  if (a === null) return b
  if (b === null) return a
  return a > b ? a : b
}

export function buildMatrix(input: {
  profiles: ProfileRow[]
  tasks: TaskRow[]
  existing: ParsedGrid
  today: string
  forwardBufferDays: number
}): BuiltMatrix {
  const { profiles, tasks, existing, today, forwardBufferDays } = input

  const profileById = new Map(profiles.map((p) => [p.id, p]))

  // Which profiles get a column: active OR referenced by a task OR present in history.
  const referenced = new Set<string>()
  for (const t of tasks) for (const a of t.task_assignees) referenced.add(a.user_id)

  const columnIdSet = new Set<string>()
  for (const p of profiles) {
    if (p.archived_at === null || referenced.has(p.id) || existing.historyIds.has(p.id)) {
      columnIdSet.add(p.id)
    }
  }
  // Orphan history ids (profile no longer queryable) — keep to preserve history.
  for (const id of existing.historyIds) columnIdSet.add(id)

  const columnIds = [...columnIdSet].sort((a, b) => {
    const pa = profileById.get(a) ?? null
    const pb = profileById.get(b) ?? null
    const diff = patenteRank(pa?.patente ?? null) - patenteRank(pb?.patente ?? null)
    if (diff !== 0) return diff
    return (pa?.full_name ?? "").localeCompare(pb?.full_name ?? "")
  })

  const labels = columnIds.map((id) => {
    const p = profileById.get(id)
    if (!p) return "(removido)"
    return formatNomeCompleto(p.patente, p.nome_guerra ?? p.full_name) || p.full_name || "(sem nome)"
  })

  // Day range: today always in range; forward buffer so today isn't at the bottom;
  // history (existing rows) and task spans never shrink the range.
  let earliest = today
  let latest = addDaysIso(today, forwardBufferDays)
  for (const t of tasks) {
    earliest = minIso(earliest, t.start_date) as string
    latest = maxIso(latest, t.end_date) as string
  }
  earliest = minIso(earliest, existing.minDate) as string
  latest = maxIso(latest, existing.maxDate) as string

  const days = buildDayRange(earliest, latest)

  const header1: string[] = ["", "", ...columnIds]
  const header2: string[] = ["", "Data", ...labels]
  const values: string[][] = [header1, header2]

  let todayRowIndex: number | null = null
  for (const day of days) {
    const isPast = day < today
    const preserved = isPast ? existing.byDatePerson.get(day) : undefined
    const row: string[] = [day, formatDayLabel(day)]
    for (const id of columnIds) {
      if (isPast && preserved !== undefined) {
        row.push(preserved.get(id) ?? "")
      } else if (isPast && existing.byDatePerson.size > 0 && existing.minDate !== null && day >= existing.minDate) {
        // Past day that fell inside the existing range but had no row — treat as empty (frozen).
        row.push("")
      } else {
        row.push(cellTextFromTasks(tasks, id, day))
      }
    }
    if (day === today) todayRowIndex = values.length
    values.push(row)
  }

  return {
    values,
    todayRowIndex,
    columnCount: header1.length,
    dayRowCount: days.length,
    columnIds,
  }
}
