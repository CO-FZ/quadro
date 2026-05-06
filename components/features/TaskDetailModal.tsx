'use client'

import { useState, useTransition } from 'react'
import type { Profile, TaskWithAssignees } from '@/lib/supabase/types'
import { updateTaskStatus, deleteTask, updateTaskAssignees } from '@/lib/actions/tasks'

interface TaskDetailModalProps {
  task: TaskWithAssignees
  profiles: Pick<Profile, 'id' | 'email' | 'avatar_url' | 'role'>[]
  canManage: boolean
  currentUserId: string
  onClose: () => void
  onRefresh: () => void
}

const DRIVE_ICON = (
  <svg viewBox="0 0 87.3 78" className="h-5 w-5 shrink-0" aria-label="Google Drive">
    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
    <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
  </svg>
)

import { KANBAN_COLUMNS } from '@/lib/supabase/types'
import type { TaskStatus } from '@/lib/supabase/types'

export default function TaskDetailModal({ task, profiles, canManage, currentUserId, onClose, onRefresh }: TaskDetailModalProps) {
  const [isPending, startTransition] = useTransition()
  const currentAssigneeIds = task.task_assignees.map((a) => a.user_id)
  const [assigneeIds, setAssigneeIds] = useState<string[]>(currentAssigneeIds)

  function toggleAssignee(id: string) {
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function handleMoveStatus(status: TaskStatus) {
    startTransition(async () => {
      await updateTaskStatus(task.id, status)
      onRefresh()
    })
  }

  function handleSaveAssignees() {
    startTransition(async () => {
      await updateTaskAssignees(task.id, assigneeIds)
      onRefresh()
    })
  }

  function handleDelete() {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return
    startTransition(async () => {
      await deleteTask(task.id)
      onRefresh()
    })
  }

  const isOverdue = task.status !== 'finalizada' && new Date(task.end_date) < new Date()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-border gap-3">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                task.sector === 'DT'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-secondary/20 text-secondary-foreground'
              }`}>
                {task.sector}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isOverdue
                  ? 'bg-destructive/10 text-destructive'
                  : task.status !== 'finalizada'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {task.status === 'finalizada' ? '✓ Concluída' : isOverdue ? '⚠ Atrasada' : '● No prazo'}
              </span>
            </div>
            <h2 className="text-base font-bold text-foreground">{task.title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Descrição */}
          {task.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>
          )}

          {/* Datas */}
          <div className="flex gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Início</p>
              <p className="text-sm font-medium">
                {new Date(task.start_date + 'T00:00:00').toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Entrega</p>
              <p className={`text-sm font-medium ${isOverdue ? 'text-destructive' : ''}`}>
                {new Date(task.end_date + 'T00:00:00').toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Google Drive */}
          {task.drive_url && (
            <a
              href={task.drive_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              {DRIVE_ICON}
              Abrir evidência no Google Drive
            </a>
          )}

          {/* Responsáveis */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">Responsáveis</p>
            {canManage ? (
              <>
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
                      <span className="text-sm truncate">{p.email}</span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={handleSaveAssignees}
                  disabled={isPending}
                  className="self-end text-xs font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Salvando...' : 'Salvar responsáveis'}
                </button>
              </>
            ) : (
              <div className="flex flex-wrap gap-2">
                {task.task_assignees.map((a) => (
                  <div key={a.user_id} className="flex items-center gap-1.5 bg-muted rounded-full px-2 py-1">
                    {a.profiles?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.profiles.avatar_url} alt={a.profiles.email} className="h-5 w-5 rounded-full" />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-[8px] font-bold text-primary-foreground">
                        {a.profiles?.email?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground">{a.profiles?.email}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mover status */}
          {canManage && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">Mover para</p>
              <div className="flex flex-wrap gap-2">
                {KANBAN_COLUMNS.filter((c) => c.id !== task.status).map((col) => (
                  <button
                    key={col.id}
                    onClick={() => handleMoveStatus(col.id)}
                    disabled={isPending}
                    className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    → {col.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Excluir */}
          {canManage && (
            <button
              id="btn-delete-task"
              onClick={handleDelete}
              disabled={isPending}
              className="self-start text-xs text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
            >
              Excluir tarefa
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
