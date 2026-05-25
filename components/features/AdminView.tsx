'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Image from 'next/image'
import type {
  Profile,
  AppRole,
  PatenteType,
  TaskSector,
  WhitelistEntry,
  PrivilegedRoleAuditEntry,
  PrivilegedRoleAuditSource,
  RoleChangeAuditEntry,
} from '@/lib/supabase/types'
import { PATENTE_OPTIONS } from '@/lib/supabase/types'
import {
  updateUserProfile,
  addToWhitelist,
  removeFromWhitelist,
  getRoleChangeAudit,
} from '@/lib/actions/admin'
import { isPrivilegedDomainEntry } from '@/lib/utils/admin-warnings'
import { formatNomeCompleto, formatDateTimeBr } from '@/lib/utils/format'
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

// ─── Edit Modal ──────────────────────────────────────────────────────────────

interface EditModalProps {
  profile: Profile
  onClose: () => void
  onSuccess: (msg: string) => void
  onError: (msg: string) => void
}

function EditModal({ profile, onClose, onSuccess, onError }: EditModalProps) {
  const [isSubmitting, startTransition] = useTransition()
  const [nomeGuerra, setNomeGuerra] = useState(profile.nome_guerra ?? '')
  const [patente, setPatente] = useState<PatenteType | ''>(profile.patente ?? '')
  const [divisao, setDivisao] = useState<TaskSector | ''>(profile.divisao ?? '')
  const [role, setRole] = useState<AppRole>(profile.role)
  const [roleHistory, setRoleHistory] = useState<RoleChangeAuditEntry[]>([])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  useEffect(() => {
    let cancelled = false
    getRoleChangeAudit(profile.id, 5)
      .then((result) => { if (!cancelled && result.ok) setRoleHistory(result.data) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [profile.id])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await updateUserProfile(profile.id, {
        nome_guerra: nomeGuerra || null,
        patente: patente || null,
        divisao: divisao || null,
        role,
      })
      if (!result.ok) {
        onError((result as { message?: string }).message ?? 'Erro inesperado.')
      } else {
        onSuccess('Perfil atualizado com sucesso.')
        onClose()
      }
    })
  }

  const displayName = formatNomeCompleto(profile.patente, profile.nome_guerra ?? profile.full_name) || profile.email

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md flex flex-col gap-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.email}
                width={36}
                height={36}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                {(profile.nome_guerra ?? profile.full_name ?? profile.email)[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold text-sm text-foreground truncate max-w-[220px]">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate max-w-[220px]">{profile.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-5">
          {/* Nome de Guerra */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Nome de Guerra</label>
            <input
              type="text"
              value={nomeGuerra}
              onChange={(e) => setNomeGuerra(e.target.value)}
              placeholder="Ex: Eduardo Lima"
              disabled={isSubmitting}
              className="text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 placeholder:text-muted-foreground/50"
            />
            <p className="text-xs text-muted-foreground">
              Nome exibido em todo o app. Ex: nome completo é &quot;Carlos Eduardo Silva Lima&quot;, nome de guerra é &quot;Eduardo Lima&quot;.
            </p>
          </div>

          {/* Patente + Divisão lado a lado */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Patente</label>
              <select
                value={patente}
                onChange={(e) => setPatente(e.target.value as PatenteType | '')}
                disabled={isSubmitting}
                className="text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
              >
                <option value="">—</option>
                {PATENTE_OPTIONS.map((pat) => (
                  <option key={pat} value={pat}>{pat}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Divisão</label>
              <select
                value={divisao}
                onChange={(e) => setDivisao(e.target.value as TaskSector | '')}
                disabled={isSubmitting}
                className="text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
              >
                <option value="">—</option>
                <option value="DT">DT — Divisão Técnica</option>
                <option value="DA">DA — Divisão Administrativa</option>
              </select>
            </div>
          </div>

          {/* Prévia do nome */}
          {(nomeGuerra || patente) && (
            <div className="bg-muted/50 rounded-xl px-4 py-3">
              <p className="text-xs text-muted-foreground mb-0.5">Prévia do nome no app</p>
              <p className="text-sm font-semibold text-foreground">
                {formatNomeCompleto(patente || null, nomeGuerra || profile.full_name)}
              </p>
            </div>
          )}

          {/* Role */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="edit-role">Perfil de acesso</label>
            <select
              id="edit-role"
              value={role}
              onChange={(e) => setRole(e.target.value as AppRole)}
              disabled={isSubmitting}
              className="text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
            >
              {(Object.keys(ROLE_LABELS) as AppRole[]).map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>

          {/* Histórico de mudanças de role */}
          {roleHistory.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium text-muted-foreground">Histórico de perfil de acesso</p>
              <div className="flex flex-col gap-1 rounded-xl border border-border bg-muted/30 px-3 py-2">
                {roleHistory.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="shrink-0 text-[10px]">{formatDateTimeBr(entry.created_at)}</span>
                    <span className={`shrink-0 font-medium px-1.5 py-0.5 rounded ${ROLE_COLORS[entry.old_role]}`}>{ROLE_LABELS[entry.old_role]}</span>
                    <span className="shrink-0">→</span>
                    <span className={`shrink-0 font-medium px-1.5 py-0.5 rounded ${ROLE_COLORS[entry.new_role]}`}>{ROLE_LABELS[entry.new_role]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && (
                <div className="h-3.5 w-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              )}
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

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
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)

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
    return profiles.filter(
      (p) =>
        p.email.toLowerCase().includes(q) ||
        (p.full_name && p.full_name.toLowerCase().includes(q)) ||
        (p.nome_guerra && p.nome_guerra.toLowerCase().includes(q)),
    )
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

  function handleRemoveWhitelist(id: string, identifier: string) {
    if (!confirm(`Remover "${identifier}" da whitelist?`)) return
    withFeedback(() => removeFromWhitelist(id), `"${identifier}" removido.`)
  }

  return (
    <div className="flex flex-col gap-6" data-testid="admin-page">
      {/* Edit Modal */}
      {editingProfile && (
        <EditModal
          profile={editingProfile}
          onClose={() => setEditingProfile(null)}
          onSuccess={(msg) => { setErrorMsg(null); setSuccessMsg(msg) }}
          onError={(msg) => { setSuccessMsg(null); setErrorMsg(msg) }}
        />
      )}

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
      <div className="flex border-b border-border gap-1" role="tablist">
        {((['usuarios', 'whitelist', ...(showAuditTab ? ['auditoria'] as const : [])]) as AdminTab[]).map((tab) => (
          <button
            key={tab}
            id={`tab-${tab}`}
            role="tab"
            aria-selected={activeTab === tab}
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
              placeholder="Buscar por e-mail, nome ou nome de guerra..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-96 text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Usuário</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Membro desde</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Perfil</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.map((p) => {
                  const isArchived = !!p.archived_at
                  const displayName = formatNomeCompleto(p.patente, p.nome_guerra ?? p.full_name) || p.email
                  return (
                    <tr
                      key={p.id}
                      className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${isArchived ? 'opacity-50' : ''}`}
                    >
                      {/* Avatar + nome */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.avatar_url ? (
                            <Image
                              src={p.avatar_url}
                              alt={p.email}
                              width={36}
                              height={36}
                              className={`h-9 w-9 rounded-full object-cover shrink-0 ${isArchived ? 'grayscale' : ''}`}
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                              {(p.nome_guerra ?? p.full_name ?? p.email)[0]?.toUpperCase()}
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-foreground truncate max-w-[200px] flex items-center gap-2">
                              {displayName}
                              {isArchived && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-semibold shrink-0">
                                  Arquivado
                                </span>
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">{p.email}</span>
                            {/* Mobile: mostra patente + divisão abaixo do email */}
                            <div className="flex items-center gap-1.5 mt-0.5 md:hidden">
                              {p.patente && (
                                <span className="text-[10px] font-bold text-muted-foreground">{p.patente}</span>
                              )}
                              {p.divisao && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-secondary/20 text-foreground">{p.divisao}</span>
                              )}
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${ROLE_COLORS[p.role]}`}>
                                {ROLE_LABELS[p.role]}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Membro desde */}
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                        {formatDateTimeBr(p.created_at)}
                      </td>

                      {/* Perfil (patente + divisão + role) */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {p.patente && (
                            <span className="text-xs font-bold text-muted-foreground">{p.patente}</span>
                          )}
                          {p.divisao && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-secondary/20 text-foreground">{p.divisao}</span>
                          )}
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[p.role]}`}>
                            {ROLE_LABELS[p.role]}
                          </span>
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isArchived && (
                            <button
                              onClick={() => setEditingProfile(p)}
                              disabled={isSubmitting}
                              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                              </svg>
                              Editar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filteredProfiles.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      Nenhum usuário encontrado.
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
                          {formatDateTimeBr(entry.created_at)}
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
