import type { RawTaskInput, NormalizedTaskInput, TaskStatus, TaskDatesValidation, TaskWithAssignees } from './entities'

export function normalizeTaskInput(data: RawTaskInput): NormalizedTaskInput {
  return {
    title: data.is_servico ? 'Serviço' : data.title.trim(),
    description: data.is_servico ? null : (data.description.trim() || null),
    start_date: data.start_date,
    end_date: data.end_date,
    sector: data.sector,
    drive_url: data.is_servico ? null : (data.drive_url.trim() || null),
    is_servico: data.is_servico,
  }
}

export function initialStatusFor(assigneeIds: string[]): Extract<TaskStatus, 'backlog' | 'alocada'> {
  return assigneeIds.length > 0 ? 'alocada' : 'backlog'
}

export function isOverdue(task: Pick<TaskWithAssignees, 'status' | 'end_date'>): boolean {
  if (task.status === 'finalizada' || task.status === 'arquivada') return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(task.end_date + 'T00:00:00')
  return due < today
}

export function validateTaskDates(start: string, end: string): TaskDatesValidation {
  if (!start) {
    return { ok: false, code: 'START_REQUIRED', message: 'A data de início é obrigatória.' }
  }
  if (!end) {
    return { ok: false, code: 'END_REQUIRED', message: 'A data de entrega é obrigatória.' }
  }
  if (end < start) {
    return { ok: false, code: 'END_BEFORE_START', message: 'A data de entrega não pode ser anterior à data de início.' }
  }
  return { ok: true }
}
