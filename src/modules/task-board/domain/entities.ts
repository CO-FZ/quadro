export type AppRole = 'admin' | 'coordenador' | 'efetivo'
export type TaskSector = 'DT' | 'DA'
export type TaskStatus = 'backlog' | 'alocada' | 'em_desenvolvimento' | 'em_revisao' | 'finalizada' | 'arquivada'
export type PatenteType = 'Cel' | 'TCel' | 'Maj' | 'Cap' | 'Ten' | 'SUB' | '1SGT' | '2SGT' | '3SGT' | 'CB' | 'SD'

export const PATENTE_OPTIONS: PatenteType[] = [
  'Cel', 'TCel', 'Maj', 'Cap', 'Ten', 'SUB', '1SGT', '2SGT', '3SGT', 'CB', 'SD',
]

export interface Profile {
  id: string
  email: string
  full_name: string | null
  nome_guerra: string | null
  avatar_url: string | null
  role: AppRole
  patente: PatenteType | null
  divisao: TaskSector | null
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

/**
 * Colunas visíveis no Kanban board.
 *
 * `arquivada` é propositalmente EXCLUÍDA desta lista — é um status de ciclo de vida
 * (soft-delete), não uma coluna de trabalho. Tarefas arquivadas não aparecem no board.
 *
 * Para o tipo completo de status (incluindo arquivada) use `TaskStatus`.
 * @see ADR 0010 — Evolução de Colunas Kanban e Status `arquivada`
 */
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
