'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import type { Profile, TaskWithAssignees } from '@/lib/supabase/types'
import { formatDateBr, formatNomeCompleto } from '@/lib/utils/format'

const TaskDetailModal = dynamic(() => import('@/components/features/TaskDetailModal'), {
  ssr: false,
  loading: () => null,
})

interface HistoricoViewProps {
  tasks: TaskWithAssignees[]
  profiles: Pick<Profile, 'id' | 'email' | 'full_name' | 'nome_guerra' | 'avatar_url' | 'role' | 'patente'>[]
  query: string
  currentPage: number
  totalPages: number
  totalCount: number
  currentUserRole: string
}

function UserAvatars({ assignees }: { assignees: TaskWithAssignees['task_assignees'] }) {
  if (!assignees || assignees.length === 0) return <span className="text-xs text-muted-foreground">-</span>
  
  const shown = assignees.slice(0, 3)
  const remaining = assignees.length - 3

  return (
    <div className="flex -space-x-1.5 items-center">
      {shown.map((a) => (
        <div 
          key={a.user_id} 
          title={formatNomeCompleto(a.profiles?.patente, a.profiles?.nome_guerra ?? a.profiles?.full_name) || a.profiles?.email} 
          className="relative shrink-0"
        >
          {a.profiles?.avatar_url ? (
            <Image
              src={a.profiles.avatar_url}
              alt={a.profiles.full_name ?? a.profiles.email}
              width={24}
              height={24}
              className="h-6 w-6 rounded-full border border-card object-cover"
            />
          ) : (
            <div className="h-6 w-6 rounded-full border border-card bg-primary flex items-center justify-center text-[9px] font-bold text-primary-foreground">
              {(a.profiles?.nome_guerra ?? a.profiles?.full_name ?? a.profiles?.email)?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
        </div>
      ))}
      {remaining > 0 && (
        <div className="h-6 w-6 rounded-full border border-card bg-muted flex items-center justify-center text-[9px] font-medium text-muted-foreground shrink-0">
          +{remaining}
        </div>
      )}
      <span className="text-xs text-muted-foreground ml-2 hidden lg:inline-block truncate max-w-[150px]">
        {shown.map(a => a.profiles?.nome_guerra ?? a.profiles?.full_name ?? a.profiles?.email?.split('@')[0]).join(', ')}
        {remaining > 0 ? ` e mais ${remaining}` : ''}
      </span>
    </div>
  )
}

export default function HistoricoView({
  tasks,
  profiles,
  query,
  currentPage,
  totalPages,
  totalCount,
  currentUserRole,
}: HistoricoViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [isPending, startTransition] = useTransition()
  const [inputValue, setInputValue] = useState(query)
  const [selectedTask, setSelectedTask] = useState<TaskWithAssignees | null>(null)

  const canFinalize = currentUserRole === 'admin' || currentUserRole === 'coordenador'

  const [prevQuery, setPrevQuery] = useState(query)
  if (query !== prevQuery) {
    setPrevQuery(query)
    setInputValue(query)
  }

  const updateSearch = useCallback(
    (term: string) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString())
        if (term) {
          params.set('q', term)
        } else {
          params.delete('q')
        }
        params.set('page', '1') // Reinicia na primeira página ao pesquisar
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [router, pathname, searchParams]
  )

  useEffect(() => {
    const handler = setTimeout(() => {
      if (inputValue !== query) {
        updateSearch(inputValue)
      }
    }, 400) // Debounce para evitar sobrecarga no banco de dados

    return () => clearTimeout(handler)
  }, [inputValue, query, updateSearch])

  const goToPage = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) return
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', String(pageNumber))
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const handleRefresh = () => {
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* Header e Barra de Pesquisa */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Histórico de Tarefas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalCount} tarefa{totalCount !== 1 ? 's' : ''} concluída{totalCount !== 1 ? 's' : ''} ou arquivada{totalCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Caixa de Busca */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            id="search-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Pesquisar no histórico..."
            className="w-full text-sm pl-9 pr-8 py-2 border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {isPending ? (
              <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.636Z" />
              </svg>
            )}
          </div>
          {inputValue && (
            <button
              onClick={() => setInputValue('')}
              aria-label="Limpar busca"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Tabela de Tarefas */}
      <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-3.5 text-left">Título</th>
                <th className="px-6 py-3.5 text-left">Setor</th>
                <th className="px-6 py-3.5 text-left">Status</th>
                <th className="px-6 py-3.5 text-left">Entrega</th>
                <th className="px-6 py-3.5 text-left">Responsáveis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8 text-muted-foreground">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                      </svg>
                      <p className="text-sm font-medium text-foreground">Nenhuma tarefa encontrada</p>
                      <p className="text-xs text-muted-foreground">Tente buscar por outro termo ou ajuste os filtros.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr 
                    key={task.id} 
                    onClick={() => setSelectedTask(task)}
                    className="hover:bg-muted/40 transition-colors cursor-pointer text-sm"
                  >
                    {/* Título */}
                    <td className="px-6 py-4 font-medium text-foreground">
                      <div className="flex flex-col gap-1 max-w-md">
                        <span className="line-clamp-2 leading-snug">{task.title}</span>
                        {task.is_servico && (
                          <span className="w-fit text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            Serviço
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Setor */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        task.sector === 'DT' 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-secondary/20 text-secondary-foreground'
                      }`}>
                        {task.sector}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        task.status === 'finalizada' 
                          ? 'bg-green-500/10 text-green-700 dark:text-green-400' 
                          : 'bg-muted text-muted-foreground border border-border'
                      }`}>
                        {task.status === 'finalizada' ? 'Finalizada' : 'Arquivada'}
                      </span>
                    </td>

                    {/* Data de Entrega */}
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground text-xs">
                      {formatDateBr(task.end_date)}
                    </td>

                    {/* Responsáveis */}
                    <td className="px-6 py-4">
                      <UserAvatars assignees={task.task_assignees} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginação Centralizada na Parte Inferior */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {/* Botão Anterior */}
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1 || isPending}
            className="flex items-center justify-center p-2 rounded-xl border border-border bg-card text-foreground hover:bg-muted disabled:opacity-50 disabled:pointer-events-none transition-colors"
            aria-label="Página anterior"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="size-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>

          {/* Números das Páginas */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1
              const isCurrent = pageNum === currentPage
              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  disabled={isPending}
                  className={`min-w-9 h-9 flex items-center justify-center text-xs font-semibold rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-card text-foreground border-border hover:bg-muted'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>

          {/* Botão Próximo */}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages || isPending}
            className="flex items-center justify-center p-2 rounded-xl border border-border bg-card text-foreground hover:bg-muted disabled:opacity-50 disabled:pointer-events-none transition-colors"
            aria-label="Próxima página"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="size-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      )}

      {/* Detalhe da Tarefa Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          profiles={profiles}
          canFinalize={canFinalize}
          onClose={() => setSelectedTask(null)}
          onRefresh={() => {
            setSelectedTask(null)
            handleRefresh()
          }}
        />
      )}
    </div>
  )
}
