import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { isOverdue } from '@/lib/utils/task-status'
import type { TaskStatus } from '@/lib/supabase/types'

/**
 * Cobre Story 07A.1 CA-02 — `isOverdue` × matriz status × end_date.
 *
 * Regra (Sprint 03 ADR 0003):
 * isOverdue = status not in ('finalizada','arquivada') AND end_date < hoje
 */
describe('isOverdue', () => {
  // Congela "hoje" como 2026-05-09 para testes determinísticos
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-09T12:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  const yesterday = '2026-05-08'
  const today = '2026-05-09'
  const tomorrow = '2026-05-10'

  describe('status ativo (atrasa se end_date < hoje)', () => {
    const activeStatuses: TaskStatus[] = ['backlog', 'alocada', 'em_desenvolvimento', 'em_revisao']

    for (const status of activeStatuses) {
      it(`status=${status}, end_date=ontem → true`, () => {
        expect(isOverdue({ status, end_date: yesterday })).toBe(true)
      })

      it(`status=${status}, end_date=hoje → false (mesmo dia ainda não venceu)`, () => {
        expect(isOverdue({ status, end_date: today })).toBe(false)
      })

      it(`status=${status}, end_date=amanhã → false`, () => {
        expect(isOverdue({ status, end_date: tomorrow })).toBe(false)
      })
    }
  })

  describe('status concluída (nunca atrasa, mesmo com end_date no passado)', () => {
    it('status=finalizada, end_date=ontem → false', () => {
      expect(isOverdue({ status: 'finalizada', end_date: yesterday })).toBe(false)
    })

    it('status=arquivada, end_date=ontem → false', () => {
      expect(isOverdue({ status: 'arquivada', end_date: yesterday })).toBe(false)
    })
  })
})
