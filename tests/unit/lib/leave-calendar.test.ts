import { describe, it, expect } from 'vitest'
import { leaveBarGeometry, getLeavesForCell } from '@/lib/utils/leave-calendar'
import type { Leave } from '@/lib/supabase/types'

describe('leaveBarGeometry', () => {
  it('período no meio do ano → left/width plausíveis', () => {
    const g = leaveBarGeometry('2026-07-01', '2026-07-20', 2026)
    expect(g).not.toBeNull()
    expect(g!.leftPct).toBeGreaterThan(40)
    expect(g!.leftPct).toBeLessThan(55)
    expect(g!.widthPct).toBeGreaterThan(0)
    expect(g!.widthPct).toBeLessThan(10)
  })

  it('ano inteiro → ~0% left e ~100% width', () => {
    const g = leaveBarGeometry('2026-01-01', '2026-12-31', 2026)
    expect(g!.leftPct).toBeCloseTo(0, 5)
    expect(g!.widthPct).toBeCloseTo(100, 5)
  })

  it('cruza a virada do ano → clampa à borda inicial', () => {
    const g = leaveBarGeometry('2025-12-20', '2026-01-10', 2026)
    expect(g!.leftPct).toBeCloseTo(0, 5)
    expect(g!.widthPct).toBeGreaterThan(0)
  })

  it('período totalmente fora do ano → null', () => {
    expect(leaveBarGeometry('2025-01-01', '2025-02-01', 2026)).toBeNull()
    expect(leaveBarGeometry('2027-01-01', '2027-02-01', 2026)).toBeNull()
  })
})

describe('getLeavesForCell', () => {
  const leaves: Pick<Leave, 'id' | 'profile_id' | 'type' | 'start_date' | 'end_date' | 'description'>[] = [
    { id: 'l1', profile_id: 'u1', type: 'ferias', start_date: '2026-07-01', end_date: '2026-07-20', description: null },
    { id: 'l2', profile_id: 'u2', type: 'dispensa', start_date: '2026-07-05', end_date: '2026-07-06', description: null },
  ]

  it('retorna afastamento dentro do intervalo', () => {
    expect(getLeavesForCell(leaves, 'u1', '2026-07-10').map((l) => l.id)).toEqual(['l1'])
  })

  it('borda inclusiva (start e end)', () => {
    expect(getLeavesForCell(leaves, 'u1', '2026-07-01')).toHaveLength(1)
    expect(getLeavesForCell(leaves, 'u1', '2026-07-20')).toHaveLength(1)
  })

  it('fora do intervalo → vazio', () => {
    expect(getLeavesForCell(leaves, 'u1', '2026-07-21')).toHaveLength(0)
  })

  it('filtra por membro', () => {
    expect(getLeavesForCell(leaves, 'u2', '2026-07-10')).toHaveLength(0)
  })
})
