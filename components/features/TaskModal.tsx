'use client'

import { useState, useTransition } from 'react'
import type { Profile, TaskSector, TaskWithAssignees } from '@/lib/supabase/types'
import { validateTaskDates } from '@/lib/utils/task-dates'

interface TaskFormData {
  title: string
  description: string
  start_date: string
  end_date: string
  sector: TaskSector
  drive_url: string
  assignee_ids: string[]
}

interface TaskModalProps {
  profiles: Pick<Profile, 'id' | 'email' | 'avatar_url' | 'role'>[]
  /** Se fornecido, abre no modo edição com os dados pré-preenchidos */
  initialData?: TaskWithAssignees
  onClose: () => void
  onSave: (data: TaskFormData) => Promise<{ ok: boolean; message?: string } | void>
}

const DRIVE_ICON = (
  <svg viewBox="0 0 87.3 78" className="h-4 w-4" aria-hidden="true">
    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
    <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
  </svg>
)

export default function TaskModal({ profiles, initialData, onClose, onSave }: TaskModalProps) {
  const isEdit = !!initialData
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<Omit<TaskFormData, 'assignee_ids'>>({
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    start_date: initialData?.start_date ?? new Date().toISOString().split('T')[0],
    end_date: initialData?.end_date ?? '',
    sector: initialData?.sector ?? 'DT',
    drive_url: initialData?.drive_url ?? '',
  })
  const [assigneeIds, setAssigneeIds] = useState<string[]>(
    initialData?.task_assignees.map((a) => a.user_id) ?? []
  )
  const [error, setError] = useState<string | null>(null)

  function toggleAssignee(id: string) {
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setError('O título é obrigatório.'); return }
    const datesValidation = validateTaskDates(form.start_date, form.end_date)
    if (!datesValidation.ok) { setError(datesValidation.message); return }
    setError(null)
    startTransition(async () => {
      const result = await onSave({ ...form, assignee_ids: assigneeIds })
      if (result && !result.ok) {
        setError(result.message ?? 'Erro ao salvar.')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-bold text-foreground">
            {isEdit ? 'Editar Tarefa' : 'Nova Tarefa'}
          </h2>
          <button
            id="btn-close-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-2 rounded-lg">
              {error}
            </div>
          )}

          {/* Título */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="task-title">
              Título <span className="text-destructive">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ex: Elaborar relatório mensal"
              className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>

          {/* Descrição */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="task-desc">
              Descrição
            </label>
            <textarea
              id="task-desc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Descreva os detalhes da tarefa..."
              rows={3}
              className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all resize-none"
            />
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="task-start">
                Início <span className="text-destructive">*</span>
              </label>
              <input
                id="task-start"
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="task-end">
                Entrega <span className="text-destructive">*</span>
              </label>
              <input
                id="task-end"
                type="date"
                value={form.end_date}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>
          </div>

          {/* Setor */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Setor</label>
            <div className="flex gap-2">
              {(['DT', 'DA'] as TaskSector[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, sector: s }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                    form.sector === s
                      ? s === 'DT'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary text-secondary-foreground border-secondary'
                      : 'bg-background text-muted-foreground border-border hover:border-primary/40'
                  }`}
                >
                  {s === 'DT' ? 'Divisão Técnica' : 'Divisão Administrativa'}
                </button>
              ))}
            </div>
          </div>

          {/* Drive URL */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="task-drive">
              Link Google Drive (evidência)
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                {DRIVE_ICON}
              </div>
              <input
                id="task-drive"
                type="url"
                value={form.drive_url}
                onChange={(e) => setForm((f) => ({ ...f, drive_url: e.target.value }))}
                placeholder="https://drive.google.com/..."
                className="w-full border border-input rounded-lg pl-9 pr-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>
          </div>

          {/* Responsáveis */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Responsáveis</label>
            <div className="border border-border rounded-xl overflow-hidden max-h-36 overflow-y-auto">
              {profiles.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-muted transition-colors cursor-pointer border-b border-border last:border-0"
                >
                  <input
                    type="checkbox"
                    checked={assigneeIds.includes(p.id)}
                    onChange={() => toggleAssignee(p.id)}
                    className="accent-primary"
                  />
                  {p.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.avatar_url} alt={p.email} className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-primary-foreground">
                      {p.email[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-foreground truncate">{p.email}</span>
                  <span className="ml-auto text-xs text-muted-foreground capitalize">{p.role}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              id="btn-cancel-task"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-save-task"
              disabled={isPending}
              className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {isPending ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
