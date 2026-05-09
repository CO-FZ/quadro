import { describe, it, expect } from 'vitest'
import { assertRoleAllowed } from '@/lib/auth/require-role'
import type { AppRole } from '@/lib/supabase/types'

/**
 * Cobre Story 07A.1 CA-04 — função pura `assertRoleAllowed`.
 *
 * O caminho I/O (`requireRole` → `getCallerRole` com cache + Supabase) é
 * coberto pela Camada 2 (integration). Aqui só testamos a regra pura.
 */
describe('assertRoleAllowed', () => {
  const userId = 'user-id-fake'

  it('caller=null → UNAUTHENTICATED', () => {
    const r = assertRoleAllowed(null, ['admin'])
    expect(r).not.toBeNull()
    expect(r?.code).toBe('UNAUTHENTICATED')
    expect(r?.message).toContain('Não autenticado')
  })

  it('role permitida → null (autorizado)', () => {
    const r = assertRoleAllowed({ userId, role: 'admin' }, ['admin', 'coordenador'])
    expect(r).toBeNull()
  })

  it('role permitida (segunda da lista) → null', () => {
    const r = assertRoleAllowed({ userId, role: 'coordenador' }, ['admin', 'coordenador'])
    expect(r).toBeNull()
  })

  it('role não permitida → FORBIDDEN', () => {
    const r = assertRoleAllowed({ userId, role: 'efetivo' }, ['admin', 'coordenador'])
    expect(r).not.toBeNull()
    expect(r?.code).toBe('FORBIDDEN')
    expect(r?.message).toContain('permissão')
  })

  it('coordenador tentando ação só-admin → FORBIDDEN', () => {
    const r = assertRoleAllowed({ userId, role: 'coordenador' }, ['admin'])
    expect(r?.code).toBe('FORBIDDEN')
  })

  it('lista vazia de allowed → sempre FORBIDDEN', () => {
    const allRoles: AppRole[] = ['admin', 'coordenador', 'efetivo']
    for (const role of allRoles) {
      const r = assertRoleAllowed({ userId, role }, [])
      expect(r?.code).toBe('FORBIDDEN')
    }
  })
})
