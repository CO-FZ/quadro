import { describe, it, expect } from 'vitest'
import { initialStatusFor, normalizeTaskInput } from '@/lib/actions/_validation'
import type { TaskSector } from '@/lib/supabase/types'

/**
 * Cobre Story 07A.1 CA-05 — helpers extraídos de lib/actions/tasks.ts.
 */
describe('normalizeTaskInput', () => {
  const base = {
    title: 'Tarefa X',
    description: 'desc',
    start_date: '2026-05-10',
    end_date: '2026-05-15',
    sector: 'DT' as TaskSector,
    drive_url: 'https://drive.google.com/abc',
  }

  it('title é trimado', () => {
    const r = normalizeTaskInput({ ...base, title: '   Tarefa X   ' })
    expect(r.title).toBe('Tarefa X')
  })

  it('description trimada e mantida quando tem conteúdo', () => {
    const r = normalizeTaskInput({ ...base, description: '  algo  ' })
    expect(r.description).toBe('algo')
  })

  it('description só whitespace → null', () => {
    const r = normalizeTaskInput({ ...base, description: '   ' })
    expect(r.description).toBeNull()
  })

  it('description vazia → null', () => {
    const r = normalizeTaskInput({ ...base, description: '' })
    expect(r.description).toBeNull()
  })

  it('drive_url trimado e mantido quando tem conteúdo', () => {
    const r = normalizeTaskInput({ ...base, drive_url: '  https://drive.google.com/x  ' })
    expect(r.drive_url).toBe('https://drive.google.com/x')
  })

  it('drive_url só whitespace → null', () => {
    const r = normalizeTaskInput({ ...base, drive_url: '   ' })
    expect(r.drive_url).toBeNull()
  })

  it('drive_url vazio → null', () => {
    const r = normalizeTaskInput({ ...base, drive_url: '' })
    expect(r.drive_url).toBeNull()
  })

  it('start_date, end_date e sector passam direto', () => {
    const r = normalizeTaskInput(base)
    expect(r.start_date).toBe('2026-05-10')
    expect(r.end_date).toBe('2026-05-15')
    expect(r.sector).toBe('DT')
  })

  it('preserva DA como sector', () => {
    const r = normalizeTaskInput({ ...base, sector: 'DA' })
    expect(r.sector).toBe('DA')
  })
})

describe('initialStatusFor', () => {
  it('lista vazia → backlog (ADR 0003 §C: criador não é auto-alocado)', () => {
    expect(initialStatusFor([])).toBe('backlog')
  })

  it('1 assignee → alocada', () => {
    expect(initialStatusFor(['user-a'])).toBe('alocada')
  })

  it('múltiplos assignees → alocada', () => {
    expect(initialStatusFor(['user-a', 'user-b', 'user-c'])).toBe('alocada')
  })
})
