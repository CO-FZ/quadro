import { describe, it, expect } from 'vitest'
import { normalizeLeaveInput, validateLeaveDates } from '@/src/modules/personnel/domain/leave'
import type { LeaveType } from '@/lib/supabase/types'

describe('normalizeLeaveInput', () => {
  const base = {
    profile_id: 'p1',
    type: 'ferias' as LeaveType,
    start_date: '2026-07-01',
    end_date: '2026-07-20',
    description: 'desc',
  }

  it('description trimada e mantida quando tem conteúdo', () => {
    expect(normalizeLeaveInput({ ...base, description: '  algo  ' }).description).toBe('algo')
  })

  it('description só whitespace → null', () => {
    expect(normalizeLeaveInput({ ...base, description: '   ' }).description).toBeNull()
  })

  it('preserva profile_id, type e datas', () => {
    const r = normalizeLeaveInput(base)
    expect(r).toMatchObject({ profile_id: 'p1', type: 'ferias', start_date: '2026-07-01', end_date: '2026-07-20' })
  })
})

describe('validateLeaveDates', () => {
  it('início ausente → START_REQUIRED', () => {
    const r = validateLeaveDates('', '2026-07-20')
    expect(r).toEqual({ ok: false, code: 'START_REQUIRED', message: expect.any(String) })
  })

  it('fim ausente → END_REQUIRED', () => {
    const r = validateLeaveDates('2026-07-01', '')
    expect(r).toEqual({ ok: false, code: 'END_REQUIRED', message: expect.any(String) })
  })

  it('fim antes do início → END_BEFORE_START', () => {
    const r = validateLeaveDates('2026-07-20', '2026-07-01')
    expect(r).toEqual({ ok: false, code: 'END_BEFORE_START', message: expect.any(String) })
  })

  it('início == fim → ok (período de 1 dia)', () => {
    expect(validateLeaveDates('2026-07-01', '2026-07-01')).toEqual({ ok: true })
  })

  it('intervalo válido → ok', () => {
    expect(validateLeaveDates('2026-07-01', '2026-07-20')).toEqual({ ok: true })
  })
})
