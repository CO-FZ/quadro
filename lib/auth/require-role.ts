import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { AppRole } from '@/lib/supabase/types'

export type RoleGuardError = {
  ok: false
  code: 'UNAUTHENTICATED' | 'FORBIDDEN'
  message: string
}

const getCallerRole = cache(async (): Promise<{ userId: string; role: AppRole } | null> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) return null
  return { userId: user.id, role: profile.role as AppRole }
})

export async function requireRole(allowed: AppRole[]): Promise<RoleGuardError | null> {
  const caller = await getCallerRole()
  if (!caller) {
    return { ok: false, code: 'UNAUTHENTICATED', message: 'Não autenticado.' }
  }
  if (!allowed.includes(caller.role)) {
    return { ok: false, code: 'FORBIDDEN', message: 'Você não tem permissão para esta ação.' }
  }
  return null
}
