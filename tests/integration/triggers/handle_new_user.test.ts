// CA-17 + CA-18: trigger handle_new_user via auth.signUp ponta-a-ponta
// pgTAP covers the trigger in isolation (Camada 4, supabase/tests/).
// Here we validate end-to-end via real signup.

import { it, expect, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { adminClient, SUPABASE_URL, SUPABASE_ANON_KEY } from '../fixtures/supabase'

const createdUserIds: string[] = []

afterAll(async () => {
  for (const id of createdUserIds) {
    await adminClient.auth.admin.deleteUser(id)
  }
})

// CA-17: email-specific entry takes precedence over domain entry
it('CA-17: email match beats domain match → profile gets email role', async () => {
  const domain  = '@ca17-domain.local'
  const specific = `boss${domain}`

  await adminClient.from('whitelist').upsert({ identifier: domain, default_role: 'efetivo' }, { onConflict: 'identifier' })
  await adminClient.from('whitelist').upsert({ identifier: specific, default_role: 'admin' }, { onConflict: 'identifier' })

  const { data, error } = await adminClient.auth.admin.createUser({
    email: specific,
    password: 'CA17Test123!',
    email_confirm: true,
  })
  expect(error).toBeNull()
  createdUserIds.push(data!.user!.id)

  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', data!.user!.id)
    .single()
  expect(profile!.role).toBe('admin')

  // Also test a plain domain user
  const { data: domainUser } = await adminClient.auth.admin.createUser({
    email: `other${domain}`,
    password: 'CA17Test123!',
    email_confirm: true,
  })
  createdUserIds.push(domainUser!.user!.id)
  const { data: domainProfile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', domainUser!.user!.id)
    .single()
  expect(domainProfile!.role).toBe('efetivo')

  // cleanup whitelist entries
  await adminClient.from('whitelist').delete().eq('identifier', domain)
  await adminClient.from('whitelist').delete().eq('identifier', specific)
})

// CA-18: signup with email NOT in whitelist → blocked
it('CA-18: signup with non-whitelisted email → auth error, no profile', async () => {
  // Ensure email NOT in whitelist
  await adminClient.from('whitelist').delete().eq('identifier', 'intruder@evil-ca18.test')

  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await anonClient.auth.signUp({
    email: 'intruder@evil-ca18.test',
    password: 'Intrude123!',
  })

  // The trigger raises an exception → GoTrue returns error
  expect(error).not.toBeNull()
  expect(error!.message).toMatch(/acesso negado|not authorized|denied|database error saving new user/i)
  expect(data.user).toBeNull()

  // No profile should exist
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id')
    .eq('email', 'intruder@evil-ca18.test')
  expect(profiles?.length ?? 0).toBe(0)
})
