'use client'

import type { UserTaskStats } from '@/lib/supabase/types'

interface DashboardViewProps {
  stats: UserTaskStats[]
  totalByStatus: {
    backlog: number
    alocada: number
    em_desenvolvimento: number
    finalizada: number
  }
}

const STATUS_CONFIG = [
  { key: 'backlog' as const, label: 'Backlog', color: 'bg-muted', textColor: 'text-muted-foreground', icon: '📋' },
  { key: 'alocada' as const, label: 'Alocadas', color: 'bg-secondary/20', textColor: 'text-secondary-foreground', icon: '👥' },
  { key: 'em_desenvolvimento' as const, label: 'Em Desenvolvimento', color: 'bg-primary/10', textColor: 'text-primary', icon: '⚡' },
  { key: 'finalizada' as const, label: 'Finalizadas', color: 'bg-green-50', textColor: 'text-green-700', icon: '✅' },
]

export default function DashboardView({ stats, totalByStatus }: DashboardViewProps) {
  const totalTasks = Object.values(totalByStatus).reduce((a, b) => a + b, 0)

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Dashboard de Atividades</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Visão geral das tarefas da equipe</p>
      </div>

      {/* KPI Cards por status */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <th className="text-center px-4 py-3 font-semibold text-green-700">Finalizadas</th>
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
                            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                              {s.email[0]?.toUpperCase() ?? '?'}
                            </div>
                            <span className="font-medium text-foreground truncate max-w-[160px]">{s.email}</span>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-4 py-4 hidden md:table-cell">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                            s.role === 'admin' ? 'bg-destructive/10 text-destructive' :
                            s.role === 'coordenador' ? 'bg-primary/10 text-primary' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {s.role}
                          </span>
                        </td>

                        {/* Total */}
                        <td className="px-4 py-4 text-center font-bold text-foreground">{s.total_tasks}</td>

                        {/* Em desenvolvimento */}
                        <td className="px-4 py-4 text-center hidden sm:table-cell">
                          <span className="font-semibold text-primary">{s.in_progress_tasks}</span>
                        </td>

                        {/* Finalizadas */}
                        <td className="px-4 py-4 text-center">
                          <span className="font-semibold text-green-700">{s.finished_tasks}</span>
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
