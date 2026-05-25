# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: seed.setup.ts >> seed personas
- Location: tests/e2e/seed.setup.ts:12:6

# Error details

```
Error: SUPABASE_SERVICE_ROLE_KEY must be set to seed E2E persona users

expect(received).toBeTruthy()

Received: undefined
```

# Test source

```ts
  1  | // Runs as the 'seed' setup project (a dependency of 'setup' in
  2  | // playwright.config.ts), so it executes before auth.setup.ts logs in.
  3  | //
  4  | // loginAs() authenticates against real Supabase accounts, but the E2E job only
  5  | // runs `supabase db reset` (which seeds no users). This creates the persona
  6  | // users via the admin API — idempotent, mirroring tests/integration seedPersonas.
  7  | import { test as setup, expect } from '@playwright/test'
  8  | import { createClient } from '@supabase/supabase-js'
  9  | import { E2E_PERSONAS } from './fixtures/auth'
  10 | import { execSync } from 'node:child_process'
  11 | 
  12 | setup('seed personas', async () => {
  13 |   let url =
  14 |     process.env.NEXT_PUBLIC_SUPABASE_URL ??
  15 |     process.env.SUPABASE_URL
  16 |   let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  17 | 
  18 |   if (!serviceRoleKey) {
  19 |     try {
  20 |       const statusOutput = execSync('npx supabase status --output json', { encoding: 'utf-8', stdio: 'pipe' })
  21 |       const statusJson = JSON.parse(statusOutput)
  22 |       if (!url) {
  23 |         url = statusJson.API_URL || statusJson.api_url
  24 |       }
  25 |       serviceRoleKey = statusJson.SERVICE_ROLE_KEY || statusJson.service_role_key
  26 |     } catch (err1) {
  27 |       console.warn('E2E seed: Error fetching supabase status via json:', err1)
  28 |       try {
  29 |         const statusOutput = execSync('npx supabase status', { encoding: 'utf-8', stdio: 'pipe' })
  30 |         if (!url) {
  31 |           url = statusOutput.match(/Project URL\s*│\s*(http[^\s│]+)/)?.[1]
  32 |         }
  33 |         serviceRoleKey = statusOutput.match(/Secret\s*│\s*([^\s│]+)/)?.[1]
  34 |       } catch (err2) {
  35 |         console.warn('E2E seed: Error fetching supabase status via regex:', err2)
  36 |       }
  37 |     }
  38 |   }
  39 | 
  40 |   if (!url) {
  41 |     url = 'http://127.0.0.1:54321'
  42 |   }
  43 | 
  44 |   expect(
  45 |     serviceRoleKey,
  46 |     'SUPABASE_SERVICE_ROLE_KEY must be set to seed E2E persona users'
> 47 |   ).toBeTruthy()
     |     ^ Error: SUPABASE_SERVICE_ROLE_KEY must be set to seed E2E persona users
  48 | 
  49 |   const admin = createClient(url, serviceRoleKey!, {
  50 |     auth: { autoRefreshToken: false, persistSession: false },
  51 |   })
  52 | 
  53 |   for (const persona of Object.values(E2E_PERSONAS)) {
  54 |     // Whitelist entry must exist before the user is created, otherwise the
  55 |     // check_whitelist BEFORE INSERT trigger rejects the signup.
  56 |     await admin
  57 |       .from('whitelist')
  58 |       .upsert({ identifier: persona.email, default_role: persona.role }, { onConflict: 'identifier' })
  59 | 
  60 |     const { data, error } = await admin.auth.admin.createUser({
  61 |       email: persona.email,
  62 |       password: persona.password,
  63 |       email_confirm: true,
  64 |     })
  65 |     if (error && !error.message.includes('already been registered')) {
  66 |       throw new Error(`Failed to create persona ${persona.email}: ${error.message}`)
  67 |     }
  68 | 
  69 |     let userId = data?.user?.id
  70 |     if (!userId) {
  71 |       const { data: list } = await admin.auth.admin.listUsers()
  72 |       userId = list?.users?.find((u) => u.email === persona.email)?.id
  73 |     }
  74 |     if (userId) {
  75 |       await admin.from('profiles').update({ role: persona.role }).eq('id', userId)
  76 |     }
  77 |   }
  78 | })
  79 | 
```