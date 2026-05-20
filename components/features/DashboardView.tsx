'use client'

import Image from 'next/image'
import type { UserTaskStats } from '@/lib/supabase/types'
import { formatNomeCompleto } from '@/lib/utils/format'

interface SectorStats {
  DT: { alocadas: number; finalizadas: number }
  DA: { alocadas: number; finalizadas: number }
  total: number
}

interface DashboardViewProps {
  stats: UserTaskStats[]
  totalByStatus: {
    backlog: number
    alocada: number
    em_desenvolvimento: number
    em_revisao: number
    finalizada: number
  }
  sectorStats: SectorStats
  overdueCount: number
}

const STATUS_CONFIG = [
  { key: 'backlog' as const, label: 'Backlog', color: 'bg-muted', textColor: 'text-muted-foreground', icon: '📋' },
  { key: 'alocada' as const, label: 'Alocadas', color: 'bg-secondary/20', textColor: 'text-foreground', icon: '👥' },
  { key: 'em_desenvolvimento' as const, label: 'Em Desenvolvimento', color: 'bg-primary/10', textColor: 'text-primary', icon: '⚡' },
  { key: 'em_revisao' as const, label: 'Em Revisão', color: 'bg-violet-500/10', textColor: 'text-violet-700 dark:text-violet-400', icon: '🔍' },
  { key: 'finalizada' as const, label: 'Finalizadas', color: 'bg-green-500/10', textColor: 'text-green-700 dark:text-green-400', icon: '✅' },
]

export default function DashboardView({ stats, totalByStatus, sectorStats, overdueCount }: DashboardViewProps) {
  const totalTasks = Object.values(totalByStatus).reduce((a, b) => a + b, 0)

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Dashboard de Atividades</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Visão geral das tarefas da equipe</p>
      </div>

      {/* KPI Cards por status */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {STATUS_CONFIG.map((cfg) => {
          const count = totalByStatus[cfg.key]
          const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0

          return (
            <div
              key={cfg.key}
              className={`rounded-2xl border border-border p-5 flex flex-col gap-3 ${cfg.color}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{cfg.icon}</span>
                <span className={`text-xs font-semibold ${cfg.textColor}`}>{pct}%</span>
              </div>
              <div>
                <p className={`text-3xl font-bold ${cfg.textColor}`}>{count}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{cfg.label}</p>
              </div>
              {/* Progress bar */}
              <div className="h-1 bg-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    cfg.key === 'finalizada' ? 'bg-green-500' :
                    cfg.key === 'em_revisao' ? 'bg-violet-500' :
                    cfg.key === 'em_desenvolvimento' ? 'bg-primary' :
                    cfg.key === 'alocada' ? 'bg-secondary' :
                    'bg-muted-foreground/40'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Alerta de tarefas atrasadas */}
      {overdueCount > 0 ? (
        <div className="flex items-center gap-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
          <span className="text-3xl">⚠</span>
          <div>
            <p className="text-sm font-semibold text-destructive">
              {overdueCount} {overdueCount === 1 ? 'tarefa atrasada' : 'tarefas atrasadas'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {overdueCount === 1 ? 'Tarefa ativa' : 'Tarefas ativas'} com prazo vencido — verifique o Kanban.
            </p>
          </div>
          <div className="ml-auto rounded-2xl bg-destructive/10 px-4 py-2">
            <p className="text-3xl font-bold text-destructive">{overdueCount}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-green-500/20 bg-green-500/5 px-5 py-4">
          <span className="text-lg">✅</span>
          <p className="text-sm text-green-700 dark:text-green-400 font-medium">Nenhuma tarefa atrasada</p>
        </div>
      )}

      {/* Distribuição por Divisão */}
      <div className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-foreground">Distribuição por Divisão</h2>
        {sectorStats.total === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-6 text-center text-sm text-muted-foreground">
            Nenhuma atividade alocada ou concluída registrada.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(['DT', 'DA'] as const).map((sector) => {
              const data = sectorStats[sector]
              const totalSector = data.alocadas + data.finalizadas
              const pct = sectorStats.total > 0 ? Math.round((totalSector / sectorStats.total) * 100) : 0
              return (
                <div key={sector} className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-foreground">{sector}</span>
                    <span className="text-sm font-semibold text-muted-foreground">{pct}%</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Alocadas</span>
                      <span className="font-semibold text-foreground">{data.alocadas}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Concluídas</span>
                      <span className="font-semibold text-green-700 dark:text-green-400">{data.finalizadas}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-muted-foreground">Total</span>
                      <span className="text-foreground">{totalSector}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Tabela de usuários */}
      <div className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-foreground">Atividades por Colaborador</h2>

        {stats.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-10 text-center">
            <p className="text-muted-foreground text-sm">Nenhuma atividade registrada ainda.</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* Desktop table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted">
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Colaborador</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Perfil</th>
                    <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Total</th>
                    <th className="text-center px-4 py-3 font-semibold text-primary hidden sm:table-cell">Em Dev.</th>
                    <th className="text-center px-4 py-3 font-semibold text-green-700 dark:text-green-400">Finalizadas</th>
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Progresso</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s, idx) => {
                    const pct = s.total_tasks > 0
                      ? Math.round((Number(s.finished_tasks) / Number(s.total_tasks)) * 100)
                      : 0

                    return (
                      <tr
                        key={s.user_id}
                        className={`border-b border-border last:border-0 hover:bg-muted/50 transition-colors ${
                          idx === 0 && Number(s.total_tasks) > 0 ? 'bg-secondary/5' : ''
                        }`}
                      >
                        {/* Avatar + email */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {s.avatar_url ? (
                              <Image
                                src={s.avatar_url}
                                alt={s.full_name ?? s.email}
                                width={32}
                                height={32}
                                className="h-8 w-8 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                                {s.email[0]?.toUpperCase() ?? '?'}
                              </div>
                            )}
                            <span className="font-medium text-foreground truncate max-w-[160px]">
                              {formatNomeCompleto(s.patente, s.nome_guerra ?? s.full_name) || s.email}
                            </span>
                          </div>
                        </td>

                        {/* Role + Divisão */}
                        <td className="px-4 py-4 hidden md:table-cell">
                          <div className="flex flex-col gap-1">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize w-fit ${
                              s.role === 'admin' ? 'bg-destructive/10 text-destructive' :
                              s.role === 'coordenador' ? 'bg-primary/10 text-primary' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {s.role}
                            </span>
                            {s.divisao && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full w-fit bg-secondary/20 text-foreground">
                                {s.divisao}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Total */}
                        <td className="px-4 py-4 text-center font-bold text-foreground">{s.total_tasks}</td>

                        {/* Em desenvolvimento */}
                        <td className="px-4 py-4 text-center hidden sm:table-cell">
                          <span className="font-semibold text-primary">{s.in_progress_tasks}</span>
                        </td>

                        {/* Finalizadas */}
                        <td className="px-4 py-4 text-center">
                          <span className="font-semibold text-green-700 dark:text-green-400">{s.finished_tasks}</span>
                        </td>

                        {/* Progress bar */}
                        <td className="px-5 py-4 hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-9 text-right">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
