import { type Page } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'

export type E2EPersona = 'admin' | 'coord' | 'efetivo'

// Single source of truth for E2E persona accounts. Used by loginAs() and by
// seed.setup.ts, which creates these users via the Supabase admin API.
// Deterministic, test-only credentials — never use in production.
export const E2E_PERSONAS: Record<
  E2EPersona,
  { email: string; password: string; role: 'admin' | 'coordenador' | 'efetivo' }
> = {
  admin:   { email: 'test-admin@cofz.local',   password: 'TestAdmin123!',   role: 'admin' },
  coord:   { email: 'test-coord@cofz.local',   password: 'TestCoord123!',   role: 'coordenador' },
  efetivo: { email: 'test-efetivo@cofz.local', password: 'TestEfetivo123!', role: 'efetivo' },
}

// storageState files per persona (written by auth.setup.ts, read by tests)
export function storageStatePath(persona: E2EPersona): string {
  const dir = path.resolve(__dirname, '../.auth')
  fs.mkdirSync(dir, { recursive: true })
  return path.join(dir, `${persona}.json`)
}

// Google OAuth is not automatable in E2E without intercepting.
// Strategy: use email/password magic link or direct API session injection.
// For test environment, use Supabase Auth admin API to create a session,
// then inject cookies into Playwright's browser context.
export async function loginAs(page: Page, persona: E2EPersona) {
  const { email, password } = E2E_PERSONAS[persona]

  // Use Supabase REST auth endpoint directly
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const response = await page.request.post(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      headers: { 'apikey': supabaseAnon, 'Content-Type': 'application/json' },
      data: { email, password },
    }
  )
  const session = await response.json()

  // Inject session into Next.js app via cookie
  // @supabase/ssr reads sb-*-auth-token cookie
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
  await page.context().addCookies([
    {
      name: `sb-${projectRef}-auth-token`,
      value: JSON.stringify(session),
      domain: new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000').hostname,
      path: '/',
      httpOnly: true,
      secure: false,
    },
  ])
}
