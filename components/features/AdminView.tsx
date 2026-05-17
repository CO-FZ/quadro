'use client'

import { useMemo, useState, useTransition } from 'react'
import Image from 'next/image'
import type {
  Profile,
  AppRole,
  WhitelistEntry,
  PrivilegedRoleAuditEntry,
  PrivilegedRoleAuditSource,
} from '@/lib/supabase/types'
import { updateUserRole, addToWhitelist, removeFromWhitelist, archiveUser, restoreUser } from '@/lib/actions/admin'
import { isPrivilegedDomainEntry } from '@/lib/utils/admin-warnings'
import { t } from '@/lib/i18n'

interface AdminViewProps {
  profiles: Profile[]
  whitelist: WhitelistEntry[]
  auditEntries?: PrivilegedRoleAuditEntry[]
  auditError?: string | null
  currentUserRole?: AppRole
}

type AdminTab = 'usuarios' | 'whitelist' | 'auditoria'

const AUDIT_SOURCE_LABEL_KEYS: Record<PrivilegedRoleAuditSource, string> = {
  whitelist_email: 'admin.audit.source_whitelist_email',
  whitelist_domain: 'admin.audit.source_whitelist_domain',
  manual: 'admin.audit.source_manual',
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

export default function AdminView({
  profiles,
  whitelist: initialWhitelist,
  auditEntries = [],
  auditError = null,
  currentUserRole,
}: AdminViewProps) {
  const [isSubmitting, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [newIdentifier, setNewIdentifier] = useState('')
  const [newDefaultRole, setNewDefaultRole] = useState<AppRole>('efetivo')
  const [activeTab, setActiveTab] = useState<AdminTab>('usuarios')
  const [searchQuery, setSearchQuery] = useState('')

  const showAuditTab = currentUserRole === 'admin'
  const whitelistById = useMemo(
    () => new Map(initialWhitelist.map((entry) => [entry.id, entry])),
    [initialWhitelist],
  )

  const profileEmails = useMemo(
    () => new Set(profiles.map((p) => p.email.toLowerCase())),
    [profiles],
  )

  const showPrivilegedDomainWarning = isPrivilegedDomainEntry(newIdentifier, newDefaultRole)
  const privilegedDomainMessage = showPrivilegedDomainWarning
    ? t(
        'admin.whitelist.privileged_domain_warning',
        newIdentifier.trim(),
        ROLE_LABELS[newDefaultRole],
      )
    : null

  const filteredProfiles = useMemo(() => {
    if (!searchQuery.trim()) return profiles
    const q = searchQuery.toLowerCase()
    return profiles.filter(p => p.email.toLowerCase().includes(q) || (p.full_name && p.full_name.toLowerCase().includes(q)))
  }, [profiles, searchQuery])

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
    setErrorMsg(null)
    setSuccessMsg(null)
    startTransition(async () => {
      const result = await addToWhitelist(newIdentifier, newDefaultRole)
      if (!result.ok) setErrorMsg((result as { message?: string }).message ?? 'Erro inesperado.')
      else setSuccessMsg((result as { message?: string }).message ?? `"${newIdentifier.trim()}" adicionado como ${ROLE_LABELS[newDefaultRole]}.`)
    })
    setNewIdentifier('')
    setNewDefaultRole('efetivo')
  }

  function handleArchive(userId: string, email: string) {
    if (!confirm(`Tem certeza que deseja arquivar o usuário ${email}?`)) return
    withFeedback(() => archiveUser(userId), `Usuário ${email} arquivado.`)
  }

  function handleRestore(userId: string, email: string) {
    withFeedback(() => restoreUser(userId), `Usuário ${email} restaurado.`)
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
        {((['usuarios', 'whitelist', ...(showAuditTab ? ['auditoria'] as const : [])]) as AdminTab[]).map((tab) => (
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
            {tab === 'usuarios' && `Usuários (${profiles.length})`}
            {tab === 'whitelist' && `Whitelist (${initialWhitelist.length})`}
            {tab === 'auditoria' && (
              <span className="inline-flex items-center gap-1.5">
                {t('admin.audit.tab_label')} ({auditEntries.length})
                <span className="text-[10px] font-semibold uppercase tracking-wide bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                  {t('admin.audit.badge_new')}
                </span>
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Usuários */}
      {activeTab === 'usuarios' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Buscar por e-mail ou nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-80 text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
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
              {filteredProfiles.map((p) => {
                const isArchived = !!p.archived_at
                return (
                <tr key={p.id} className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${isArchived ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.avatar_url ? (
                        <Image src={p.avatar_url} alt={p.email} width={32} height={32} className={`h-8 w-8 rounded-full object-cover ${isArchived ? 'grayscale' : ''}`} />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                          {p.email[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium truncate max-w-[180px] flex items-center gap-2">
                          {p.full_name || p.email}
                          {isArchived && <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-semibold">Arquivado</span>}
                        </span>
                        {p.full_name && <span className="text-xs text-muted-foreground">{p.email}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {new Date(p.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-2">
                      <select
                        id={`role-select-${p.id}`}
                        value={p.role}
                        onChange={(e) => handleRoleChange(p.id, e.target.value as AppRole)}
                        disabled={isSubmitting || isArchived}
                        className={`text-xs font-semibold px-3 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 ${ROLE_COLORS[p.role]}`}
                      >
                        {(Object.keys(ROLE_LABELS) as AppRole[]).map((r) => (
                          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                      </select>
                      {isArchived ? (
                        <button
                          onClick={() => handleRestore(p.id, p.email)}
                          disabled={isSubmitting}
                          className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
                        >
                          Restaurar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleArchive(p.id, p.email)}
                          disabled={isSubmitting}
                          className="text-xs font-medium text-destructive hover:underline disabled:opacity-50"
                        >
                          Arquivar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )})}
              {filteredProfiles.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground text-sm">
                    Nenhum usuário cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Tab: Whitelist */}
      {activeTab === 'whitelist' && (
        <div className="flex flex-col gap-4">
          {/* Formulário adicionar */}
          <form onSubmit={handleAddWhitelist} className="flex flex-col gap-2">
            <textarea
              id="input-whitelist"
              value={newIdentifier}
              onChange={(e) => setNewIdentifier(e.target.value)}
              placeholder="email@dominio.com ou @dominio.com&#10;Suporta múltiplos valores separados por vírgula ou nova linha"
              rows={3}
              className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
            />
            <div className="flex justify-end gap-2">
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
            </div>
            {privilegedDomainMessage && (
              <div
                role="alert"
                data-testid="privileged-domain-warning"
                className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm px-4 py-2.5 rounded-xl"
              >
                {privilegedDomainMessage}
              </div>
            )}
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

      {/* Tab: Auditoria (admin-only) */}
      {showAuditTab && activeTab === 'auditoria' && (
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {t('admin.audit.title')}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t('admin.audit.description')}
            </p>
          </div>

          {auditError && (
            <div role="alert" className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-2.5 rounded-xl">
              {t('admin.audit.fetch_error')}
            </div>
          )}

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    {t('admin.audit.column_date')}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    {t('admin.audit.column_email')}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    {t('admin.audit.column_role')}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                    {t('admin.audit.column_source')}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                    {t('admin.audit.column_whitelist_entry')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {auditEntries.map((entry) => {
                  const wlEntry = entry.whitelist_entry_id
                    ? whitelistById.get(entry.whitelist_entry_id)
                    : null
                  return (
                    <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(entry.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{entry.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${ROLE_COLORS[entry.role]}`}>
                          {ROLE_LABELS[entry.role]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                        {t(AUDIT_SOURCE_LABEL_KEYS[entry.source])}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {wlEntry ? (
                          <span className="text-xs font-mono">{wlEntry.identifier}</span>
                        ) : entry.whitelist_entry_id ? (
                          <span className="text-xs italic text-muted-foreground">
                            {t('admin.audit.whitelist_entry_removed')}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {auditEntries.length === 0 && !auditError && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      {t('admin.audit.empty')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground">{t('admin.audit.backfill_notice')}</p>
        </div>
      )}
    </div>
  )
}
