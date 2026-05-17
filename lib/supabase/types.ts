import type { AppRole, PatenteType } from '@/src/modules/task-board/domain/entities'

// Task-board domain types — canonical source is src/modules/task-board/domain/entities.ts
export type {
  AppRole,
  TaskSector,
  TaskStatus,
  PatenteType,
  Profile,
  Task,
  TaskAssignee,
  TaskWithAssignees,
  RawTaskInput,
  NormalizedTaskInput,
  TaskDatesValidation,
} from '@/src/modules/task-board/domain/entities'
export { KANBAN_COLUMNS, SECTOR_LABELS, PATENTE_OPTIONS } from '@/src/modules/task-board/domain/entities'

// Reporting context
export interface UserTaskStats {
  user_id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: AppRole
  patente: PatenteType | null
  total_tasks: number
  finished_tasks: number
  in_progress_tasks: number
  in_review_tasks: number
}

// Identity & Access context
export interface WhitelistEntry {
  id: string
  identifier: string
  default_role: AppRole
  created_at: string
  created_by: string | null
}

export type PrivilegedRoleAuditSource =
  | 'whitelist_email'
  | 'whitelist_domain'
  | 'manual'

export interface PrivilegedRoleAuditEntry {
  id: string
  profile_id: string
  email: string
  role: AppRole
  source: PrivilegedRoleAuditSource
  whitelist_entry_id: string | null
  created_at: string
}
