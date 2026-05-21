import { describe, it, expect } from 'vitest'
import { formatDateBr, formatDateTimeBr, formatNomeCompleto } from '@/lib/utils/format'

/**
 * Cobre Sprint 14 — funções de formato de data e nome.
 *
 * Risco principal de `formatDateBr`: usar `new Date('YYYY-MM-DD')` (sem T00:00:00)
 * interpreta a data como UTC midnight → em fuso negativo (ex: BRT -3) o dia volta
 * para o dia anterior. A implementação anexa 'T00:00:00' para forçar local.
 */
describe('formatDateBr', () => {
  it('formata YYYY-MM-DD em DD/MM/YYYY sem shift de timezone', () => {
    expect(formatDateBr('2026-01-15')).toBe('15/01/2026')
  })

  it('último dia de fevereiro', () => {
    expect(formatDateBr('2026-02-28')).toBe('28/02/2026')
  })

  it('último dia do ano', () => {
    expect(formatDateBr('2026-12-31')).toBe('31/12/2026')
  })

  it('primeiro dia do ano', () => {
    expect(formatDateBr('2026-01-01')).toBe('01/01/2026')
  })

  it('mês com zero à esquerda', () => {
    expect(formatDateBr('2026-03-05')).toBe('05/03/2026')
  })
})

describe('formatDateTimeBr', () => {
  it('ISO com horário retorna data no formato DD/MM/YYYY', () => {
    // Não testa hora exata — varia por TZ do runner. Só valida estrutura.
    const result = formatDateTimeBr('2026-05-21T10:30:00Z')
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
  })

  it('ISO sem fuso retorna formato DD/MM/YYYY', () => {
    const result = formatDateTimeBr('2026-12-31T23:59:59')
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
  })
})

describe('formatNomeCompleto', () => {
  it('patente + nome → "patente nome"', () => {
    expect(formatNomeCompleto('Ten', 'Silva')).toBe('Ten Silva')
  })

  it('nome composto preservado', () => {
    expect(formatNomeCompleto('Cap', 'Silva Junior')).toBe('Cap Silva Junior')
  })

  it('sem patente (null) → apenas nome', () => {
    expect(formatNomeCompleto(null, 'Silva')).toBe('Silva')
  })

  it('sem patente (undefined) → apenas nome', () => {
    expect(formatNomeCompleto(undefined, 'Silva')).toBe('Silva')
  })

  it('nome null → string vazia', () => {
    expect(formatNomeCompleto('Ten', null)).toBe('')
  })

  it('nome undefined → string vazia', () => {
    expect(formatNomeCompleto('Ten', undefined)).toBe('')
  })

  it('ambos null → string vazia', () => {
    expect(formatNomeCompleto(null, null)).toBe('')
  })

  it('nome só espaços → string vazia (trim)', () => {
    expect(formatNomeCompleto('Ten', '   ')).toBe('')
  })

  it('patente ignorada quando nome vazio após trim', () => {
    // Não deve retornar "Ten " com espaço sobrando
    expect(formatNomeCompleto('Ten', '')).toBe('')
  })
})
