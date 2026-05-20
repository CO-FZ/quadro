'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
import { requireAdmin } from '@/lib/auth/require-role'
import type { AppRole, PatenteType, TaskSector, PrivilegedRoleAuditEntry, RoleChangeAuditEntry } from '@/lib/supabase/types'

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

// ─── Guard de admin: delegado ao módulo centralizado lib/auth/require-role ───
// requireAdmin() importado acima — usa React.cache + logger unificado (ADR 0009)

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

// ─── Alterar patente de usuário ──────────────────────────────────────────────

export async function updateUserPatente(userId: string, patente: PatenteType | null): Promise<ActionResult> {
  try {
    const deny = await requireAdmin()
    if (deny) return deny

    const supabase = await createClient()
    const { error } = await supabase.from('profiles').update({ patente }).eq('id', userId)
    if (error) return { ok: false, code: 'DB_ERROR', message: error.message }

    revalidateAdmin()
    return { ok: true }
  } catch (e) {
    return { ok: false, code: 'UNEXPECTED', message: String(e) }
  }
}

// ─── Atualizar perfil completo do usuário (batch) ───────────────────────────

interface UserProfileUpdate {
  nome_guerra: string | null
  patente: PatenteType | null
  divisao: TaskSector | null
  role: AppRole
}

export async function updateUserProfile(userId: string, data: UserProfileUpdate): Promise<ActionResult> {
  try {
    const deny = await requireAdmin()
    if (deny) return deny

    const supabase = await createClient()

    // Single fetch covers both last-admin guard and audit log.
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    // Last-admin guard: se está rebaixando um admin, garantir que não é o único.
    if (data.role !== 'admin' && currentProfile?.role === 'admin') {
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

    const { error } = await supabase.from('profiles').update({
      nome_guerra: data.nome_guerra?.trim() || null,
      patente: data.patente,
      divisao: data.divisao,
      role: data.role,
    }).eq('id', userId)

    if (error) return { ok: false, code: 'DB_ERROR', message: error.message }

    // Best-effort audit: log role change without blocking the update.
    if (currentProfile && currentProfile.role !== data.role) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error: auditError } = await supabase.from('role_change_audit').insert({
          target_profile_id: userId,
          actor_profile_id: user.id,
          old_role: currentProfile.role,
          new_role: data.role,
        })
        if (auditError) {
          logger.warn('role_change_audit_insert_failed', {
            event: 'role_change_audit_insert_failed',
            target_profile_id: userId,
            error: auditError.message,
          })
        }
      }
    }

    revalidateAdmin()
    return { ok: true }
  } catch (e) {
    return { ok: false, code: 'UNEXPECTED', message: String(e) }
  }
}

// ─── Atualizar nome de guerra ────────────────────────────────────────────────

export async function updateUserNomeGuerra(userId: string, nomeGuerra: string | null): Promise<ActionResult> {
  try {
    const deny = await requireAdmin()
    if (deny) return deny

    const supabase = await createClient()
    const value = nomeGuerra?.trim() || null
    const { error } = await supabase.from('profiles').update({ nome_guerra: value }).eq('id', userId)
    if (error) return { ok: false, code: 'DB_ERROR', message: error.message }

    revalidateAdmin()
    return { ok: true }
  } catch (e) {
    return { ok: false, code: 'UNEXPECTED', message: String(e) }
  }
}

// ─── Atualizar divisão do usuário ────────────────────────────────────────────

export async function updateUserDivisao(userId: string, divisao: TaskSector | null): Promise<ActionResult> {
  try {
    const deny = await requireAdmin()
    if (deny) return deny

    const supabase = await createClient()
    const { error } = await supabase.from('profiles').update({ divisao }).eq('id', userId)
    if (error) return { ok: false, code: 'DB_ERROR', message: error.message }

    revalidateAdmin()
    return { ok: true }
  } catch (e) {
    return { ok: false, code: 'UNEXPECTED', message: String(e) }
  }
}

// ─── Buscar whitelist ────────────────────────────────────────────────────────

export async function getWhitelist() {
  // Guard de autorização: apenas admins podem listar a whitelist (ADR 0003)
  const deny = await requireAdmin()
  if (deny) return { ok: false as const, message: deny.message, data: null }

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

// ─── Audit log de role privilegiada ──────────────────────────────────────────

const AUDIT_DEFAULT_LIMIT = 50
const AUDIT_MAX_LIMIT = 200

type AuditResult =
  | { ok: true; data: PrivilegedRoleAuditEntry[] }
  | { ok: false; code: string; message: string }

export async function getPrivilegedRoleAudit(
  options: { limit?: number; offset?: number } = {},
): Promise<AuditResult> {
  try {
    const deny = await requireAdmin()
    if (deny) return deny

    const limit = Math.min(
      Math.max(options.limit ?? AUDIT_DEFAULT_LIMIT, 1),
      AUDIT_MAX_LIMIT,
    )
    const offset = Math.max(options.offset ?? 0, 0)

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('privileged_role_audit')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) return { ok: false, code: 'DB_ERROR', message: error.message }

    return { ok: true, data: (data ?? []) as PrivilegedRoleAuditEntry[] }
  } catch (e) {
    return { ok: false, code: 'UNEXPECTED', message: String(e) }
  }
}

// ─── Audit log de mudança de role pós-cadastro ───────────────────────────────

type RoleChangeAuditResult =
  | { ok: true; data: RoleChangeAuditEntry[] }
  | { ok: false; code: string; message: string }

export async function getRoleChangeAudit(
  targetUserId: string,
  limit = 5,
): Promise<RoleChangeAuditResult> {
  try {
    const deny = await requireAdmin()
    if (deny) return deny

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('role_change_audit')
      .select('*')
      .eq('target_profile_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) return { ok: false, code: 'DB_ERROR', message: error.message }

    return { ok: true, data: (data ?? []) as RoleChangeAuditEntry[] }
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
