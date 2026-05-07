export type AppRole = 'admin' | 'coordenador' | 'efetivo'
export type TaskSector = 'DT' | 'DA'
export type TaskStatus = 'backlog' | 'alocada' | 'em_desenvolvimento' | 'finalizada' | 'arquivada'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: AppRole
  created_at: string
  updated_at: string
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

export interface UserTaskStats {
  user_id: string
  email: string
  full_name: string | null
  role: AppRole
  total_tasks: number
  finished_tasks: number
  in_progress_tasks: number
}

/** Tarefa enriquecida com assignees já carregados */
export interface TaskWithAssignees extends Task {
  task_assignees: (TaskAssignee & { profiles: Profile })[]
}

export const KANBAN_COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'alocada', label: 'Alocada' },
  { id: 'em_desenvolvimento', label: 'Em Desenvolvimento' },
  { id: 'finalizada', label: 'Finalizada' },
]

export const SECTOR_LABELS: Record<TaskSector, string> = {
  DT: 'Divisão Técnica',
  DA: 'Divisão Administrativa',
}
