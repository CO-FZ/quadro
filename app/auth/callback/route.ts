import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function domainOf(email: string | undefined | null): string | null {
  if (!email) return null
  const at = email.lastIndexOf('@')
  return at === -1 ? null : email.slice(at + 1).toLowerCase()
}

/**
 * Story 07B.2 CA-01/CA-04. O trigger `check_whitelist` em Postgres lança
 * `RAISE EXCEPTION 'Acesso negado: ...'`. Esse texto chega tanto via
 * `error_description` (quando GoTrue redireciona após falha de signup OAuth)
 * quanto via mensagem do erro retornado por `exchangeCodeForSession`.
 */
function isWhitelistError(...candidates: Array<string | undefined | null>): boolean {
  return candidates.some((c) => typeof c === 'string' && c.toLowerCase().includes('acesso negado'))
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const oauthError = requestUrl.searchParams.get('error')
  const oauthErrorDescription = requestUrl.searchParams.get('error_description')

  // Caminho 1: GoTrue redireciona com erro (signup barrado, OAuth abortado).
  if (oauthError || oauthErrorDescription) {
    const blocked = isWhitelistError(oauthErrorDescription)
    logger.warn(blocked ? 'signup_blocked' : 'auth_callback_error', {
      error_code: oauthError ?? 'unknown',
      whitelist_blocked: blocked,
    })
    const target = blocked ? '/login?error=not_authorized' : '/login?error=auth_failed'
    return NextResponse.redirect(new URL(target, requestUrl.origin))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/kanban', requestUrl.origin))
  }

  // Caminho 2: troca o code → session. Pode falhar por race do trigger.
  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    const blocked = isWhitelistError(error.message)
    const { data: userData } = await supabase.auth.getUser()
    logger.warn(blocked ? 'signup_blocked' : 'auth_callback_error', {
      error_code: error.code ?? error.name ?? 'unknown',
      email_domain: domainOf(userData?.user?.email),
      whitelist_blocked: blocked,
    })
    const target = blocked ? '/login?error=not_authorized' : '/login?error=auth_failed'
    return NextResponse.redirect(new URL(target, requestUrl.origin))
  }

  return NextResponse.redirect(new URL('/kanban', requestUrl.origin))
}
