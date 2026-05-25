// Runs as the 'seed' setup project (a dependency of 'setup' in
// playwright.config.ts), so it executes before auth.setup.ts logs in.
//
// loginAs() authenticates against real Supabase accounts, but the E2E job only
// runs `supabase db reset` (which seeds no users). This creates the persona
// users via the admin API — idempotent, mirroring tests/integration seedPersonas.
import { test as setup, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { E2E_PERSONAS } from './fixtures/auth'
import { execSync } from 'node:child_process'

setup('seed personas', async () => {
  let url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL
  let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    try {
      const statusOutput = execSync('npx supabase status --output json', { encoding: 'utf-8', stdio: 'pipe' })
      const statusJson = JSON.parse(statusOutput)
      if (!url) {
        url = statusJson.API_URL || statusJson.api_url
      }
      serviceRoleKey = statusJson.SERVICE_ROLE_KEY || statusJson.service_role_key
    } catch (err1) {
      console.warn('E2E seed: Error fetching supabase status via json:', err1)
      try {
        const statusOutput = execSync('npx supabase status', { encoding: 'utf-8', stdio: 'pipe' })
        if (!url) {
          url = statusOutput.match(/Project URL\s*│\s*(http[^\s│]+)/)?.[1]
        }
        serviceRoleKey = statusOutput.match(/Secret\s*│\s*([^\s│]+)/)?.[1]
      } catch (err2) {
        console.warn('E2E seed: Error fetching supabase status via regex:', err2)
      }
    }
  }

  if (!url) {
    url = 'http://127.0.0.1:54321'
  }

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
