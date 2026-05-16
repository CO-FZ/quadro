'use client'

import { useOptimistic, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Profile, TaskStatus, TaskWithAssignees } from '@/lib/supabase/types'
import { KANBAN_COLUMNS } from '@/lib/supabase/types'
import TaskCard from '@/components/features/TaskCard'
import TaskModal from '@/components/features/TaskModal'
import { updateTaskStatus, createTask } from '@/lib/actions/tasks'
import { useToast } from '@/components/ui/ToastProvider'

interface KanbanBoardProps {
  tasks: TaskWithAssignees[]
  profiles: Pick<Profile, 'id' | 'email' | 'full_name' | 'avatar_url' | 'role'>[]
  currentUserId: string
  currentUserRole: string
}

type StatusOverride = { taskId: string; status: TaskStatus }

export default function KanbanBoard({ tasks, profiles, currentUserId, currentUserRole }: KanbanBoardProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const { toast } = useToast()
  const [showModal, setShowModal] = useState(false)
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [archivedOpen, setArchivedOpen] = useState(false)
  const [filterSector, setFilterSector] = useState<'all' | 'DT' | 'DA'>('all')
  const [filterAssignee, setFilterAssignee] = useState<string>('all')

  const canManage = currentUserRole === 'admin' || currentUserRole === 'coordenador'

  const [optimisticTasks, applyOptimistic] = useOptimistic(
    tasks,
    (state: TaskWithAssignees[], override: StatusOverride) =>
      state.map((t) => (t.id === override.taskId ? { ...t, status: override.status } : t))
  )

  const activeTasks = optimisticTasks.filter((t) => t.status !== 'arquivada')
  const archivedTasks = optimisticTasks.filter((t) => t.status === 'arquivada')

  function applyFilters(list: TaskWithAssignees[]) {
    return list
      .filter((t) => filterSector === 'all' || t.sector === filterSector)
      .filter(
        (t) =>
          filterAssignee === 'all' ||
          t.task_assignees.some((a) => a.user_id === filterAssignee)
      )
  }

  function getTasksByStatus(status: TaskStatus) {
    return applyFilters(activeTasks).filter((t) => t.status === status)
  }

  function handleDragStart(taskId: string) {
    setDraggingId(taskId)
  }

  function handleDragOver(e: React.DragEvent, status: TaskStatus) {
    e.preventDefault()
    setDragOverColumn(status)
  }

  function handleDrop(e: React.DragEvent, status: TaskStatus) {
    e.preventDefault()
    if (!draggingId) return
    const task = optimisticTasks.find((t) => t.id === draggingId)
    const movingId = draggingId
    setDraggingId(null)
    setDragOverColumn(null)
    if (!task || task.status === status) return

    startTransition(async () => {
      applyOptimistic({ taskId: movingId, status })
      const result = await updateTaskStatus(movingId, status)
      if (!result.ok) {
        toast(result.message ?? 'Erro ao mover tarefa.', 'error')
        router.refresh()
      } else {
        router.refresh()
      }
    })
  }

  function handleDragEnd() {
    setDraggingId(null)
    setDragOverColumn(null)
  }

  const columnColors: Record<string, string> = {
    backlog: 'border-muted-foreground/30',
    alocada: 'border-secondary',
    em_desenvolvimento: 'border-primary',
    finalizada: 'border-green-500',
  }

  const columnHeaderColors: Record<string, string> = {
    backlog: 'bg-muted text-muted-foreground',
    alocada: 'bg-secondary/20 text-foreground',
    em_desenvolvimento: 'bg-primary/10 text-primary',
    finalizada: 'bg-green-500/10 text-green-700 dark:text-green-400',
  }

  const activeColumns = KANBAN_COLUMNS.filter((c) => c.id !== 'arquivada')

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Atividades</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeTasks.length} tarefa{activeTasks.length !== 1 ? 's' : ''} ativa{activeTasks.length !== 1 ? 's' : ''}
            {archivedTasks.length > 0 && ` · ${archivedTasks.length} arquivada${archivedTasks.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtro setor */}
          <select
            id="filter-sector"
            value={filterSector}
            onChange={(e) => setFilterSector(e.target.value as typeof filterSector)}
            className="text-xs border border-border rounded-lg px-2.5 py-1.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">Todos os setores</option>
            <option value="DT">DT — Divisão Técnica</option>
            <option value="DA">DA — Divisão Administrativa</option>
          </select>

          {/* Filtro responsável */}
          <select
            id="filter-assignee"
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="text-xs border border-border rounded-lg px-2.5 py-1.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">Todos os responsáveis</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>{p.full_name ?? p.email}</option>
            ))}
          </select>

          <button
            id="btn-nova-tarefa"
            onClick={() => setShowModal(true)}
            className="hidden sm:flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium text-sm hover:bg-primary/90 transition-all duration-150 shadow-sm hover:shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nova Tarefa
          </button>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 min-h-0">
        {activeColumns.map((col) => {
          const colTasks = getTasksByStatus(col.id)
          const isOver = dragOverColumn === col.id

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              onDragLeave={() => setDragOverColumn(null)}
              className={`flex flex-col rounded-2xl border-2 transition-all duration-150 ${columnColors[col.id]} ${
                isOver ? 'ring-2 ring-primary/30 bg-primary/5' : 'bg-card'
              }`}
            >
              {/* Column Header */}
              <div className={`px-4 py-3 rounded-t-xl border-b border-border ${columnHeaderColors[col.id]}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{col.label}</span>
                  <span className="text-xs font-bold bg-background/60 px-2 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>
              </div>

              {/* Task Cards */}
              <div className="flex-1 p-3 flex flex-col gap-2 overflow-y-auto min-h-[200px] max-h-[calc(100vh-320px)]">
                {colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onDragStart={() => handleDragStart(task.id)}
                    onDragEnd={handleDragEnd}
                    profiles={profiles}
                    canManage={canManage}
                    currentUserId={currentUserId}
                    onRefresh={() => router.refresh()}
                  />
                ))}
                {colTasks.length === 0 && (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Nenhuma tarefa
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Seção de Tarefas Arquivadas */}
      {archivedTasks.length > 0 && (
        <div className="border border-border rounded-2xl overflow-hidden">
          <button
            id="btn-toggle-archived"
            onClick={() => setArchivedOpen((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3 bg-muted hover:bg-muted/80 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 text-muted-foreground">
                <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
              </svg>
              <span className="text-sm font-medium text-muted-foreground">
                Arquivadas ({archivedTasks.length})
              </span>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className={`size-4 text-muted-foreground transition-transform duration-200 ${archivedOpen ? 'rotate-180' : ''}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {archivedOpen && (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {archivedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onDragStart={() => {}}
                  onDragEnd={() => {}}
                  profiles={profiles}
                  canManage={canManage}
                  currentUserId={currentUserId}
                  onRefresh={() => router.refresh()}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* FAB flutuante (mobile) */}
      <button
        id="btn-nova-tarefa-fab"
        onClick={() => setShowModal(true)}
        aria-label="Nova tarefa"
        className="sm:hidden fixed bottom-6 left-6 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl active:scale-95 transition-all duration-150 flex items-center justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="size-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>

      {/* Modal de Criação */}
      {showModal && (
        <TaskModal
          profiles={profiles}
          onClose={() => setShowModal(false)}
          onSave={async (data) => {
            const result = await createTask(data)
            if (result.ok) {
              toast('Tarefa criada com sucesso!', 'success')
              router.refresh()
              setShowModal(false)
            } else {
              toast(result.message ?? 'Erro ao criar tarefa.', 'error')
            }
            return result
          }}
        />
      )}
    </div>
  )
}
