import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { logger, redact } from '@/lib/logger'

/**
 * Cobre Story 07B.1 CA-01 (formato JSON em prod / pretty em dev) e CA-05 (PII redaction).
 *
 * Sem mocks de Supabase nem I/O — só a função pura `redact` e o efeito observável
 * de `logger.*` (chamadas a `console.*`).
 */
describe('redact', () => {
  it('passa primitives sem mudança', () => {
    expect(redact('hello')).toBe('hello')
    expect(redact(42)).toBe(42)
    expect(redact(true)).toBe(true)
    expect(redact(null)).toBe(null)
    expect(redact(undefined)).toBe(undefined)
  })

  it('redige chaves sensíveis no topo', () => {
    expect(redact({ password: '123', user: 'a' })).toEqual({
      password: '[REDACTED]',
      user: 'a',
    })
  })

  it('redige todas as chaves listadas (case-insensitive)', () => {
    const out = redact({
      password: 'p',
      jwt: 'j',
      token: 't',
      Authorization: 'a',
      Cookie: 'c',
      secret: 's',
      service_role_key: 'r',
      keep: 'k',
    })
    expect(out).toEqual({
      password: '[REDACTED]',
      jwt: '[REDACTED]',
      token: '[REDACTED]',
      Authorization: '[REDACTED]',
      Cookie: '[REDACTED]',
      secret: '[REDACTED]',
      service_role_key: '[REDACTED]',
      keep: 'k',
    })
  })

  it('redige recursivamente em objetos aninhados', () => {
    const out = redact({
      level: 'info',
      meta: { token: 'xyz', userId: 'u1' },
    })
    expect(out).toEqual({
      level: 'info',
      meta: { token: '[REDACTED]', userId: 'u1' },
    })
  })

  it('redige dentro de arrays de objetos', () => {
    const out = redact({
      events: [{ jwt: 'a' }, { jwt: 'b', ok: true }],
    })
    expect(out).toEqual({
      events: [{ jwt: '[REDACTED]' }, { jwt: '[REDACTED]', ok: true }],
    })
  })
})

describe('logger', () => {
  let infoSpy: ReturnType<typeof vi.spyOn>
  let warnSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>
  let debugSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
  })

  afterEach(() => {
    infoSpy.mockRestore()
    warnSpy.mockRestore()
    errorSpy.mockRestore()
    debugSpy.mockRestore()
    vi.unstubAllEnvs()
  })

  describe('NODE_ENV=production (saída JSON)', () => {
    beforeEach(() => vi.stubEnv('NODE_ENV', 'production'))

    it('emite uma string JSON em uma linha com level/msg/ts', () => {
      logger.info('hello', { a: 1 })
      expect(infoSpy).toHaveBeenCalledTimes(1)
      const arg = infoSpy.mock.calls[0]?.[0]
      expect(typeof arg).toBe('string')
      expect((arg as string).includes('\n')).toBe(false)
      const parsed = JSON.parse(arg as string)
      expect(parsed).toMatchObject({ level: 'info', msg: 'hello', a: 1 })
      expect(typeof parsed.ts).toBe('string')
    })

    it('redige PII no payload JSON', () => {
      logger.info('user', { jwt: 'abc.def.ghi', token: 'xyz', password: '123' })
      const arg = infoSpy.mock.calls[0]?.[0] as string
      const parsed = JSON.parse(arg)
      expect(parsed.jwt).toBe('[REDACTED]')
      expect(parsed.token).toBe('[REDACTED]')
      expect(parsed.password).toBe('[REDACTED]')
    })

    it('roteia warn → console.warn e error → console.error', () => {
      logger.warn('w')
      logger.error('e')
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(errorSpy).toHaveBeenCalledTimes(1)
    })

    it('sem ctx: ainda emite JSON válido', () => {
      logger.info('bare')
      const parsed = JSON.parse(infoSpy.mock.calls[0]?.[0] as string)
      expect(parsed).toMatchObject({ level: 'info', msg: 'bare' })
    })
  })

  describe('NODE_ENV=development (saída pretty)', () => {
    beforeEach(() => vi.stubEnv('NODE_ENV', 'development'))

    it('emite "[INFO] msg" + objeto de contexto', () => {
      logger.info('hello', { a: 1 })
      expect(infoSpy).toHaveBeenCalledWith('[INFO] hello', { a: 1 })
    })

    it('omite o segundo argumento quando ctx é vazio', () => {
      logger.info('bare')
      expect(infoSpy).toHaveBeenCalledWith('[INFO] bare')
    })

    it('debug roteia para console.debug', () => {
      logger.debug('d', { x: 1 })
      expect(debugSpy).toHaveBeenCalledWith('[DEBUG] d', { x: 1 })
    })

    it('redige PII também em pretty', () => {
      logger.info('u', { token: 'xyz', ok: true })
      expect(infoSpy).toHaveBeenCalledWith('[INFO] u', {
        token: '[REDACTED]',
        ok: true,
      })
    })
  })
})
