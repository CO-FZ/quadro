import { describe, it, expect } from 'vitest'
import { getPersonaSession } from '../fixtures/supabase'

// CA-05 from story 07A.2

describe('whitelist RLS', () => {
  it('admin can SELECT whitelist', async () => {
    const { data, error } = await (await getPersonaSession('admin')).client
      .from('whitelist')
      .select('id')
    expect(error).toBeNull()
    expect(data).not.toBeNull()
  })

  it('admin can INSERT to whitelist', async () => {
    const { data, error } = await (await getPersonaSession('admin')).client
      .from('whitelist')
      .insert({ identifier: 'rls-test-wl@cofz.local', default_role: 'efetivo' })
      .select()
      .single()
    expect(error).toBeNull()

    // cleanup
    if (data) {
      await (await getPersonaSession('admin')).client.from('whitelist').delete().eq('id', data.id)
    }
  })

  it('coord CANNOT SELECT whitelist', async () => {
    const { data } = await (await getPersonaSession('coord')).client
      .from('whitelist')
      .select('id')
    expect(data?.length ?? 0).toBe(0)
  })

  it('efetivo CANNOT INSERT to whitelist', async () => {
    const { error } = await (await getPersonaSession('efetivo')).client
      .from('whitelist')
      .insert({ identifier: 'rls-efetivo-wl@cofz.local', default_role: 'efetivo' })
    expect(error).not.toBeNull()
  })
})
