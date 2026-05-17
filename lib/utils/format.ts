import type { PatenteType } from '@/src/modules/task-board/domain/entities'

export function formatNomeCompleto(
  patente: PatenteType | null | undefined,
  fullName: string | null | undefined,
): string {
  const nome = fullName?.trim() || ''
  if (!patente || !nome) return nome
  return `${patente} ${nome}`
}
