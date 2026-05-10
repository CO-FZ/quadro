/**
 * Logger estruturado — Story 07B.1.
 *
 * Saída em produção: JSON serializado em uma linha (Vercel/Supabase agregam por linha).
 * Saída em desenvolvimento: pretty (legível em tty).
 *
 * Wrapper minimalista sobre `console.*` — não introduz dependência runtime.
 * Para a versão Deno usada na Edge Function, ver `supabase/functions/_shared/logger.ts`
 * (mantida em sincronia manual; mesma API, mesmo formato JSON).
 *
 * Ver também: AGENTS.md §6, lib/logger/README.md.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LogContextValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | LogContextValue[]
  | { [key: string]: LogContextValue }

export type LogContext = Record<string, LogContextValue>

const REDACTED = '[REDACTED]'

const SENSITIVE_KEYS = new Set([
  'password',
  'jwt',
  'token',
  'authorization',
  'cookie',
  'secret',
  'service_role_key',
])

export function redact(input: LogContextValue): LogContextValue {
  if (input === null || input === undefined) return input
  if (typeof input !== 'object') return input
  if (Array.isArray(input)) return input.map(redact)

  const out: Record<string, LogContextValue> = {}
  for (const [k, v] of Object.entries(input)) {
    out[k] = SENSITIVE_KEYS.has(k.toLowerCase()) ? REDACTED : redact(v)
  }
  return out
}

function emit(level: LogLevel, msg: string, ctx?: LogContext): void {
  const safeCtx = ctx ? (redact(ctx) as Record<string, LogContextValue>) : undefined
  const ts = new Date().toISOString()

  const isProd = process.env.NODE_ENV === 'production'
  const sink = level === 'error' ? console.error
    : level === 'warn' ? console.warn
    : level === 'debug' ? console.debug
    : console.info

  if (isProd) {
    sink(JSON.stringify({ level, msg, ts, ...(safeCtx ?? {}) }))
    return
  }

  const tag = `[${level.toUpperCase()}]`
  if (safeCtx && Object.keys(safeCtx).length > 0) {
    sink(`${tag} ${msg}`, safeCtx)
  } else {
    sink(`${tag} ${msg}`)
  }
}

export const logger = {
  debug: (msg: string, ctx?: LogContext) => emit('debug', msg, ctx),
  info: (msg: string, ctx?: LogContext) => emit('info', msg, ctx),
  warn: (msg: string, ctx?: LogContext) => emit('warn', msg, ctx),
  error: (msg: string, ctx?: LogContext) => emit('error', msg, ctx),
}
