import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function domainOf(email: string | undefined | null): string | null {
  if (!email) return null
  const at = email.lastIndexOf('@')
  return at === -1 ? null : email.slice(at + 1).toLowerCase()
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/kanban', requestUrl.origin))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    const { data: userData } = await supabase.auth.getUser()
    logger.warn('auth_callback_error', {
      error_code: error.code ?? error.name ?? 'unknown',
      email_domain: domainOf(userData?.user?.email),
    })
    return NextResponse.redirect(new URL('/login?error=not_authorized', requestUrl.origin))
  }

  return NextResponse.redirect(new URL('/kanban', requestUrl.origin))
}
