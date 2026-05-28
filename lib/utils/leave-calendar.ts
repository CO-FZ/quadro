import type { Leave } from '@/lib/supabase/types'

type LeaveCell = Pick<Leave, 'id' | 'profile_id' | 'type' | 'start_date' | 'end_date' | 'description'>

/** Dia do ano (1–366) de uma data 'YYYY-MM-DD', tratada como DATE puro. */
function dayOfYear(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00')
  const start = new Date(d.getFullYear(), 0, 1)
  const diff = d.getTime() - start.getTime()
  return Math.floor(diff / 86_400_000) + 1
}

function daysInYear(year: number): number {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365
}

export interface LeaveBarGeometry {
  leftPct: number
  widthPct: number
}

/**
 * Geometria horizontal de uma barra de afastamento dentro de um ano.
 * Retorna `null` se o período não intersecta o ano. Clampa às bordas.
 */
export function leaveBarGeometry(start: string, end: string, year: number): LeaveBarGeometry | null {
  const yearStart = `${year}-01-01`
  const yearEnd = `${year}-12-31`

  if (end < yearStart || start > yearEnd) return null

  const clampedStart = start < yearStart ? yearStart : start
  const clampedEnd = end > yearEnd ? yearEnd : end

  const total = daysInYear(year)
  const offset = dayOfYear(clampedStart) - 1
  const duration = dayOfYear(clampedEnd) - dayOfYear(clampedStart) + 1

  return {
    leftPct: (offset / total) * 100,
    widthPct: (duration / total) * 100,
  }
}

/** Afastamentos ativos de um membro num dia 'YYYY-MM-DD'. */
export function getLeavesForCell<T extends LeaveCell>(leaves: T[], userId: string, day: string): T[] {
  return leaves.filter((l) => l.profile_id === userId && l.start_date <= day && l.end_date >= day)
}
