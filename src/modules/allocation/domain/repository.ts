import type { Building, BuildingWithAssignees, NormalizedBuildingInput } from './entities'

export interface BuildingRepository {
  listBuildings(): Promise<BuildingWithAssignees[]>
  createBuilding(data: NormalizedBuildingInput & { created_by: string }): Promise<Building>
  renameBuilding(id: string, name: string): Promise<Building>
  deleteBuilding(id: string): Promise<void>
  assignMember(buildingId: string, profileId: string, assignedBy: string): Promise<void>
  unassignMember(buildingId: string, profileId: string): Promise<void>
}
