import { createClient } from '@/lib/supabase/server'
import type { BuildingRepository } from '../domain/repository'
import type { Building, BuildingWithAssignees, BuildingAssignee, NormalizedBuildingInput, PatenteTypeLike } from '../domain/entities'

const BUILDING_COLUMNS = 'id, name, lat, lng, created_by, created_at, updated_at'

const BUILDING_WITH_ASSIGNEES_COLUMNS = `
  ${BUILDING_COLUMNS},
  building_assignments (
    id,
    profile_id,
    assigned_at,
    profiles (
      full_name,
      nome_guerra,
      avatar_url,
      patente
    )
  )
`

interface RawAssignmentRow {
  id: string
  profile_id: string
  assigned_at: string
  profiles: {
    full_name: string | null
    nome_guerra: string | null
    avatar_url: string | null
    patente: PatenteTypeLike | null
  } | null
}

interface RawBuildingRow extends Building {
  building_assignments: RawAssignmentRow[]
}

function toBuildingWithAssignees(row: RawBuildingRow): BuildingWithAssignees {
  const { building_assignments, ...building } = row
  const assignees: BuildingAssignee[] = (building_assignments ?? []).map((a) => ({
    id: a.id,
    profile_id: a.profile_id,
    assigned_at: a.assigned_at,
    full_name: a.profiles?.full_name ?? null,
    nome_guerra: a.profiles?.nome_guerra ?? null,
    avatar_url: a.profiles?.avatar_url ?? null,
    patente: a.profiles?.patente ?? null,
  }))
  return { ...building, assignees }
}

export class SupabaseBuildingRepository implements BuildingRepository {
  async listBuildings(): Promise<BuildingWithAssignees[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('buildings')
      .select(BUILDING_WITH_ASSIGNEES_COLUMNS)
      .order('created_at', { ascending: true })
    if (error) throw new Error(error.message)
    return ((data ?? []) as unknown as RawBuildingRow[]).map(toBuildingWithAssignees)
  }

  async createBuilding(data: NormalizedBuildingInput & { created_by: string }): Promise<Building> {
    const supabase = await createClient()
    const { data: building, error } = await supabase
      .from('buildings')
      .insert(data)
      .select(BUILDING_COLUMNS)
      .single()
    if (error) throw new Error(error.message)
    return building as unknown as Building
  }

  async renameBuilding(id: string, name: string): Promise<Building> {
    const supabase = await createClient()
    const { data: building, error } = await supabase
      .from('buildings')
      .update({ name })
      .eq('id', id)
      .select(BUILDING_COLUMNS)
      .single()
    if (error) throw new Error(error.message)
    return building as unknown as Building
  }

  async deleteBuilding(id: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase.from('buildings').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }

  async assignMember(buildingId: string, profileId: string, assignedBy: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('building_assignments')
      .upsert(
        { building_id: buildingId, profile_id: profileId, assigned_by: assignedBy },
        { onConflict: 'building_id,profile_id', ignoreDuplicates: true },
      )
    if (error) throw new Error(error.message)
  }

  async unassignMember(buildingId: string, profileId: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('building_assignments')
      .delete()
      .eq('building_id', buildingId)
      .eq('profile_id', profileId)
    if (error) throw new Error(error.message)
  }
}
