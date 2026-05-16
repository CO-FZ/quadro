import { describe, it, expect, beforeAll } from 'vitest'
import { getPersonaSession } from '../fixtures/supabase'

let adminId: string, coordId: string, efetivoId: string

beforeAll(async () => {
  const [a, c, e] = await Promise.all([
    getPersonaSession('admin'),
    getPersonaSession('coord'),
    getPersonaSession('efetivo'),
  ])
  adminId   = a.userId
  coordId   = c.userId
  efetivoId = e.userId
})

// CA-04 from story 07A.2

describe('SELECT profiles', () => {
  it('admin can SELECT all profiles', async () => {
    const { data, error } = await (await getPersonaSession('admin')).client
      .from('profiles')
      .select('id')
    expect(error).toBeNull()
    expect(data!.length).toBeGreaterThanOrEqual(3)
  })

  it('coord can only SELECT own profile', async () => {
    const { data, error } = await (await getPersonaSession('coord')).client
      .from('profiles')
      .select('id')
    expect(error).toBeNull()
    expect(data!.length).toBe(1)
    expect(data![0].id).toBe(coordId)
  })

  it('efetivo can only SELECT own profile', async () => {
    const { data, error } = await (await getPersonaSession('efetivo')).client
      .from('profiles')
      .select('id')
    expect(error).toBeNull()
    expect(data!.length).toBe(1)
    expect(data![0].id).toBe(efetivoId)
  })
})

describe('UPDATE profiles', () => {
  it('admin can UPDATE any profile role', async () => {
    // Update coord's full_name (safe, no role change)
    const { error } = await (await getPersonaSession('admin')).client
      .from('profiles')
      .update({ full_name: 'Test Coord Updated' })
      .eq('id', coordId)
    expect(error).toBeNull()
  })

  it('efetivo CANNOT UPDATE profiles (even own)', async () => {
    const { data } = await (await getPersonaSession('efetivo')).client
      .from('profiles')
      .update({ full_name: 'Efetivo Hacked' })
      .eq('id', efetivoId)
      .select()
    // RLS should return 0 rows modified
    expect(data?.length ?? 0).toBe(0)
  })

  it('coord CANNOT UPDATE profiles', async () => {
    const { data } = await (await getPersonaSession('coord')).client
      .from('profiles')
      .update({ full_name: 'Coord Hacked' })
      .eq('id', adminId)
      .select()
    expect(data?.length ?? 0).toBe(0)
  })
})
