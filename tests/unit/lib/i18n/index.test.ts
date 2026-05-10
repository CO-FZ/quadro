import { describe, it, expect } from 'vitest'
import { t } from '@/lib/i18n'

/**
 * Story 07B.2 CA-08. Cobre o resolvedor `t()` — lookup, interpolação por
 * função, fallback de chave ausente.
 */
describe('t()', () => {
  it('resolve string literal por path', () => {
    expect(t('auth.errors.not_authorized')).toContain('não está autorizado')
    expect(t('auth.errors.auth_failed')).toContain('Não foi possível autenticar')
  })

  it('resolve função com argumentos posicionais', () => {
    const out = t('admin.whitelist.privileged_domain_warning', '@cofz.gov.br', 'Admin')
    expect(out).toContain('@cofz.gov.br')
    expect(out).toContain('Admin')
  })

  it('retorna a própria chave quando ausente (degrade visível)', () => {
    expect(t('auth.errors.does_not_exist')).toBe('auth.errors.does_not_exist')
    expect(t('totally.unknown.key')).toBe('totally.unknown.key')
  })

  it('aceita chave de namespace inexistente sem throw', () => {
    expect(t('nope.x')).toBe('nope.x')
  })
})
