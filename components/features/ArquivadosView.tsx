'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Profile, TaskWithAssignees } from '@/lib/supabase/types'
import { SECTOR_LABELS } from '@/src/modules/task-board/domain/entities'
import { buildTaskHaystack, matchesSearch } from '@/lib/utils/task-search'
import { formatNomeCompleto } from '@/lib/utils/format'
import ArchivedTaskCard from '@/components/features/ArchivedTaskCard'
import TaskDetailModal from '@/components/features/TaskDetailModal'

interface ArquivadosViewProps {
  initialTasks: TaskWithAssignees[]
  profiles: Pick<Profile, 'id' | 'email' | 'full_name' | 'nome_guerra' | 'avatar_url' | 'role' | 'patente'>[]
  currentUserRole: string
}

export default function ArquivadosView({ initialTasks, profiles, currentUserRole }: ArquivadosViewProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [selected, setSelected] = useState<TaskWithAssignees | null>(null)

  const canManage = currentUserRole === 'admin' || currentUserRole === 'coordenador'

  const indexed = useMemo(
    () => initialTasks.map((t) => ({ task: t, haystack: buildTaskHaystack(t) })),
    [initialTasks],
  )

  const filtered = useMemo(
    () => indexed.filter(({ haystack }) => matchesSearch(haystack, deferredSearch)),
    [indexed, deferredSearch],
  )

  const finalizadasCount = filtered.filter((x) => x.task.status === 'finalizada').length
  const arquivadasCount = filtered.filter((x) => x.task.status === 'arquivada').length

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Arquivados</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Histórico consultável de tarefas finalizadas e arquivadas — ordem cronológica decrescente.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <label htmlFor="search-arquivados" className="sr-only">Buscar tarefas arquivadas</label>
          <div className="relative flex-1 min-w-[240px] max-w-xl">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              id="search-arquivados"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título, descrição, data, divisão, responsável…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <span className="text-xs text-muted-foreground">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
            {filtered.length > 0 && (
              <> · {finalizadasCount} finalizada{finalizadasCount !== 1 ? 's' : ''} · {arquivadasCount} arquivada{arquivadasCount !== 1 ? 's' : ''}</>
            )}
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState hasSearch={deferredSearch.trim().length > 0} />
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map(({ task }) => (
            <li key={task.id}>
              <ArchivedTaskCard
                task={task}
                sectorLabel={SECTOR_LABELS[task.sector]}
                assigneeLabel={summarizeAssignees(task)}
                onOpen={() => setSelected(task)}
              />
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <TaskDetailModal
          task={selected}
          profiles={profiles}
          canManage={canManage}
          onClose={() => setSelected(null)}
          onRefresh={() => {
            setSelected(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

function summarizeAssignees(task: TaskWithAssignees): string {
  const names = (task.task_assignees ?? [])
    .map((a) => formatNomeCompleto(a.profiles?.patente, a.profiles?.nome_guerra ?? a.profiles?.full_name) || a.profiles?.email || '')
    .filter(Boolean)
  if (names.length === 0) return 'Sem responsável'
  if (names.length === 1) return names[0]
  return `${names[0]} +${names.length - 1}`
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-10 mb-3 opacity-60">
        <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
      </svg>
      <p className="text-sm font-medium">
        {hasSearch ? 'Nenhuma tarefa corresponde à busca.' : 'Nenhuma tarefa arquivada ou finalizada ainda.'}
      </p>
      {!hasSearch && (
        <p className="text-xs mt-1">
          Tarefas concluídas e arquivadas aparecerão aqui automaticamente.
        </p>
      )}
    </div>
  )
}
