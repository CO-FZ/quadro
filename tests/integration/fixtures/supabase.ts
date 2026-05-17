import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { PERSONAS, type PersonaName } from './personas'
import { execSync } from 'node:child_process'

let localUrl = 'http://127.0.0.1:54321'
let localAnonKey = ''
let localServiceRoleKey = ''

if (!process.env.SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  try {
    const statusOutput = execSync('npx supabase status --output json', { encoding: 'utf-8', stdio: 'pipe' })
    const statusJson = JSON.parse(statusOutput)
    localUrl = statusJson.API_URL || statusJson.api_url || 'http://127.0.0.1:54321'
    localAnonKey = statusJson.ANON_KEY || statusJson.anon_key || ''
    localServiceRoleKey = statusJson.SERVICE_ROLE_KEY || statusJson.service_role_key || ''
  } catch (err1) {
    console.error('Error fetching supabase status via json:', err1)
    try {
      const statusOutput = execSync('npx supabase status', { encoding: 'utf-8', stdio: 'pipe' })
      localUrl = statusOutput.match(/Project URL\s*│\s*(http[^\s│]+)/)?.[1] || 'http://127.0.0.1:54321'
      localAnonKey = statusOutput.match(/Publishable\s*│\s*([^\s│]+)/)?.[1] || ''
      localServiceRoleKey = statusOutput.match(/Secret\s*│\s*([^\s│]+)/)?.[1] || ''
    } catch (err2) {
      console.error('Error fetching supabase status via regex:', err2)
    }
  }
}

export const SUPABASE_URL        = process.env.SUPABASE_URL             ?? localUrl
export const SUPABASE_ANON_KEY   = process.env.SUPABASE_ANON_KEY        ?? localAnonKey
export const SERVICE_ROLE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY ?? localServiceRoleKey

// adminClient — service_role, bypasses RLS. Only for fixtures.
export const adminClient: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Cache sessions per persona so signIn happens once per test file.
const _sessions: Partial<Record<PersonaName, { client: SupabaseClient; userId: string; jwt: string }>> = {}

export async function getPersonaSession(name: PersonaName) {
  if (_sessions[name]) return _sessions[name]!

  const { email, password } = PERSONAS[name]
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await anonClient.auth.signInWithPassword({ email, password })
  if (error || !data.session) throw new Error(`signIn failed for ${name}: ${error?.message}`)

  const jwt = data.session.access_token
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  })

  _sessions[name] = { client, userId: data.user.id, jwt }
  return _sessions[name]!
}

// Clears cached sessions (call in afterAll if tests mutate persona state)
export function clearPersonaSessions() {
  for (const key of Object.keys(_sessions) as PersonaName[]) {
    delete _sessions[key]
  }
}
