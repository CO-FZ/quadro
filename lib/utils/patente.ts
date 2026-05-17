import type { PatenteType } from '@/src/modules/task-board/domain/entities'

const PATENTE_ORDER: PatenteType[] = [
  'Cel', 'TCel', 'Maj', 'Cap', 'Ten', 'SUB',
  '1SGT', '2SGT', '3SGT', 'CB', 'SD',
]

export function patenteRank(patente: PatenteType | null | undefined): number {
  if (!patente) return PATENTE_ORDER.length
  return PATENTE_ORDER.indexOf(patente)
}

export function sortByPatente<T extends { patente: PatenteType | null; full_name: string | null }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const diff = patenteRank(a.patente) - patenteRank(b.patente)
    if (diff !== 0) return diff
    return (a.full_name ?? '').localeCompare(b.full_name ?? '')
  })
}
