'use server'

import { revalidatePath } from 'next/cache'
import { getCallerRole } from '@/lib/auth/require-role'
import type { Building, BuildingWithAssignees, RawBuildingInput } from '@/lib/supabase/types'
import { normalizeBuildingInput } from '@/src/modules/allocation/domain/building'
import { BuildingUseCases } from '@/src/modules/allocation/application/use-cases'
import { SupabaseBuildingRepository } from '@/src/modules/allocation/infrastructure/supabase-building-repository'

type ActionResult =
  | { ok: true }
  | { ok: false; code: string; message: string }

type BuildingResult =
  | { ok: true; data: Building }
  | { ok: false; code: string; message: string }

type ListResult =
  | { ok: true; data: BuildingWithAssignees[] }
  | { ok: false; code: string; message: string }

function revalidateBuildings() {
  revalidatePath('/mapa')
}

const buildingRepository = new SupabaseBuildingRepository()
const buildingUseCases = new BuildingUseCases(buildingRepository)

function mapError(e: unknown): { ok: false; code: string; message: string } {
  const msg = e instanceof Error ? e.message : String(e)
  if (msg === 'UNAUTHENTICATED') return { ok: false, code: 'UNAUTHENTICATED', message: 'Não autenticado.' }
  if (msg === 'FORBIDDEN') return { ok: false, code: 'FORBIDDEN', message: 'Você não tem permissão para esta ação.' }
  if (msg === 'VALIDATION') return { ok: false, code: 'VALIDATION', message: 'Nome da obra inválido.' }
  return { ok: false, code: 'UNEXPECTED', message: msg }
}

export async function getBuildings(): Promise<ListResult> {
  try {
    const data = await buildingUseCases.listBuildings()
    return { ok: true, data }
  } catch (e) {
    return mapError(e)
  }
}

export async function createBuilding(data: RawBuildingInput): Promise<BuildingResult> {
  try {
    const caller = await getCallerRole()
    const normalized = normalizeBuildingInput(data)
    const building = await buildingUseCases.createBuilding(caller, normalized)
    revalidateBuildings()
    return { ok: true, data: building }
  } catch (e) {
    return mapError(e)
  }
}

export async function renameBuilding(id: string, name: string): Promise<ActionResult> {
  try {
    const caller = await getCallerRole()
    await buildingUseCases.renameBuilding(caller, id, name)
    revalidateBuildings()
    return { ok: true }
  } catch (e) {
    return mapError(e)
  }
}

export async function deleteBuilding(id: string): Promise<ActionResult> {
  try {
    const caller = await getCallerRole()
    await buildingUseCases.deleteBuilding(caller, id)
    revalidateBuildings()
    return { ok: true }
  } catch (e) {
    return mapError(e)
  }
}

export async function assignMember(buildingId: string, profileId: string): Promise<ActionResult> {
  try {
    const caller = await getCallerRole()
    await buildingUseCases.assignMember(caller, buildingId, profileId)
    revalidateBuildings()
    return { ok: true }
  } catch (e) {
    return mapError(e)
  }
}

export async function unassignMember(buildingId: string, profileId: string): Promise<ActionResult> {
  try {
    const caller = await getCallerRole()
    await buildingUseCases.unassignMember(caller, buildingId, profileId)
    revalidateBuildings()
    return { ok: true }
  } catch (e) {
    return mapError(e)
  }
}
