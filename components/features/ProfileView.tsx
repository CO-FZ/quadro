'use client'

import type { Profile, TaskWithAssignees, TaskStatus } from '@/lib/supabase/types'
import { SECTOR_LABELS } from '@/lib/supabase/types'

interface ProfileViewProps {
  profile: Profile | null
  tasks: TaskWithAssignees[]
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  alocada: 'Alocada',
  em_desenvolvimento: 'Em Desenvolvimento',
  finalizada: 'Finalizada',
  arquivada: 'Arquivada',
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  backlog: 'bg-muted text-muted-foreground border-muted-foreground/20',
  alocada: 'bg-secondary/20 text-secondary-foreground border-secondary/30',
  em_desenvolvimento: 'bg-primary/10 text-primary border-primary/20',
  finalizada: 'bg-green-50 text-green-700 border-green-200',
  arquivada: 'bg-muted text-muted-foreground border-border',
}

function getInitial(profile: Profile | null): string {
  if (profile?.full_name) return profile.full_name[0].toUpperCase()
  if (profile?.email) return profile.email[0].toUpperCase()
  return '?'
}

function isOverdue(task: TaskWithAssignees): boolean {
  return task.status !== 'finalizada' && new Date(task.end_date) < new Date()
}

export default function ProfileView({ profile, tasks }: ProfileViewProps) {
  const total = tasks.length
  const done = tasks.filter((t) => t.status === 'finalizada').length
  const inProgress = tasks.filter((t) => t.status === 'em_desenvolvimento').length
  const overdue = tasks.filter(isOverdue).length

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
      {/* Profile Card */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {/* Cover */}
        <div className="h-24 bg-linear-to-r from-primary/30 via-primary/10 to-transparent" />

        <div className="px-6 pb-6 -mt-10 flex flex-col sm:flex-row sm:items-end gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.full_name ?? profile.email}
                className="h-20 w-20 rounded-2xl object-cover border-4 border-card shadow-md"
              />
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground border-4 border-card shadow-md">
                {getInitial(profile)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 pt-2 sm:pt-0">
            <h1 className="text-xl font-bold text-foreground truncate">
              {profile?.full_name ?? profile?.email ?? 'Usuário'}
            </h1>
            {profile?.full_name && (
              <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
            )}
            <span className="inline-block mt-1 text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
              {profile?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: total, color: 'text-foreground' },
          { label: 'Em andamento', value: inProgress, color: 'text-primary' },
          { label: 'Concluídas', value: done, color: 'text-green-600' },
          { label: 'Atrasadas', value: overdue, color: overdue > 0 ? 'text-destructive' : 'text-muted-foreground' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1 shadow-sm"
          >
            <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Task List */}
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-foreground">Minhas Tarefas</h2>

        {tasks.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center gap-3 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="size-12 text-muted-foreground/40">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
            </svg>
            <p className="text-muted-foreground text-sm">Nenhuma tarefa alocada a você no momento.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {tasks.map((task) => {
              const overdueMark = isOverdue(task)
              return (
                <div
                  key={task.id}
                  className="bg-card border border-border rounded-xl px-4 py-3 flex items-start justify-between gap-3 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[task.status]}`}>
                        {STATUS_LABELS[task.status]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {SECTOR_LABELS[task.sector]}
                      </span>
                      {overdueMark && (
                        <span className="text-xs font-semibold text-destructive">⚠ Atrasada</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">Entrega</p>
                    <p className={`text-xs font-medium ${overdueMark ? 'text-destructive' : 'text-foreground'}`}>
                      {new Date(task.end_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </p>
                    {task.drive_url && (
                      <a
                        href={task.drive_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-primary hover:underline mt-1 inline-block"
                      >
                        Drive →
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
