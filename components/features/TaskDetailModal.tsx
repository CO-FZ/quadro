'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import type { Profile, TaskWithAssignees } from '@/lib/supabase/types'
import { isOverdue } from '@/lib/utils/task-status'
import { updateTaskStatus, deleteTask, updateTaskAssignees, archiveTask, updateTask } from '@/lib/actions/tasks'
import { KANBAN_COLUMNS } from '@/lib/supabase/types'
import type { TaskStatus } from '@/lib/supabase/types'
import TaskModal from '@/components/features/TaskModal'
import { useToast } from '@/components/ui/ToastProvider'
import { formatNomeCompleto, formatDateBr, formatDateTimeBr } from '@/lib/utils/format'

interface TaskDetailModalProps {
  task: TaskWithAssignees
  profiles: Pick<Profile, 'id' | 'email' | 'full_name' | 'nome_guerra' | 'avatar_url' | 'role' | 'patente'>[]
  canManage: boolean
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

export default function TaskDetailModal({ task, profiles, canManage, onClose, onRefresh }: TaskDetailModalProps) {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const currentAssigneeIds = task.task_assignees.map((a) => a.user_id)
  const [assigneeIds, setAssigneeIds] = useState<string[]>(currentAssigneeIds)
  const [showEditModal, setShowEditModal] = useState(false)

  function withFeedback(fn: () => Promise<{ ok: boolean; message?: string }>, successMsg?: string) {
    startTransition(async () => {
      const result = await fn()
      if (!result.ok) {
        toast(result.message ?? 'Erro inesperado.', 'error')
      } else {
        if (successMsg) toast(successMsg, 'success')
        onRefresh()
      }
    })
  }

  function toggleAssignee(id: string) {
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function handleMoveStatus(status: TaskStatus) {
    withFeedback(() => updateTaskStatus(task.id, status), 'Status atualizado!')
  }

  function handleSaveAssignees() {
    withFeedback(() => updateTaskAssignees(task.id, assigneeIds), 'Responsáveis atualizados!')
  }

  function handleArchive() {
    if (!confirm('Arquivar esta tarefa? Ela ficará oculta do Kanban.')) return
    withFeedback(() => archiveTask(task.id), 'Tarefa arquivada!')
  }

  function handleDelete() {
    if (!confirm('Tem certeza que deseja excluir esta tarefa permanentemente?')) return
    withFeedback(() => deleteTask(task.id), 'Tarefa excluída.')
  }

  const overdue = isOverdue(task)

  // Se modal de edição estiver aberto, mostra ele no lugar
  if (showEditModal) {
    return (
      <TaskModal
        profiles={profiles}
        initialData={task}
        onClose={() => setShowEditModal(false)}
        onSave={async (data) => {
          const result = await updateTask(task.id, data)
          if (result.ok) {
            setShowEditModal(false)
            onRefresh()
          }
          return result
        }}
      />
    )
  }

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
                overdue
                  ? 'bg-destructive/10 text-destructive'
                  : task.status !== 'finalizada'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {task.status === 'finalizada' ? '✓ Concluída' : overdue ? '⚠ Atrasada' : '● No prazo'}
              </span>
            </div>
            <h2 className="text-base font-bold text-foreground">{task.title}</h2>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Botão Editar */}
            {canManage && (
              <button
                id="btn-edit-task"
                onClick={() => setShowEditModal(true)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title="Editar tarefa"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
              </button>
            )}
            {/* Botão Fechar */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
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
                {formatDateBr(task.start_date)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Entrega</p>
              <p className={`text-sm font-medium ${overdue ? 'text-destructive' : ''}`}>
                {formatDateBr(task.end_date)}
              </p>
            </div>
          </div>

          {/* Histórico — criada por */}
          {task.created_by && (() => {
            const creator = profiles.find((p) => p.id === task.created_by)
            const label = formatNomeCompleto(creator?.patente, creator?.nome_guerra ?? creator?.full_name) || creator?.email || 'usuário removido'
            return (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Criada por</span>
                {creator?.avatar_url ? (
                  <Image src={creator.avatar_url} alt={label} width={20} height={20} className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-[8px] font-bold text-primary-foreground">
                    {label[0]?.toUpperCase()}
                  </div>
                )}
                <span className="font-medium text-foreground">{label}</span>
                <span>em {formatDateTimeBr(task.created_at)}</span>
              </div>
            )
          })()}

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
                        <Image src={p.avatar_url} alt={p.full_name ?? p.email} width={24} height={24} className="h-6 w-6 rounded-full object-cover" />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-primary-foreground">
                          {(p.full_name ?? p.email)[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm truncate">{formatNomeCompleto(p.patente, p.nome_guerra ?? p.full_name) || p.email}</span>
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
                      <Image src={a.profiles.avatar_url} alt={a.profiles.full_name ?? a.profiles.email} width={20} height={20} className="h-5 w-5 rounded-full" />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-[8px] font-bold text-primary-foreground">
                        {(a.profiles?.full_name ?? a.profiles?.email)?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground">{formatNomeCompleto(a.profiles?.patente, a.profiles?.nome_guerra ?? a.profiles?.full_name) || a.profiles?.email}</span>
                  </div>
                ))}
                {task.task_assignees.length === 0 && (
                  <p className="text-xs text-muted-foreground">Nenhum responsável alocado.</p>
                )}
              </div>
            )}
          </div>

          {/* Mover status */}
          {canManage && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">Mover para</p>
              <div className="flex flex-wrap gap-2">
                {KANBAN_COLUMNS.filter((c) => c.id !== task.status && c.id !== ('arquivada' as TaskStatus)).map((col) => (
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

          {/* Ações destrutivas */}
          {canManage && (
            <div className="flex items-center justify-between pt-2 border-t border-border">
              {/* Arquivar — somente tarefas finalizadas */}
              {task.status === 'finalizada' && (
                <button
                  id="btn-archive-task"
                  onClick={handleArchive}
                  disabled={isPending}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                  </svg>
                  Arquivar
                </button>
              )}
              {task.status !== 'finalizada' && <span />}

              {/* Excluir */}
              <button
                id="btn-delete-task"
                onClick={handleDelete}
                disabled={isPending}
                className="text-xs text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
              >
                Excluir tarefa
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
