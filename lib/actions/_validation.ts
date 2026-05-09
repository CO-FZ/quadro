import type { TaskSector, TaskStatus } from '@/lib/supabase/types'

export interface RawTaskInput {
  title: string
  description: string
  start_date: string
  end_date: string
  sector: TaskSector
  drive_url: string
}

export interface NormalizedTaskInput {
  title: string
  description: string | null
  start_date: string
  end_date: string
  sector: TaskSector
  drive_url: string | null
}

/**
 * Normaliza o payload bruto de uma Server Action de tarefa:
 * - title é trimado.
 * - description e drive_url são trimados; vazios viram null.
 * - start_date, end_date, sector passam direto (validação de datas é responsabilidade
 *   do `validateTaskDates`).
 *
 * Extraída de lib/actions/tasks.ts (Sprint 02/03) para ficar testável em isolamento.
 */
export function normalizeTaskInput(data: RawTaskInput): NormalizedTaskInput {
  return {
    title: data.title.trim(),
    description: data.description.trim() || null,
    start_date: data.start_date,
    end_date: data.end_date,
    sector: data.sector,
    drive_url: data.drive_url.trim() || null,
  }
}

/**
 * Decide o status inicial de uma tarefa recém-criada com base nos assignees:
 * - Sem assignees → 'backlog'.
 * - Com assignees → 'alocada'.
 *
 * Regra do ADR 0003 §C ("não auto-alocar criador"): tarefa nasce em backlog
 * se o criador não escolher assignees, em alocada se escolher.
 */
export function initialStatusFor(assigneeIds: string[]): Extract<TaskStatus, 'backlog' | 'alocada'> {
  return assigneeIds.length > 0 ? 'alocada' : 'backlog'
}
