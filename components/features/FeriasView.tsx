'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import type { Leave, LeaveType, Profile } from '@/lib/supabase/types'
import { LEAVE_TYPE_OPTIONS } from '@/lib/supabase/types'
import { createLeave, updateLeave, deleteLeave, getLeaves } from '@/lib/actions/leaves'
import { sortByPatente } from '@/lib/utils/patente'
import { formatNomeCompleto, formatDateBr } from '@/lib/utils/format'
import { leaveBarGeometry } from '@/lib/utils/leave-calendar'
import { t } from '@/lib/i18n'

type FeriasProfile = Pick<Profile, 'id' | 'email' | 'full_name' | 'nome_guerra' | 'avatar_url' | 'patente'>

interface FeriasViewProps {
  profiles: FeriasProfile[]
  initialLeaves: Leave[]
  initialYear: number
  canManage: boolean
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

const LEAVE_COLORS: Record<LeaveType, string> = {
  ferias: 'bg-green-500/80 text-white',
  instalacao: 'bg-amber-500/80 text-white',
  dispensa: 'bg-sky-500/80 text-white',
}

function leaveTypeLabel(type: LeaveType): string {
  return t(`leaves.type.${type}`)
}

// ─── Modal de afastamentos do membro ────────────────────────────────────────

interface LeaveModalProps {
  member: FeriasProfile
  leaves: Leave[]
  onClose: () => void
  onChanged: () => void
  onError: (msg: string) => void
}

function LeaveModal({ member, leaves, onClose, onChanged, onError }: LeaveModalProps) {
  const [isSubmitting, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [type, setType] = useState<LeaveType>('ferias')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const memberLeaves = useMemo(
    () => leaves.filter((l) => l.profile_id === member.id),
    [leaves, member.id],
  )

  function resetForm() {
    setEditingId(null)
    setType('ferias')
    setStartDate('')
    setEndDate('')
    setDescription('')
  }

  function startEdit(leave: Leave) {
    setEditingId(leave.id)
    setType(leave.type)
    setStartDate(leave.start_date)
    setEndDate(leave.end_date)
    setDescription(leave.description ?? '')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = { profile_id: member.id, type, start_date: startDate, end_date: endDate, description }
    startTransition(async () => {
      const result = editingId ? await updateLeave(editingId, payload) : await createLeave(payload)
      if (!result.ok) {
        onError(result.message)
        return
      }
      resetForm()
      onChanged()
    })
  }

  function handleDelete(id: string) {
    if (!confirm(t('leaves.modal.delete_confirm'))) return
    startTransition(async () => {
      const result = await deleteLeave(id)
      if (!result.ok) {
        onError(result.message)
        return
      }
      if (editingId === id) resetForm()
      onChanged()
    })
  }

  const displayName = formatNomeCompleto(member.patente, member.nome_guerra ?? member.full_name) || member.email

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={`${t('leaves.modal.title')} — ${displayName}`}
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <p className="font-semibold text-sm text-foreground truncate max-w-[300px]">{displayName}</p>
            <p className="text-xs text-muted-foreground">{t('leaves.modal.title')}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-5 px-6 py-5 overflow-y-auto">
          {/* Períodos existentes */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-muted-foreground">{t('leaves.modal.existing')}</p>
            {memberLeaves.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('leaves.modal.empty')}</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {memberLeaves.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${LEAVE_COLORS[l.type]}`}>
                        {leaveTypeLabel(l.type)}
                      </span>
                      <span className="text-xs text-foreground truncate">
                        {formatDateBr(l.start_date)} – {formatDateBr(l.end_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(l)}
                        disabled={isSubmitting}
                        className="text-xs text-primary hover:underline disabled:opacity-50"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(l.id)}
                        disabled={isSubmitting}
                        className="text-xs text-destructive hover:underline disabled:opacity-50"
                      >
                        Excluir
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Formulário novo/edição */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 border-t border-border pt-4">
            <p className="text-sm font-semibold text-foreground">
              {editingId ? t('leaves.modal.existing') : t('leaves.modal.new_period')}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="leave-start" className="text-sm font-medium text-foreground">{t('leaves.modal.field_start')}</label>
                <input
                  id="leave-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="leave-end" className="text-sm font-medium text-foreground">{t('leaves.modal.field_end')}</label>
                <input
                  id="leave-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="leave-type" className="text-sm font-medium text-foreground">{t('leaves.modal.field_type')}</label>
              <select
                id="leave-type"
                value={type}
                onChange={(e) => setType(e.target.value as LeaveType)}
                disabled={isSubmitting}
                className="text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
              >
                {LEAVE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{leaveTypeLabel(opt)}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="leave-desc" className="text-sm font-medium text-foreground">{t('leaves.modal.field_description')}</label>
              <input
                id="leave-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                className="text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  Cancelar edição
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && (
                  <div className="h-3.5 w-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                )}
                {t('leaves.modal.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── Gantt anual ────────────────────────────────────────────────────────────

export default function FeriasView({ profiles, initialLeaves, initialYear, canManage }: FeriasViewProps) {
  const [year, setYear] = useState(initialYear)
  const [leaves, setLeaves] = useState<Leave[]>(initialLeaves)
  const [selected, setSelected] = useState<FeriasProfile | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const sortedProfiles = useMemo(() => sortByPatente(profiles), [profiles])

  function refetch(targetYear: number) {
    startTransition(async () => {
      const result = await getLeaves({ year: targetYear })
      if (result.ok) setLeaves(result.data)
      else setErrorMsg(result.message)
    })
  }

  function changeYear(delta: number) {
    const next = year + delta
    setYear(next)
    refetch(next)
  }

  return (
    <div className="flex flex-col gap-4">
      {selected && (
        <LeaveModal
          member={selected}
          leaves={leaves}
          onClose={() => setSelected(null)}
          onChanged={() => { setErrorMsg(null); refetch(year) }}
          onError={(msg) => setErrorMsg(msg)}
        />
      )}

      {/* Header com navegação de ano */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{t('leaves.panel_subtitle')}</p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => changeYear(-1)}
            aria-label="Ano anterior"
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-border text-foreground hover:bg-muted/50"
          >
            ‹
          </button>
          <span className="text-sm font-semibold text-foreground min-w-[60px] text-center tabular-nums">{year}</span>
          <button
            onClick={() => changeYear(1)}
            aria-label="Próximo ano"
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-border text-foreground hover:bg-muted/50"
          >
            ›
          </button>
        </div>
      </div>

      {errorMsg && (
        <div role="alert" className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-2.5 rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* Grade Gantt */}
      <div className="border border-border rounded-2xl overflow-auto">
        <div style={{ minWidth: 900 }}>
          {/* Header de meses */}
          <div className="flex border-b border-border bg-muted/50 sticky top-0 z-10">
            <div className="shrink-0 w-44 px-3 py-2 text-xs font-semibold text-muted-foreground border-r border-border">
              Colaborador
            </div>
            <div className="flex-1 grid grid-cols-12">
              {MONTHS.map((m) => (
                <div key={m} className="px-1 py-2 text-center text-[11px] font-semibold text-muted-foreground capitalize border-r border-border last:border-r-0">
                  {m}
                </div>
              ))}
            </div>
          </div>

          {/* Linhas por colaborador */}
          {sortedProfiles.map((p) => {
            const memberLeaves = leaves.filter((l) => l.profile_id === p.id)
            const displayName = formatNomeCompleto(p.patente, p.nome_guerra ?? p.full_name) || p.email
            return (
              <div key={p.id} className="flex border-b border-border last:border-0 hover:bg-muted/20">
                {/* Nome (clicável) */}
                <button
                  type="button"
                  onClick={() => canManage && setSelected(p)}
                  disabled={!canManage}
                  className="shrink-0 w-44 px-3 py-3 text-left text-sm font-medium text-foreground border-r border-border truncate enabled:hover:text-primary enabled:cursor-pointer disabled:cursor-default"
                  title={canManage ? 'Gerenciar afastamentos' : undefined}
                >
                  {displayName}
                </button>

                {/* Faixa de barras */}
                <div className="flex-1 relative grid grid-cols-12" style={{ minHeight: 44 }}>
                  {MONTHS.map((m) => (
                    <div key={m} className="border-r border-border/50 last:border-r-0" />
                  ))}
                  {memberLeaves.map((l) => {
                    const geo = leaveBarGeometry(l.start_date, l.end_date, year)
                    if (!geo) return null
                    return (
                      <span
                        key={l.id}
                        title={`${leaveTypeLabel(l.type)} • ${formatDateBr(l.start_date)} – ${formatDateBr(l.end_date)}`}
                        className={`absolute top-1/2 -translate-y-1/2 h-6 rounded-md text-[10px] font-semibold flex items-center px-1.5 overflow-hidden whitespace-nowrap ${LEAVE_COLORS[l.type]}`}
                        style={{ left: `${geo.leftPct}%`, width: `${geo.widthPct}%`, minWidth: 8 }}
                      >
                        {leaveTypeLabel(l.type)}
                      </span>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {sortedProfiles.length === 0 && (
            <p className="px-4 py-8 text-center text-muted-foreground text-sm">{t('leaves.empty_year')}</p>
          )}
        </div>
      </div>
    </div>
  )
}
