'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
import type { AppRole } from '@/lib/supabase/types'

const PRIVILEGED_ROLES: AppRole[] = ['admin', 'coordenador']

function identifierDomain(identifier: string): string | null {
  const at = identifier.lastIndexOf('@')
  return at === -1 ? null : identifier.slice(at + 1)
}

type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; code: string; message: string }

function revalidateAdmin() {
  revalidatePath('/admin')
}

// ─── Helper: checar se solicitante é admin ───────────────────────────────────

async function requireAdmin(): Promise<{ ok: false; code: string; message: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, code: 'UNAUTHENTICATED', message: 'Não autenticado.' }

  const { data: caller } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (caller?.role !== 'admin') {
    return { ok: false, code: 'FORBIDDEN', message: 'Apenas admins podem realizar esta ação.' }
  }
  return null
}

// ─── Alterar role de usuário ─────────────────────────────────────────────────

export async function updateUserRole(userId: string, role: AppRole): Promise<ActionResult> {
  try {
    const deny = await requireAdmin()
    if (deny) return deny

    const supabase = await createClient()

    // Last-admin guard: se está rebaixando um admin, garantir que não é o único.
    if (role !== 'admin') {
      const { data: target } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (target?.role === 'admin') {
        const { count } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'admin')

        if ((count ?? 0) <= 1) {
          return {
            ok: false,
            code: 'LAST_ADMIN',
            message: 'Não é possível rebaixar o único admin do sistema. Promova outro usuário a admin antes.',
          }
        }
      }
    }

    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
    if (error) return { ok: false, code: 'DB_ERROR', message: error.message }

    revalidateAdmin()
    return { ok: true }
  } catch (e) {
    return { ok: false, code: 'UNEXPECTED', message: String(e) }
  }
}

// ─── Buscar whitelist ────────────────────────────────────────────────────────

export async function getWhitelist() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('whitelist')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) return { ok: false as const, message: error.message, data: null }
  return { ok: true as const, data }
}

// ─── Adicionar à whitelist ───────────────────────────────────────────────────

export async function addToWhitelist(
  identifiersText: string,
  defaultRole: AppRole = 'efetivo',
): Promise<ActionResult> {
  try {
    const deny = await requireAdmin()
    if (deny) return deny

    const supabase = await createClient()
    
    const identifiers = identifiersText
      .split(/[\n,;]+/)
      .map((id) => id.trim().toLowerCase())
      .filter((id) => id.length > 0)

    if (identifiers.length === 0) {
      return { ok: false, code: 'INVALID', message: 'Nenhum identificador válido fornecido.' }
    }

    let added = 0
    let failed = 0

    for (const identifier of identifiers) {
      const { error } = await supabase
        .from('whitelist')
        .insert({ identifier, default_role: defaultRole })

      if (error) {
        failed++
      } else {
        added++
        if (PRIVILEGED_ROLES.includes(defaultRole)) {
          logger.info('whitelist_privileged_role', {
            event: 'whitelist_privileged_role',
            identifier_domain: identifierDomain(identifier),
            default_role: defaultRole,
          })
        }
      }
    }

    revalidateAdmin()

    if (added === 0 && failed > 0) {
      return { ok: false, code: 'DUPLICATE', message: 'Nenhum adicionado. Todos os identificadores já estão na whitelist.' }
    }

    const message = identifiers.length === 1 && added === 1 
      ? undefined 
      : `${added} adicionado(s) com sucesso${failed > 0 ? `, ${failed} ignorado(s) (já existiam)` : ''}.`

    return { ok: true, message }
  } catch (e) {
    return { ok: false, code: 'UNEXPECTED', message: String(e) }
  }
}

// ─── Arquivar / Restaurar Usuário (Soft Delete) ──────────────────────────────

export async function archiveUser(userId: string): Promise<ActionResult> {
  try {
    const deny = await requireAdmin()
    if (deny) return deny

    const supabase = await createClient()

    // Last-admin guard
    const { data: target } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (target?.role === 'admin') {
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin')

      if ((count ?? 0) <= 1) {
        return {
          ok: false,
          code: 'LAST_ADMIN',
          message: 'Não é possível arquivar o único admin do sistema.',
        }
      }
    }

    const { error } = await supabase.from('profiles').update({ archived_at: new Date().toISOString() }).eq('id', userId)
    if (error) return { ok: false, code: 'DB_ERROR', message: error.message }

    revalidateAdmin()
    return { ok: true }
  } catch (e) {
    return { ok: false, code: 'UNEXPECTED', message: String(e) }
  }
}

export async function restoreUser(userId: string): Promise<ActionResult> {
  try {
    const deny = await requireAdmin()
    if (deny) return deny

    const supabase = await createClient()

    const { error } = await supabase.from('profiles').update({ archived_at: null }).eq('id', userId)
    if (error) return { ok: false, code: 'DB_ERROR', message: error.message }

    revalidateAdmin()
    return { ok: true }
  } catch (e) {
    return { ok: false, code: 'UNEXPECTED', message: String(e) }
  }
}

// ─── Remover da whitelist ────────────────────────────────────────────────────

export async function removeFromWhitelist(id: string): Promise<ActionResult> {
  try {
    const deny = await requireAdmin()
    if (deny) return deny

    const supabase = await createClient()
    const { error } = await supabase.from('whitelist').delete().eq('id', id)
    if (error) return { ok: false, code: 'DB_ERROR', message: error.message }

    revalidateAdmin()
    return { ok: true }
  } catch (e) {
    return { ok: false, code: 'UNEXPECTED', message: String(e) }
  }
}
