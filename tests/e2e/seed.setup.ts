// Runs as the 'seed' setup project (a dependency of 'setup' in
// playwright.config.ts), so it executes before auth.setup.ts logs in.
//
// loginAs() authenticates against real Supabase accounts, but the E2E job only
// runs `supabase db reset` (which seeds no users). This creates the persona
// users via the admin API — idempotent, mirroring tests/integration seedPersonas.
import { test as setup, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { E2E_PERSONAS } from './fixtures/auth'

setup('seed personas', async () => {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    'http://127.0.0.1:54321'
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  expect(
    serviceRoleKey,
    'SUPABASE_SERVICE_ROLE_KEY must be set to seed E2E persona users'
  ).toBeTruthy()

  const admin = createClient(url, serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  for (const persona of Object.values(E2E_PERSONAS)) {
    // Whitelist entry must exist before the user is created, otherwise the
    // check_whitelist BEFORE INSERT trigger rejects the signup.
    await admin
      .from('whitelist')
      .upsert({ identifier: persona.email, default_role: persona.role }, { onConflict: 'identifier' })

    const { data, error } = await admin.auth.admin.createUser({
      email: persona.email,
      password: persona.password,
      email_confirm: true,
    })
    if (error && !error.message.includes('already been registered')) {
      throw new Error(`Failed to create persona ${persona.email}: ${error.message}`)
    }

    let userId = data?.user?.id
    if (!userId) {
      const { data: list } = await admin.auth.admin.listUsers()
      userId = list?.users?.find((u) => u.email === persona.email)?.id
    }
    if (userId) {
      await admin.from('profiles').update({ role: persona.role }).eq('id', userId)
    }
  }
})
