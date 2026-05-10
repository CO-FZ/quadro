import { describe, it, expect } from 'vitest'
import { isPrivilegedDomainEntry } from '@/lib/utils/admin-warnings'
import type { AppRole } from '@/lib/supabase/types'

/**
 * Story 07B.2 CA-06/07. Tabela de verdade do warning de domínio privilegiado.
 */
describe('isPrivilegedDomainEntry', () => {
  const roles: AppRole[] = ['admin', 'coordenador', 'efetivo']

  it('domínio + admin → true', () => {
    expect(isPrivilegedDomainEntry('@cofz.gov.br', 'admin')).toBe(true)
  })

  it('domínio + coordenador → true', () => {
    expect(isPrivilegedDomainEntry('@xyz.com', 'coordenador')).toBe(true)
  })

  it('domínio + efetivo → false (não é privilegiado)', () => {
    expect(isPrivilegedDomainEntry('@xyz.com', 'efetivo')).toBe(false)
  })

  it('e-mail individual + qualquer role → false (não é domínio)', () => {
    for (const r of roles) {
      expect(isPrivilegedDomainEntry('chefe@xyz.com', r)).toBe(false)
    }
  })

  it('string vazia → false', () => {
    expect(isPrivilegedDomainEntry('', 'admin')).toBe(false)
  })

  it('whitespace ao redor do "@" ainda é detectado', () => {
    expect(isPrivilegedDomainEntry('  @xyz.com  ', 'admin')).toBe(true)
  })

  it('identifier sem @ nunca dispara, mesmo com role privilegiada', () => {
    expect(isPrivilegedDomainEntry('xyz.com', 'admin')).toBe(false)
  })
})
