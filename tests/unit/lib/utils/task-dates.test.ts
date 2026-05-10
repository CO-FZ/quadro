import { describe, it, expect } from 'vitest'
import { validateTaskDates } from '@/lib/utils/task-dates'

/**
 * Cobre Story 07A.1 CA-06 — `validateTaskDates` (extraída de TaskModal).
 */
describe('validateTaskDates', () => {
  it('start vazio → START_REQUIRED', () => {
    const r = validateTaskDates('', '2026-05-10')
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.code).toBe('START_REQUIRED')
      expect(r.message).toContain('início')
    }
  })

  it('end vazio → END_REQUIRED', () => {
    const r = validateTaskDates('2026-05-10', '')
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.code).toBe('END_REQUIRED')
      expect(r.message).toContain('entrega')
    }
  })

  it('ambas vazias → START_REQUIRED (start checada primeiro)', () => {
    const r = validateTaskDates('', '')
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.code).toBe('START_REQUIRED')
    }
  })

  it('end < start → END_BEFORE_START', () => {
    const r = validateTaskDates('2026-05-10', '2026-05-09')
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.code).toBe('END_BEFORE_START')
      expect(r.message).toMatch(/anterior/)
    }
  })

  it('start = end → ok (intervalo de 1 dia válido)', () => {
    expect(validateTaskDates('2026-05-10', '2026-05-10')).toEqual({ ok: true })
  })

  it('start < end → ok', () => {
    expect(validateTaskDates('2026-05-10', '2026-05-15')).toEqual({ ok: true })
  })
})
