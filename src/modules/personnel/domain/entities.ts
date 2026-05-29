// Role do chamador relevante à gestão de afastamentos. Mantido local ao módulo
// para não acoplar `personnel` ao domínio `task-board` (ADR 0006).
export type AppRoleLike = 'admin' | 'coordenador' | 'efetivo'

export type LeaveType = 'ferias' | 'instalacao' | 'dispensa'

export const LEAVE_TYPE_OPTIONS: LeaveType[] = ['ferias', 'instalacao', 'dispensa']

export interface Leave {
  id: string
  profile_id: string
  type: LeaveType
  start_date: string // 'YYYY-MM-DD'
  end_date: string
  description: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface RawLeaveInput {
  profile_id: string
  type: LeaveType
  start_date: string
  end_date: string
  description: string
}

export interface NormalizedLeaveInput {
  profile_id: string
  type: LeaveType
  start_date: string
  end_date: string
  description: string | null
}

export type LeaveDatesValidation =
  | { ok: true }
  | { ok: false; code: 'START_REQUIRED' | 'END_REQUIRED' | 'END_BEFORE_START'; message: string }

export interface LeaveFilter {
  year?: number
  from?: string
  to?: string
}
