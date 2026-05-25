'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Profile, TaskStatus, TaskWithAssignees } from '@/lib/supabase/types'
import { formatNomeCompleto } from '@/lib/utils/format'
import { sortByPatente } from '@/lib/utils/patente'

interface MatrizViewProps {
  tasks: TaskWithAssignees[]
  profiles: Pick<Profile, 'id' | 'email' | 'full_name' | 'nome_guerra' | 'avatar_url' | 'role' | 'patente'>[]
  today: string
  anchor: string
  windowStart: string
  windowEnd: string
  sheetsUrl?: string
}

function formatRangeLabel(start: string, end: string): string {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const day = (d: Date) => String(d.getDate()).padStart(2, '0')
  const mon = (d: Date) => d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  return s.getMonth() === e.getMonth()
    ? `${day(s)}–${day(e)} ${mon(e)}`
    : `${day(s)} ${mon(s)} – ${day(e)} ${mon(e)}`
}

const STATUS_BADGE: Record<TaskStatus, string> = {
  backlog: 'bg-muted text-muted-foreground',
  alocada: 'bg-secondary/20 text-foreground',
  em_desenvolvimento: 'bg-primary/15 text-primary',
  em_revisao: 'bg-violet-500/15 text-violet-700 dark:text-violet-400',
  finalizada: 'bg-green-500/15 text-green-700 dark:text-green-400',
  arquivada: 'bg-muted text-muted-foreground',
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function buildDays(windowStart: string, windowEnd: string): string[] {
  const days: string[] = []
  let cur = windowStart
  while (cur <= windowEnd) {
    days.push(cur)
    cur = addDays(cur, 1)
  }
  return days
}

function formatDay(dateStr: string): { weekday: string; day: string; month: string } {
  const d = new Date(dateStr + 'T00:00:00')
  return {
    weekday: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
    day: String(d.getDate()).padStart(2, '0'),
    month: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
  }
}

function getTasksForCell(tasks: TaskWithAssignees[], userId: string, day: string): TaskWithAssignees[] {
  return tasks.filter((t) => {
    const assigned = t.task_assignees.some((a) => a.user_id === userId)
    return assigned && t.start_date <= day && t.end_date >= day
  })
}

export default function MatrizView({
  tasks,
  profiles,
  today,
  anchor,
  windowStart,
  windowEnd,
  sheetsUrl,
}: MatrizViewProps) {
  const anchorRowRef = useRef<HTMLTableRowElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const days = buildDays(windowStart, windowEnd)
  const sortedProfiles = sortByPatente(profiles)

  const prevRef = addDays(anchor, -7)
  const nextRef = addDays(anchor, 7)
  const isAtToday = anchor === today

  useEffect(() => {
    if (anchorRowRef.current && containerRef.current) {
      const container = containerRef.current
      const row = anchorRowRef.current
      const rowTop = row.offsetTop
      const containerHeight = container.clientHeight
      container.scrollTop = rowTop - containerHeight / 2 + row.clientHeight / 2
    }
  }, [anchor])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Matriz de Atividades</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Visão semanal do efetivo — ±7 dias</p>
        </div>
        {sheetsUrl && (
          <a
            href={sheetsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Abrir planilha no Google Sheets"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 3h6v6" />
              <path d="M10 14 21 3" />
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            </svg>
            Abrir no Google Sheets
          </a>
        )}
      </div>

      <div
        ref={containerRef}
        className="border border-border rounded-2xl overflow-auto"
        style={{ maxHeight: 'calc(100vh - 180px)' }}
      >
        <table className="border-collapse" style={{ minWidth: `${180 + sortedProfiles.length * 160}px` }}>
          <thead>
            <tr>
              {/* Corner cell */}
              <th
                className="sticky top-0 left-0 z-30 bg-muted border-b border-r border-border px-3 py-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap"
                style={{ minWidth: 180 }}
              >
                Data
              </th>
              {/* User headers */}
              {sortedProfiles.map((p) => (
                <th
                  key={p.id}
                  className="sticky top-0 z-20 bg-muted border-b border-r border-border px-3 py-2 text-center"
                  style={{ minWidth: 160 }}
                >
                  <div className="flex flex-col items-center gap-1">
                    {p.avatar_url ? (
                      <Image
                        src={p.avatar_url}
                        alt={p.email}
                        width={28}
                        height={28}
                        className="h-7 w-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                        {(p.nome_guerra ?? p.full_name ?? p.email)[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-semibold text-foreground leading-tight text-center">
                      {formatNomeCompleto(p.patente, p.nome_guerra ?? p.full_name) || p.email}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day, rowIdx) => {
              const isToday = day === today
              const isEven = rowIdx % 2 === 0
              const { weekday, day: dayNum, month } = formatDay(day)
              const rowBg = isToday ? 'bg-primary/10' : isEven ? 'bg-muted/20' : ''
              const dateCellBg = isToday
                ? 'bg-primary/10 ring-1 ring-inset ring-primary/30'
                : isEven
                ? 'bg-muted/20'
                : 'bg-background'
              const taskCellBg = isToday ? 'bg-primary/5' : isEven ? 'bg-muted/10' : ''
              return (
                <tr
                  key={day}
                  ref={day === anchor ? anchorRowRef : undefined}
                  className={`${rowBg} ${!isToday ? 'hover:bg-muted/30' : ''}`}
                >
                  {/* Date column — frozen left */}
                  <td
                    className={`sticky left-0 z-10 border-b border-r border-border px-3 py-2 whitespace-nowrap ${dateCellBg}`}
                    style={{ minWidth: 180 }}
                  >
                    <div className="flex items-center gap-2">
                      {isToday && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                      <div className="flex flex-col">
                        <span className={`text-xs font-bold capitalize ${isToday ? 'text-primary' : 'text-foreground'}`}>
                          {weekday}, {dayNum} {month}
                        </span>
                        {isToday && (
                          <span className="text-[10px] text-primary font-medium">Hoje</span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Task cells */}
                  {sortedProfiles.map((p) => {
                    const cellTasks = getTasksForCell(tasks, p.id, day)
                    return (
                      <td
                        key={p.id}
                        className={`border-b border-r border-border px-2 py-1.5 align-top ${taskCellBg}`}
                        style={{ minWidth: 160 }}
                      >
                        {cellTasks.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {cellTasks.map((t) => (
                              <span
                                key={t.id}
                                title={t.title}
                                className={`block text-[11px] font-medium px-2 py-0.5 rounded-md truncate max-w-full ${
                                  t.is_servico
                                    ? 'bg-amber-400/20 text-amber-700 dark:text-amber-400'
                                    : STATUS_BADGE[t.status as TaskStatus]
                                }`}
                              >
                                {t.is_servico ? 'Serviço' : t.title}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
