import type { TaskWithAssignees } from '@/lib/supabase/types'
import { SECTOR_LABELS } from '@/src/modules/task-board/domain/entities'
import { formatNomeCompleto } from '@/lib/utils/format'

const STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog',
  alocada: 'Alocada',
  em_desenvolvimento: 'Em Desenvolvimento',
  em_revisao: 'Em Revisão',
  finalizada: 'Finalizada',
  arquivada: 'Arquivada',
}

export function normalizeForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

function formatDateBR(iso: string | null | undefined): string {
  if (!iso) return ''
  // Date-only string (yyyy-mm-dd) ou ISO completo. Evita timezone shift.
  const datePart = iso.length >= 10 ? iso.slice(0, 10) : iso
  const [y, m, d] = datePart.split('-')
  if (!y || !m || !d) return ''
  return `${d}/${m}/${y}`
}

export function buildTaskHaystack(task: TaskWithAssignees): string {
  const parts: string[] = []

  parts.push(task.title)
  if (task.description) parts.push(task.description)

  parts.push(task.start_date, formatDateBR(task.start_date))
  parts.push(task.end_date, formatDateBR(task.end_date))
  if (task.updated_at) {
    parts.push(task.updated_at, formatDateBR(task.updated_at))
  }
  if (task.created_at) {
    parts.push(task.created_at, formatDateBR(task.created_at))
  }

  parts.push(task.sector, SECTOR_LABELS[task.sector] ?? '')

  parts.push(task.status, STATUS_LABELS[task.status] ?? '')

  if (task.is_servico) parts.push('serviço', 'servico')

  for (const a of task.task_assignees ?? []) {
    const p = a.profiles
    if (!p) continue
    if (p.full_name) parts.push(p.full_name)
    if (p.nome_guerra) parts.push(p.nome_guerra)
    if (p.email) parts.push(p.email)
    if (p.patente) parts.push(p.patente)
    parts.push(formatNomeCompleto(p.patente, p.nome_guerra ?? p.full_name))
  }

  return normalizeForSearch(parts.filter(Boolean).join(' • '))
}

export function matchesSearch(haystack: string, rawTerm: string): boolean {
  const term = normalizeForSearch(rawTerm)
  if (!term) return true
  return haystack.includes(term)
}
