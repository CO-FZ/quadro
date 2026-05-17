import { describe, it, expect } from 'vitest'
import { initialStatusFor, normalizeTaskInput } from '@/src/modules/task-board/domain/task'
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
    is_servico: false,
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

  it('força título "Serviço", description null e drive_url null se is_servico for true', () => {
    const r = normalizeTaskInput({
      ...base,
      title: 'Título Ignorado',
      description: 'Descrição Ignorada',
      drive_url: 'https://drive.google.com/ignorado',
      is_servico: true,
    })
    expect(r.title).toBe('Serviço')
    expect(r.description).toBeNull()
    expect(r.drive_url).toBeNull()
    expect(r.is_servico).toBe(true)
  })

  it('is_servico false preserva título, description e drive_url normalmente', () => {
    const r = normalizeTaskInput({
      ...base,
      title: 'Tarefa real',
      description: 'Detalhes',
      drive_url: 'https://drive.google.com/real',
      is_servico: false,
    })
    expect(r.title).toBe('Tarefa real')
    expect(r.description).toBe('Detalhes')
    expect(r.drive_url).toBe('https://drive.google.com/real')
    expect(r.is_servico).toBe(false)
  })

  it('is_servico true ignora whitespace no title de entrada', () => {
    const r = normalizeTaskInput({
      ...base,
      title: '   nome qualquer com espaço   ',
      is_servico: true,
    })
    expect(r.title).toBe('Serviço')
  })

  it('is_servico true ignora drive_url só com whitespace', () => {
    const r = normalizeTaskInput({
      ...base,
      drive_url: '   ',
      is_servico: true,
    })
    expect(r.drive_url).toBeNull()
  })

  it('is_servico true normaliza para o conjunto canônico mesmo com strings vazias', () => {
    const r = normalizeTaskInput({
      ...base,
      title: '',
      description: '',
      drive_url: '',
      is_servico: true,
    })
    expect(r.title).toBe('Serviço')
    expect(r.description).toBeNull()
    expect(r.drive_url).toBeNull()
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
