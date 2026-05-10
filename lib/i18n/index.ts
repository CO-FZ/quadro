/**
 * `lib/i18n` — namespace inicial pt-BR. Story 07B.2 CA-08.
 *
 * Wrapper minimalista, sem dependência. Resolve chaves `namespace.path.to.key`
 * em tempo de chamada; valores podem ser strings literais ou funções
 * (interpoladas com argumentos posicionais via `t(key, ...args)`).
 *
 * Escopo desta sprint: 5 mensagens críticas. Migração total é débito futuro
 * (ver `docs/memory/sprints/_summary.md`).
 */

import { auth } from './auth'
import { admin } from './admin'

const dict = { auth, admin } as const

type Dict = typeof dict
type Translatable = string | ((...args: unknown[]) => string)

function resolve(path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, dict as unknown)
}

/**
 * Resolve uma chave de tradução. Retorna a própria chave se não encontrada
 * (degrade visível, fácil de spotar em UI).
 *
 * Ex.: `t('auth.errors.not_authorized')`
 *      `t('admin.whitelist.privileged_domain_warning', '@xyz.com', 'admin')`
 */
export function t(key: string, ...args: unknown[]): string {
  const value = resolve(key) as Translatable | undefined
  if (value === undefined) return key
  if (typeof value === 'function') return value(...args)
  return value
}

export type { Dict }
export { dict }
