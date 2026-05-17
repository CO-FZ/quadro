'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { t } from '@/lib/i18n'

type CallbackError = 'not_authorized' | 'auth_failed'

const KNOWN_ERRORS: ReadonlySet<CallbackError> = new Set(['not_authorized', 'auth_failed'])

function callbackErrorMessage(value: string | null): string | null {
  if (!value) return null
  if ((KNOWN_ERRORS as ReadonlySet<string>).has(value)) {
    return t(`auth.errors.${value}`)
  }
  return t('auth.errors.auth_failed')
}

export default function LoginPage() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const callbackError = callbackErrorMessage(searchParams.get('error'))

  async function handleGoogleLogin() {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Card de login */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <Image src="/CO-FZ.png" alt="Logo CO-FZ" width={200} height={50} className="h-20 w-auto object-contain" />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-primary">CO-FZ</h1>
            <p className="text-sm text-muted-foreground mt-1">Quadro de Atividades</p>
          </div>
        </div>

        {/* Divisor */}
        <div className="w-full border-t border-border" />

        {/* Mensagem de boas-vindas */}
        <div className="text-center">
          <p className="text-foreground font-medium">Acesso restrito</p>
          <p className="text-sm text-muted-foreground mt-1">
            Entre com o gmail cadastrado
          </p>
        </div>

        {/* Aviso vindo da auth callback (?error=not_authorized | auth_failed) */}
        {callbackError && !error && (
          <div
            role="alert"
            className="w-full bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 text-sm text-destructive"
          >
            {callbackError}
          </div>
        )}

        {/* Erro do próprio fluxo OAuth (signInWithOAuth) */}
        {error && (
          <div
            role="alert"
            className="w-full bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        {/* Botão Google */}
        <button
          id="btn-google-login"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-border rounded-xl px-4 py-3 font-medium text-foreground hover:bg-muted transition-all duration-200 hover:border-primary/30 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
        >
          {loading ? (
            <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          {loading ? 'Redirecionando...' : 'Entrar com Google'}
        </button>

        <p className="text-xs text-muted-foreground text-center">
          Apenas e-mails cadastrados têm acesso ao sistema.
        </p>
      </div>
    </div>
  )
}
