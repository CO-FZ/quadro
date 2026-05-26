import { describe, it, expect } from 'vitest'
import { patenteRank, sortByPatente } from '@/lib/utils/patente'
import type { PatenteType } from '@/src/modules/task-board/domain/entities'

describe('patenteRank', () => {
  it('should return correct rank for valid patents', () => {
    expect(patenteRank('Cel')).toBe(0)
    expect(patenteRank('TCel')).toBe(1)
    expect(patenteRank('SD')).toBe(10)
  })

  it('should return default max rank for null, undefined, or empty patent', () => {
    expect(patenteRank(null)).toBe(11)
    expect(patenteRank(undefined)).toBe(11)
  })
})

describe('sortByPatente', () => {
  it('should sort items by patent order correctly', () => {
    const items = [
      { patente: 'SD' as PatenteType, full_name: 'Soldado' },
      { patente: 'Cel' as PatenteType, full_name: 'Coronel' },
      { patente: 'Cap' as PatenteType, full_name: 'Capitao' },
    ]
    const sorted = sortByPatente(items)
    expect(sorted[0].patente).toBe('Cel')
    expect(sorted[1].patente).toBe('Cap')
    expect(sorted[2].patente).toBe('SD')
  })

  it('should fallback to sorting by full_name alphabetically when patents are equal', () => {
    const items = [
      { patente: 'Cap' as PatenteType, full_name: 'Zeca' },
      { patente: 'Cap' as PatenteType, full_name: 'Abel' },
      { patente: 'Cap' as PatenteType, full_name: 'Beto' },
    ]
    const sorted = sortByPatente(items)
    expect(sorted[0].full_name).toBe('Abel')
    expect(sorted[1].full_name).toBe('Beto')
    expect(sorted[2].full_name).toBe('Zeca')
  })

  it('should put items with null patents at the end', () => {
    const items = [
      { patente: null, full_name: 'A' },
      { patente: 'SD' as PatenteType, full_name: 'B' },
      { patente: 'Cel' as PatenteType, full_name: 'C' },
    ]
    const sorted = sortByPatente(items)
    expect(sorted[0].patente).toBe('Cel')
    expect(sorted[1].patente).toBe('SD')
    expect(sorted[2].patente).toBeNull()
  })

  it('should handle null/empty names correctly when breaking ties', () => {
    const items = [
      { patente: 'Cap' as PatenteType, full_name: 'A' },
      { patente: 'Cap' as PatenteType, full_name: null },
    ]
    const sorted = sortByPatente(items)
    expect(sorted[0].full_name).toBeNull()
    expect(sorted[1].full_name).toBe('A')
  })

  it('should not mutate the original array', () => {
    const items = [
      { patente: 'SD' as PatenteType, full_name: 'B' },
      { patente: 'Cel' as PatenteType, full_name: 'A' },
    ]
    const itemsCopy = [...items]
    sortByPatente(items)
    expect(items).toEqual(itemsCopy)
  })
})
