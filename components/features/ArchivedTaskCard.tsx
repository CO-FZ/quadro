'use client'

import type { TaskWithAssignees } from '@/lib/supabase/types'

interface ArchivedTaskCardProps {
  task: TaskWithAssignees
  sectorLabel: string
  assigneeLabel: string
  onOpen: () => void
}

function formatBR(iso: string | null | undefined): string {
  if (!iso) return '—'
  const datePart = iso.length >= 10 ? iso.slice(0, 10) : iso
  const [y, m, d] = datePart.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

export default function ArchivedTaskCard({ task, sectorLabel, assigneeLabel, onOpen }: ArchivedTaskCardProps) {
  const isArquivada = task.status === 'arquivada'

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left bg-card border border-border rounded-xl px-4 py-3 hover:border-primary/40 hover:shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/30"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              task.sector === 'DT' ? 'bg-primary/10 text-primary' : 'bg-secondary/20 text-secondary-foreground'
            }`}>
              {task.sector}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              isArquivada
                ? 'bg-muted text-muted-foreground'
                : 'bg-green-500/10 text-green-700 dark:text-green-400'
            }`}>
              {isArquivada ? '📦 Arquivada' : '✓ Finalizada'}
            </span>
            {task.is_servico && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-400">
                Serviço
              </span>
            )}
            <span className="text-[10px] text-muted-foreground ml-auto" title="Última atualização">
              {formatBR(task.updated_at)}
            </span>
          </div>

          <p className="text-sm font-semibold text-foreground line-clamp-1">
            {task.title}
          </p>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
            <span title="Divisão">{sectorLabel}</span>
            <span aria-hidden="true">•</span>
            <span title="Período">
              {formatBR(task.start_date)} → {formatBR(task.end_date)}
            </span>
            <span aria-hidden="true">•</span>
            <span title="Responsáveis">{assigneeLabel}</span>
          </div>
        </div>
      </div>
    </button>
  )
}
