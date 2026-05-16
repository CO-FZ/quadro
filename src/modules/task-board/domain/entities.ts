export type AppRole = 'admin' | 'coordenador' | 'efetivo'
export type TaskSector = 'DT' | 'DA'
export type TaskStatus = 'backlog' | 'alocada' | 'em_desenvolvimento' | 'em_revisao' | 'finalizada' | 'arquivada'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: AppRole
  created_at: string
  updated_at: string
  archived_at: string | null
}

export interface Task {
  id: string
  title: string
  description: string | null
  start_date: string
  end_date: string
  sector: TaskSector
  status: TaskStatus
  drive_url: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  task_assignees?: TaskAssignee[]
}

export interface TaskAssignee {
  task_id: string
  user_id: string
  assigned_at: string
  profiles?: Profile
}

export interface TaskWithAssignees extends Task {
  task_assignees: (TaskAssignee & { profiles: Profile })[]
}

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

export type TaskDatesValidation =
  | { ok: true }
  | { ok: false; code: 'START_REQUIRED' | 'END_REQUIRED' | 'END_BEFORE_START'; message: string }

export const KANBAN_COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'alocada', label: 'Alocada' },
  { id: 'em_desenvolvimento', label: 'Em Desenvolvimento' },
  { id: 'em_revisao', label: 'Em Revisão' },
  { id: 'finalizada', label: 'Finalizada' },
]

export const SECTOR_LABELS: Record<TaskSector, string> = {
  DT: 'Divisão Técnica',
  DA: 'Divisão Administrativa',
}
