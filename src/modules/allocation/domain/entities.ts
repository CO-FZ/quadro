// Role do chamador e patente militar relevantes à alocação. Mantidos locais ao módulo
// para não acoplar `allocation` ao domínio `task-board` (ADR 0006).
export type AppRoleLike = 'admin' | 'coordenador' | 'efetivo'

export type PatenteTypeLike = 'Cel' | 'TCel' | 'Maj' | 'Cap' | 'Ten' | 'SUB' | '1SGT' | '2SGT' | '3SGT' | 'CB' | 'SD'

export interface Building {
  id: string
  name: string
  lat: number
  lng: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface BuildingAssignee {
  id: string
  profile_id: string
  assigned_at: string
  full_name: string | null
  nome_guerra: string | null
  avatar_url: string | null
  patente: PatenteTypeLike | null
}

export interface BuildingWithAssignees extends Building {
  assignees: BuildingAssignee[]
}

export interface RawBuildingInput {
  name: string
  lat: number
  lng: number
}

export interface NormalizedBuildingInput {
  name: string
  lat: number
  lng: number
}

export type BuildingNameValidation =
  | { ok: true }
  | { ok: false; code: 'NAME_REQUIRED'; message: string }
