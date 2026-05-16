import { execSync } from 'child_process'
import { seedPersonas } from './fixtures/seed'

export async function setup() {
  // Verify Supabase local is running (CI starts it; locally, developer runs `supabase start`)
  try {
    execSync('supabase status', { stdio: 'pipe' })
  } catch {
    throw new Error(
      'Supabase local is not running. Run `supabase start` before integration tests.\n' +
      'Also set SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY (from `supabase status`).'
    )
  }

  await seedPersonas()
}

export async function teardown() {
  // Keep DB state for post-run inspection. CI resets on next run via `supabase db reset`.
}
