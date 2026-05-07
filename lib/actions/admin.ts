'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { AppRole } from '@/lib/supabase/types'

type ActionResult =
  | { ok: true }
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
  identifier: string,
  defaultRole: AppRole = 'efetivo',
): Promise<ActionResult> {
  try {
    const deny = await requireAdmin()
    if (deny) return deny

    const supabase = await createClient()
    const normalized = identifier.trim().toLowerCase()

    if (!normalized) {
      return { ok: false, code: 'INVALID', message: 'Identificador não pode ser vazio.' }
    }

    const { error } = await supabase
      .from('whitelist')
      .insert({ identifier: normalized, default_role: defaultRole })

    if (error?.code === '23505') {
      return { ok: false, code: 'DUPLICATE', message: 'Identificador já está na whitelist.' }
    }
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
