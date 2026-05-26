// Admin Server Action integration tests — CA-18, CA-19
// Covers updateUserProfile (nome_guerra, patente, divisao, role guard)

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { type SupabaseClient } from '@supabase/supabase-js'
import { getPersonaSession, adminClient } from '../fixtures/supabase'

// --- Mocks ---

vi.mock('react', async (importActual) => {
  const actual = await importActual<typeof import('react')>()
  return { ...actual, cache: <T extends (...args: never[]) => unknown>(fn: T) => fn }
})

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

let _activeClient: SupabaseClient
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => _activeClient,
}))

// --- Setup ---

let adminId: string
let coordId: string

beforeAll(async () => {
  const [a, c] = await Promise.all([
    getPersonaSession('admin'),
    getPersonaSession('coord'),
  ])
  adminId = a.userId
  coordId = c.userId
})

beforeEach(() => {
  _activeClient = adminClient
})

// Restore coord profile to original state after each test
afterAll(async () => {
  await adminClient
    .from('profiles')
    .update({ nome_guerra: null, patente: null, divisao: null })
    .eq('id', coordId)
})

// CA-18: updateUserProfile persists nome_guerra, patente, divisao
describe('updateUserProfile', () => {
  it('CA-18: admin updates nome_guerra, patente, divisao → persisted in DB', async () => {
    _activeClient = (await getPersonaSession('admin')).client

    const { updateUserProfile } = await import('../../../lib/actions/admin')
    const result = await updateUserProfile(coordId, {
      nome_guerra: 'Silva Coord',
      patente: 'Cap',
      divisao: 'DT',
      role: 'coordenador',
    })

    expect(result.ok).toBe(true)

    const { data } = await adminClient
      .from('profiles')
      .select('nome_guerra, patente, divisao, role')
      .eq('id', coordId)
      .single()

    expect(data!.nome_guerra).toBe('Silva Coord')
    expect(data!.patente).toBe('Cap')
    expect(data!.divisao).toBe('DT')
    expect(data!.role).toBe('coordenador')
  })

  it('CA-18b: null values clear existing fields', async () => {
    _activeClient = (await getPersonaSession('admin')).client

    const { updateUserProfile } = await import('../../../lib/actions/admin')
    await updateUserProfile(coordId, {
      nome_guerra: null,
      patente: null,
      divisao: null,
      role: 'coordenador',
    })

    const { data } = await adminClient
      .from('profiles')
      .select('nome_guerra, patente, divisao')
      .eq('id', coordId)
      .single()

    expect(data!.nome_guerra).toBeNull()
    expect(data!.patente).toBeNull()
    expect(data!.divisao).toBeNull()
  })

  it('CA-18c: efetivo calling updateUserProfile → FORBIDDEN', async () => {
    _activeClient = (await getPersonaSession('efetivo')).client

    const { updateUserProfile } = await import('../../../lib/actions/admin')
    const result = await updateUserProfile(coordId, {
      nome_guerra: 'Hacked',
      patente: null,
      divisao: null,
      role: 'coordenador',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('FORBIDDEN')
  })
})

// CA-19: updateUserProfile with role downgrade — last-admin guard
it('CA-19: updateUserProfile rebaixar único admin para efetivo → LAST_ADMIN', async () => {
  const { count } = await adminClient
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'admin')
  if ((count ?? 0) > 1) return // skip if multiple admins

  _activeClient = (await getPersonaSession('admin')).client

  const { updateUserProfile } = await import('../../../lib/actions/admin')
  const result = await updateUserProfile(adminId, {
    nome_guerra: null,
    patente: null,
    divisao: null,
    role: 'efetivo',
  })

  expect(result.ok).toBe(false)
  if (!result.ok) expect(result.code).toBe('LAST_ADMIN')

  // Verify role unchanged
  const { data } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', adminId)
    .single()
  expect(data!.role).toBe('admin')
})
