'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Profile, TaskStatus, TaskWithAssignees } from '@/lib/supabase/types'
import { KANBAN_COLUMNS } from '@/lib/supabase/types'
import TaskCard from '@/components/features/TaskCard'
import TaskModal from '@/components/features/TaskModal'
import { updateTaskStatus, createTask } from '@/lib/actions/tasks'

interface KanbanBoardProps {
  tasks: TaskWithAssignees[]
  profiles: Pick<Profile, 'id' | 'email' | 'avatar_url' | 'role'>[]
  currentUserRole: string
}

export default function KanbanBoard({ tasks, profiles, currentUserRole }: KanbanBoardProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [showModal, setShowModal] = useState(false)
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const canManage = currentUserRole === 'admin' || currentUserRole === 'coordenador'

  function getTasksByStatus(status: TaskStatus) {
    return tasks.filter((t) => t.status === status)
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
    const task = tasks.find((t) => t.id === draggingId)
    if (!task || task.status === status) {
      setDraggingId(null)
      setDragOverColumn(null)
      return
    }
    startTransition(async () => {
      await updateTaskStatus(draggingId, status)
      router.refresh()
    })
    setDraggingId(null)
    setDragOverColumn(null)
  }

  function handleDragEnd() {
    setDraggingId(null)
    setDragOverColumn(null)
  }

  const columnColors: Record<TaskStatus, string> = {
    backlog: 'border-muted-foreground/30',
    alocada: 'border-secondary',
    em_desenvolvimento: 'border-primary',
    finalizada: 'border-green-500',
  }

  const columnHeaderColors: Record<TaskStatus, string> = {
    backlog: 'bg-muted text-muted-foreground',
    alocada: 'bg-secondary/20 text-secondary-foreground',
    em_desenvolvimento: 'bg-primary/10 text-primary',
    finalizada: 'bg-green-50 text-green-700',
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Quadro de Atividades</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {tasks.length} tarefa{tasks.length !== 1 ? 's' : ''} no total
          </p>
        </div>
        {canManage && (
          <button
            id="btn-nova-tarefa"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium text-sm hover:bg-primary/90 transition-all duration-150 shadow-sm hover:shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nova Tarefa
          </button>
        )}
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 min-h-0">
        {KANBAN_COLUMNS.map((col) => {
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
              <div className="flex-1 p-3 flex flex-col gap-2 overflow-y-auto min-h-[200px] max-h-[calc(100vh-280px)]">
                {colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onDragStart={() => handleDragStart(task.id)}
                    onDragEnd={handleDragEnd}
                    profiles={profiles}
                    canManage={canManage}
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

      {/* Modal de Criação */}
      {showModal && (
        <TaskModal
          profiles={profiles}
          onClose={() => setShowModal(false)}
          onSave={async (data) => {
            await createTask(data)
            router.refresh()
            setShowModal(false)
          }}
        />
      )}
    </div>
  )
}
