'use client'

import { useMemo, useState, useTransition } from 'react'
import type { Profile, AppRole, WhitelistEntry } from '@/lib/supabase/types'
import { updateUserRole, addToWhitelist, removeFromWhitelist } from '@/lib/actions/admin'

interface AdminViewProps {
  profiles: Profile[]
  whitelist: WhitelistEntry[]
}

const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Admin',
  coordenador: 'Coordenador',
  efetivo: 'Efetivo',
}

const ROLE_COLORS: Record<AppRole, string> = {
  admin: 'bg-destructive/10 text-destructive',
  coordenador: 'bg-primary/10 text-primary',
  efetivo: 'bg-muted text-muted-foreground',
}

function isEntryPending(entry: WhitelistEntry, profileEmails: Set<string>): boolean {
  if (entry.identifier.startsWith('@')) {
    const domain = entry.identifier
    for (const email of profileEmails) {
      if (email.endsWith(domain)) return false
    }
    return true
  }
  return !profileEmails.has(entry.identifier)
}

export default function AdminView({ profiles, whitelist: initialWhitelist }: AdminViewProps) {
  const [isSubmitting, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [newIdentifier, setNewIdentifier] = useState('')
  const [newDefaultRole, setNewDefaultRole] = useState<AppRole>('efetivo')
  const [activeTab, setActiveTab] = useState<'usuarios' | 'whitelist'>('usuarios')

  const profileEmails = useMemo(
    () => new Set(profiles.map((p) => p.email.toLowerCase())),
    [profiles],
  )

  function withFeedback(fn: () => Promise<{ ok: boolean; code?: string; message?: string }>, successText: string) {
    setErrorMsg(null)
    setSuccessMsg(null)
    startTransition(async () => {
      const result = await fn()
      if (!result.ok) setErrorMsg((result as { message?: string }).message ?? 'Erro inesperado.')
      else setSuccessMsg(successText)
    })
  }

  function handleRoleChange(userId: string, role: AppRole) {
    withFeedback(() => updateUserRole(userId, role), 'Role atualizado com sucesso.')
  }

  function handleAddWhitelist(e: React.FormEvent) {
    e.preventDefault()
    if (!newIdentifier.trim()) return
    withFeedback(
      () => addToWhitelist(newIdentifier, newDefaultRole),
      `"${newIdentifier.trim()}" adicionado como ${ROLE_LABELS[newDefaultRole]}.`,
    )
    setNewIdentifier('')
    setNewDefaultRole('efetivo')
  }

  function handleRemoveWhitelist(id: string, identifier: string) {
    if (!confirm(`Remover "${identifier}" da whitelist?`)) return
    withFeedback(() => removeFromWhitelist(id), `"${identifier}" removido.`)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Painel Administrativo</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gerencie usuários e permissões de acesso</p>
      </div>

      {/* Feedback */}
      {errorMsg && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-2.5 rounded-xl flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2.5 rounded-xl flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border gap-1">
        {(['usuarios', 'whitelist'] as const).map((tab) => (
          <button
            key={tab}
            id={`tab-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors capitalize border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'usuarios' ? `Usuários (${profiles.length})` : `Whitelist (${initialWhitelist.length})`}
          </button>
        ))}
      </div>

      {/* Tab: Usuários */}
      {activeTab === 'usuarios' && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Usuário</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Membro desde</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Role</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.avatar_url} alt={p.email} className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                          {p.email[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium truncate max-w-[180px]">{p.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {new Date(p.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <select
                      id={`role-select-${p.id}`}
                      value={p.role}
                      onChange={(e) => handleRoleChange(p.id, e.target.value as AppRole)}
                      disabled={isSubmitting}
                      className={`text-xs font-semibold px-3 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 ${ROLE_COLORS[p.role]}`}
                    >
                      {(Object.keys(ROLE_LABELS) as AppRole[]).map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {profiles.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground text-sm">
                    Nenhum usuário cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Whitelist */}
      {activeTab === 'whitelist' && (
        <div className="flex flex-col gap-4">
          {/* Formulário adicionar */}
          <form onSubmit={handleAddWhitelist} className="flex flex-col sm:flex-row gap-2">
            <input
              id="input-whitelist"
              type="text"
              value={newIdentifier}
              onChange={(e) => setNewIdentifier(e.target.value)}
              placeholder="email@dominio.com ou @dominio.com"
              className="flex-1 text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <select
              id="select-default-role"
              value={newDefaultRole}
              onChange={(e) => setNewDefaultRole(e.target.value as AppRole)}
              className="text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {(Object.keys(ROLE_LABELS) as AppRole[]).map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={isSubmitting || !newIdentifier.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Adicionar
            </button>
          </form>

          {/* Lista */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {initialWhitelist.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Whitelist vazia. Adicione e-mails ou domínios acima.
              </p>
            ) : (
              <ul>
                {initialWhitelist.map((entry) => {
                  const pending = isEntryPending(entry, profileEmails)
                  return (
                    <li key={entry.id} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-2 flex-wrap">
                        {entry.identifier.startsWith('@') ? (
                          <span className="text-xs bg-secondary/20 text-secondary-foreground px-2 py-0.5 rounded-full font-medium">domínio</span>
                        ) : (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">e-mail</span>
                        )}
                        <span className="text-sm font-mono">{entry.identifier}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[entry.default_role]}`}>
                          {ROLE_LABELS[entry.default_role]}
                        </span>
                        {pending && (
                          <span title="Ainda não logou" className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            🕐 Pendente
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {new Date(entry.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        <button
                          onClick={() => handleRemoveWhitelist(entry.id, entry.identifier)}
                          disabled={isSubmitting}
                          className="text-xs text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
                        >
                          Remover
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            <strong>Dica:</strong> Use <code className="bg-muted px-1 rounded">@dominio.gov.br</code> para liberar um domínio inteiro.
          </p>
        </div>
      )}
    </div>
  )
}
