import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import type { AppRole } from '@/lib/supabase/types'

export type RoleGuardError = {
  ok: false
  code: 'UNAUTHENTICATED' | 'FORBIDDEN'
  message: string
}

export type Caller = { userId: string; role: AppRole } | null

/**
 * Função pura: dado um `caller` já resolvido (ou null), decide se a role bate.
 * Extraída para teste unit (não toca Supabase nem cache).
 */
export function assertRoleAllowed(
  caller: Caller,
  allowed: AppRole[],
): RoleGuardError | null {
  if (!caller) {
    return { ok: false, code: 'UNAUTHENTICATED', message: 'Não autenticado.' }
  }
  if (!allowed.includes(caller.role)) {
    return { ok: false, code: 'FORBIDDEN', message: 'Você não tem permissão para esta ação.' }
  }
  return null
}

export const getCallerRole = cache(async (): Promise<Caller> => {
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
  const result = assertRoleAllowed(caller, allowed)
  if (result?.code === 'FORBIDDEN' && caller) {
    logger.warn('role_forbidden', {
      userId: caller.userId,
      role: caller.role,
      allowed: allowed.join(','),
    })
  }
  return result
}

/**
 * Shorthand: permite apenas admins.
 * Substitui as implementações locais de `requireAdmin()` espalhadas nas Server Actions.
 */
export async function requireAdmin(): Promise<RoleGuardError | null> {
  return requireRole(['admin'])
}

/**
 * Shorthand: permite admins e coordenadores.
 */
export async function requirePrivileged(): Promise<RoleGuardError | null> {
  return requireRole(['admin', 'coordenador'])
}
