import { createClient } from '@supabase/supabase-js'
import { PERSONAS } from './personas'
import { SUPABASE_URL, SERVICE_ROLE_KEY } from './supabase'

// Called once in globalSetup before any integration test runs.
// Idempotent: upserts entries so repeated runs don't fail.
export async function seedPersonas() {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  for (const [, persona] of Object.entries(PERSONAS)) {
    // Ensure whitelist entry exists so the check_whitelist trigger allows signup
    await admin.from('whitelist').upsert(
      { identifier: persona.email, default_role: persona.role },
      { onConflict: 'identifier' }
    )

    // Try to create auth user; ignore "already exists" errors
    const { data, error } = await admin.auth.admin.createUser({
      email: persona.email,
      password: persona.password,
      email_confirm: true,
    })

    if (error && !error.message.includes('already been registered')) {
      throw new Error(`Failed to create persona ${persona.email}: ${error.message}`)
    }

    // Force correct role in profile (trigger may have run with different default)
    const userId = data?.user?.id
    if (userId) {
      await admin.from('profiles').update({ role: persona.role }).eq('id', userId)
    } else {
      // User already existed — find by email
      const { data: existing } = await admin.auth.admin.listUsers()
      const found = existing?.users?.find(u => u.email === persona.email)
      if (found) {
        await admin.from('profiles').update({ role: persona.role }).eq('id', found.id)
      }
    }
  }
}
