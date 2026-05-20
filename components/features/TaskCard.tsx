'use client'

import { memo, useState } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import type { Profile, TaskWithAssignees } from '@/lib/supabase/types'
import { isOverdue } from '@/lib/utils/task-status'
import { formatDateBr } from '@/lib/utils/format'

const TaskDetailModal = dynamic(() => import('@/components/features/TaskDetailModal'), { ssr: false, loading: () => null })

interface TaskCardProps {
  task: TaskWithAssignees
  onDragStart: (taskId: string) => void
  onDragEnd: () => void
  profiles: Pick<Profile, 'id' | 'email' | 'full_name' | 'nome_guerra' | 'avatar_url' | 'role' | 'patente'>[]
  canManage: boolean
  currentUserId: string
  onRefresh: () => void
}

const DRIVE_ICON = (
  <svg viewBox="0 0 87.3 78" className="h-4 w-4 shrink-0" aria-label="Google Drive">
    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
    <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
  </svg>
)

function UserAvatars({ assignees }: { assignees: TaskWithAssignees['task_assignees'] }) {
  if (!assignees || assignees.length === 0) return null
  const shown = assignees.slice(0, 3)
  const remaining = assignees.length - 3

  return (
    <div className="flex -space-x-2">
      {shown.map((a) => (
        <div key={a.user_id} title={a.profiles?.full_name ?? a.profiles?.email} className="relative">
          {a.profiles?.avatar_url ? (
            <Image
              src={a.profiles.avatar_url}
              alt={a.profiles.full_name ?? a.profiles.email}
              width={24}
              height={24}
              className="h-6 w-6 rounded-full border-2 border-card object-cover"
            />
          ) : (
            <div className="h-6 w-6 rounded-full border-2 border-card bg-primary flex items-center justify-center text-[9px] font-bold text-primary-foreground">
              {(a.profiles?.full_name ?? a.profiles?.email)?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
        </div>
      ))}
      {remaining > 0 && (
        <div className="h-6 w-6 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[9px] font-medium text-muted-foreground">
          +{remaining}
        </div>
      )}
    </div>
  )
}

const TaskCard = memo(function TaskCard({ task, onDragStart, onDragEnd, profiles, canManage, currentUserId, onRefresh }: TaskCardProps) {
  const [showDetail, setShowDetail] = useState(false)
  const overdue = isOverdue(task)
  const isAssignee = task.task_assignees.some((a) => a.user_id === currentUserId)
  const canDrag = canManage || isAssignee

  return (
    <>
      <div
        draggable={canDrag}
        onDragStart={() => onDragStart(task.id)}
        onDragEnd={onDragEnd}
        onClick={() => setShowDetail(true)}
        className={`group bg-background border border-border rounded-xl p-3 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200 ease-out select-none ${canDrag ? 'active:scale-[0.98]' : ''}`}
      >
        {/* Badges de topo */}
        <div className="flex items-center gap-1.5 mb-2">
          {/* Badge setor */}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            task.sector === 'DT'
              ? 'bg-primary/10 text-primary'
              : 'bg-secondary/20 text-secondary-foreground'
          }`}>
            {task.sector}
          </span>

          {/* Badge prazo */}
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ml-auto ${
            overdue
              ? 'bg-destructive/10 text-destructive'
              : task.status !== 'finalizada' ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-muted text-muted-foreground'
          }`}>
            {task.status === 'finalizada' ? '✓ Concluída' : overdue ? '⚠ Atrasada' : '● No prazo'}
          </span>
        </div>

        {/* Título */}
        <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug mb-3">
          {task.title}
        </p>

        {/* Rodapé */}
        <div className="flex items-center justify-between gap-2">
          <UserAvatars assignees={task.task_assignees} />

          {task.drive_url && (
            <a
              href={task.drive_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="Abrir no Google Drive"
              className="ml-auto p-1 rounded-lg hover:bg-muted transition-colors"
            >
              {DRIVE_ICON}
            </a>
          )}
        </div>

        {/* Data de entrega */}
        <p className="text-[10px] text-muted-foreground mt-2">
          Entrega: {formatDateBr(task.end_date)}
        </p>
      </div>

      {showDetail && (
        <TaskDetailModal
          task={task}
          profiles={profiles}
          canManage={canManage}
          onClose={() => setShowDetail(false)}
          onRefresh={() => { setShowDetail(false); onRefresh() }}
        />
      )}
    </>
  )
})

export default TaskCard
