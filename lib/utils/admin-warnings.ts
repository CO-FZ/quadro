import type { AppRole } from '@/lib/supabase/types'

const PRIVILEGED_ROLES: ReadonlySet<AppRole> = new Set(['admin', 'coordenador'])

/**
 * Story 07B.2 CA-06/07. Função pura: identifier de domínio (`@xyz.com`)
 * combinado com role privilegiada (admin/coordenador) é um vetor de risco —
 * qualquer email novo do domínio entra automaticamente com privilégio.
 *
 * Não bloqueia a ação; só dispara o aviso visual.
 */
export function isPrivilegedDomainEntry(
  identifier: string,
  role: AppRole,
): boolean {
  return identifier.trim().startsWith('@') && PRIVILEGED_ROLES.has(role)
}
