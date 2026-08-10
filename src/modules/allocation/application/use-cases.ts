import type { BuildingRepository } from '../domain/repository'
import type { Building, BuildingWithAssignees, NormalizedBuildingInput, AppRoleLike } from '../domain/entities'
import { validateBuildingName } from '../domain/building'

export type UseCaseCaller = {
  userId: string
  role: AppRoleLike
}

const MANAGER_ROLES: AppRoleLike[] = ['admin', 'coordenador']

function assertManager(caller: UseCaseCaller | null) {
  if (!caller) throw new Error('UNAUTHENTICATED')
  if (!MANAGER_ROLES.includes(caller.role)) throw new Error('FORBIDDEN')
}

function assertName(name: string) {
  const v = validateBuildingName(name)
  if (!v.ok) throw new Error('VALIDATION')
}

export class BuildingUseCases {
  constructor(private readonly buildingRepository: BuildingRepository) {}

  async listBuildings(): Promise<BuildingWithAssignees[]> {
    return this.buildingRepository.listBuildings()
  }

  async createBuilding(caller: UseCaseCaller | null, data: NormalizedBuildingInput): Promise<Building> {
    assertManager(caller)
    assertName(data.name)
    return this.buildingRepository.createBuilding({ ...data, created_by: caller!.userId })
  }

  async renameBuilding(caller: UseCaseCaller | null, id: string, name: string): Promise<Building> {
    assertManager(caller)
    assertName(name)
    return this.buildingRepository.renameBuilding(id, name.trim())
  }

  async deleteBuilding(caller: UseCaseCaller | null, id: string): Promise<void> {
    assertManager(caller)
    return this.buildingRepository.deleteBuilding(id)
  }

  async assignMember(caller: UseCaseCaller | null, buildingId: string, profileId: string): Promise<void> {
    assertManager(caller)
    return this.buildingRepository.assignMember(buildingId, profileId, caller!.userId)
  }

  async unassignMember(caller: UseCaseCaller | null, buildingId: string, profileId: string): Promise<void> {
    assertManager(caller)
    return this.buildingRepository.unassignMember(buildingId, profileId)
  }
}
