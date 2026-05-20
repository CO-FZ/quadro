import type { PatenteType } from '@/src/modules/task-board/domain/entities'

export function formatDateBr(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR')
}

export function formatDateTimeBr(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString('pt-BR')
}

export function formatNomeCompleto(
  patente: PatenteType | null | undefined,
  fullName: string | null | undefined,
): string {
  const nome = fullName?.trim() || ''
  if (!patente || !nome) return nome
  return `${patente} ${nome}`
}
