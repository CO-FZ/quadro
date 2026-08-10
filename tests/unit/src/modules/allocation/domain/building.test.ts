import { describe, it, expect } from 'vitest'
import { normalizeBuildingInput, validateBuildingName } from '@/src/modules/allocation/domain/building'

describe('normalizeBuildingInput', () => {
  it('nome trimado', () => {
    expect(normalizeBuildingInput({ name: '  Bloco A  ', lat: -15.78, lng: -47.92 }).name).toBe('Bloco A')
  })

  it('preserva lat/lng', () => {
    const r = normalizeBuildingInput({ name: 'Bloco A', lat: -15.78, lng: -47.92 })
    expect(r).toMatchObject({ lat: -15.78, lng: -47.92 })
  })
})

describe('validateBuildingName', () => {
  it('nome vazio → NAME_REQUIRED', () => {
    const r = validateBuildingName('')
    expect(r).toEqual({ ok: false, code: 'NAME_REQUIRED', message: expect.any(String) })
  })

  it('nome só whitespace → NAME_REQUIRED', () => {
    const r = validateBuildingName('   ')
    expect(r).toEqual({ ok: false, code: 'NAME_REQUIRED', message: expect.any(String) })
  })

  it('nome válido → ok', () => {
    expect(validateBuildingName('Bloco A')).toEqual({ ok: true })
  })
})
