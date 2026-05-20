'use client'

import { memo, startTransition, useCallback, useMemo, useOptimistic, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Profile, TaskStatus, TaskWithAssignees } from '@/lib/supabase/types'
import { KANBAN_COLUMNS } from '@/lib/supabase/types'
import { formatNomeCompleto } from '@/lib/utils/format'
import TaskCard from '@/components/features/TaskCard'
import TaskModal from '@/components/features/TaskModal'
import { updateTaskStatus, createTask } from '@/lib/actions/tasks'
import { useToast } from '@/components/ui/ToastProvider'

interface KanbanBoardProps {
  tasks: TaskWithAssignees[]
  profiles: Pick<Profile, 'id' | 'email' | 'full_name' | 'nome_guerra' | 'avatar_url' | 'role' | 'patente'>[]
  currentUserId: string
  currentUserRole: string
}

type StatusOverride = { taskId: string; status: TaskStatus }

const COLUMN_COLORS: Record<string, string> = {
  backlog: 'border-muted-foreground/30',
  alocada: 'border-secondary',
  em_desenvolvimento: 'border-primary',
  em_revisao: 'border-violet-500',
  finalizada: 'border-green-500',
}

const COLUMN_HEADER_COLORS: Record<string, string> = {
  backlog: 'bg-muted text-muted-foreground',
  alocada: 'bg-secondary/20 text-foreground',
  em_desenvolvimento: 'bg-primary/10 text-primary',
  em_revisao: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
  finalizada: 'bg-green-500/10 text-green-700 dark:text-green-400',
}

// Estimated card height (px) + gap-2 (8px). Virtualizer adjusts as items are measured.
const CARD_ESTIMATE_PX = 130

const ACTIVE_COLUMNS = KANBAN_COLUMNS.filter((c) => c.id !== 'arquivada')

interface KanbanColumnProps {
  status: TaskStatus
  label: string
  colTasks: TaskWithAssignees[]
  isOver: boolean
  onColumnDragEnter: (status: TaskStatus) => void
  onColumnDrop: (status: TaskStatus) => void
  onColumnDragLeave: () => void
  onTaskDragStart: (taskId: string) => void
  onTaskDragEnd: () => void
  onTaskRefresh: () => void
  profiles: KanbanBoardProps['profiles']
  canManage: boolean
  currentUserId: string
}

const KanbanColumn = memo(function KanbanColumn({
  status,
  label,
  colTasks,
  isOver,
  onColumnDragEnter,
  onColumnDrop,
  onColumnDragLeave,
  onTaskDragStart,
  onTaskDragEnd,
  onTaskRefresh,
  profiles,
  canManage,
  currentUserId,
}: KanbanColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // status comes from ACTIVE_COLUMNS (module-level constant) — stable value.
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    onColumnDragEnter(status)
  }, [onColumnDragEnter, status])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    onColumnDrop(status)
  }, [onColumnDrop, status])

  const virtualizer = useVirtualizer({
    count: colTasks.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => CARD_ESTIMATE_PX,
    overscan: 4,
    paddingStart: 12,
    paddingEnd: 12,
    // measureElement reads actual rendered height (including paddingBottom gap),
    // so positions are recalculated after first paint and overlap is eliminated.
    measureElement: (el) => el.getBoundingClientRect().height,
  })

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={onColumnDragLeave}
      className={`flex flex-col rounded-2xl border-2 transition-all duration-150 ${COLUMN_COLORS[status]} ${
        isOver ? 'ring-2 ring-primary/30 bg-primary/5' : 'bg-card'
      }`}
    >
      {/* Column Header */}
      <div className={`px-4 py-3 rounded-t-xl border-b border-border ${COLUMN_HEADER_COLORS[status]}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">{label}</span>
          <span className="text-xs font-bold bg-background/60 px-2 py-0.5 rounded-full">
            {colTasks.length}
          </span>
        </div>
      </div>

      {/* Virtualized task list */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto min-h-[200px] max-h-[calc(100vh-320px)]"
      >
        {colTasks.length === 0 ? (
          <div className="flex items-center justify-center h-full py-4">
            <p className="text-xs text-muted-foreground text-center">Nenhuma tarefa</p>
          </div>
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const task = colTasks[virtualItem.index]
              return (
                <div
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                    padding: '0 12px 8px',
                  }}
                >
                  <TaskCard
                    task={task}
                    onDragStart={onTaskDragStart}
                    onDragEnd={onTaskDragEnd}
                    profiles={profiles}
                    canManage={canManage}
                    currentUserId={currentUserId}
                    onRefresh={onTaskRefresh}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
})

export default function KanbanBoard({ tasks, profiles, currentUserId, currentUserRole }: KanbanBoardProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
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

  const moveStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: StatusOverride) => {
      const result = await updateTaskStatus(taskId, status)
      if (!result.ok) throw new Error(result.message ?? 'Erro ao mover tarefa.')
      return result
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      router.refresh()
    },
    onError: (err) => {
      toast(err instanceof Error ? err.message : 'Erro ao mover tarefa.', 'error')
    },
  })

  const activeTasks = useMemo(
    () => optimisticTasks.filter((t) => t.status !== 'arquivada'),
    [optimisticTasks],
  )
  const archivedTasks = useMemo(
    () => optimisticTasks.filter((t) => t.status === 'arquivada'),
    [optimisticTasks],
  )

  const tasksByStatus = useMemo(() => {
    const map: Partial<Record<TaskStatus, TaskWithAssignees[]>> = {}
    for (const task of activeTasks) {
      const keep =
        (filterSector === 'all' || task.sector === filterSector) &&
        (filterAssignee === 'all' || task.task_assignees.some((a) => a.user_id === filterAssignee))
      if (!keep) continue
      const arr = map[task.status] ?? (map[task.status] = [])
      arr.push(task)
    }
    return map
  }, [activeTasks, filterSector, filterAssignee])

  const handleDragStart = useCallback((taskId: string) => {
    setDraggingId(taskId)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggingId(null)
    setDragOverColumn(null)
  }, [])

  const handleRefresh = useCallback(() => {
    router.refresh()
  }, [router])

  // Refs give handleColumnDrop a stable identity while always reading fresh values.
  const draggingIdRef = useRef(draggingId)
  draggingIdRef.current = draggingId
  const optimisticTasksRef = useRef(optimisticTasks)
  optimisticTasksRef.current = optimisticTasks

  const handleColumnDragEnter = useCallback((status: TaskStatus) => {
    setDragOverColumn(status)
  }, [])

  const handleColumnDragLeave = useCallback(() => {
    setDragOverColumn(null)
  }, [])

  const handleColumnDrop = useCallback((status: TaskStatus) => {
    const movingId = draggingIdRef.current
    if (!movingId) return
    const task = optimisticTasksRef.current.find((t) => t.id === movingId)
    setDraggingId(null)
    setDragOverColumn(null)
    if (!task || task.status === status) return

    startTransition(async () => {
      applyOptimistic({ taskId: movingId, status })
      try {
        await moveStatusMutation.mutateAsync({ taskId: movingId, status })
      } catch {
        // Erro tratado em onError do useMutation; rollback otimista ocorre ao fim da transição.
      }
    })
  }, [applyOptimistic, moveStatusMutation])

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
              <option key={p.id} value={p.id}>{formatNomeCompleto(p.patente, p.nome_guerra ?? p.full_name) || p.email}</option>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 flex-1 min-h-0">
        {ACTIVE_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            status={col.id}
            label={col.label}
            colTasks={tasksByStatus[col.id] ?? []}
            isOver={dragOverColumn === col.id}
            onColumnDragEnter={handleColumnDragEnter}
            onColumnDrop={handleColumnDrop}
            onColumnDragLeave={handleColumnDragLeave}
            onTaskDragStart={handleDragStart}
            onTaskDragEnd={handleDragEnd}
            onTaskRefresh={handleRefresh}
            profiles={profiles}
            canManage={canManage}
            currentUserId={currentUserId}
          />
        ))}
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
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  profiles={profiles}
                  canManage={canManage}
                  currentUserId={currentUserId}
                  onRefresh={handleRefresh}
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
            const result = await createTask({
              ...data,
              is_servico: data.is_servico,
            })
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
