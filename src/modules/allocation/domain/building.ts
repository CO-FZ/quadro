import type { RawBuildingInput, NormalizedBuildingInput, BuildingNameValidation } from './entities'

export function normalizeBuildingInput(data: RawBuildingInput): NormalizedBuildingInput {
  return {
    name: data.name.trim(),
    lat: data.lat,
    lng: data.lng,
  }
}

export function validateBuildingName(name: string): BuildingNameValidation {
  if (!name.trim()) return { ok: false, code: 'NAME_REQUIRED', message: 'O nome da obra é obrigatório.' }
  return { ok: true }
}
