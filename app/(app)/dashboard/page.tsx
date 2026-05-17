import { createClient } from '@/lib/supabase/server'
import type { UserTaskStats } from '@/lib/supabase/types'
import DashboardView from '@/components/features/DashboardView'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: stats } = await supabase
    .from('user_task_stats')
    .select('*')
    .order('alocada_tasks', { ascending: false })
    .order('total_tasks', { ascending: false })

  const { data: taskCounts } = await supabase
    .from('tasks')
    .select('status, sector')
    .eq('is_servico', false)

  const totalByStatus = {
    backlog: 0,
    alocada: 0,
    em_desenvolvimento: 0,
    em_revisao: 0,
    finalizada: 0,
  }

  const sectorStats = {
    DT: { alocadas: 0, finalizadas: 0 },
    DA: { alocadas: 0, finalizadas: 0 },
    total: 0,
  }

  for (const t of taskCounts ?? []) {
    const s = t.status as keyof typeof totalByStatus
    if (s in totalByStatus) totalByStatus[s]++

    const sector = t.sector as 'DT' | 'DA'
    if (sector === 'DT' || sector === 'DA') {
      if (t.status === 'alocada') {
        sectorStats[sector].alocadas++
        sectorStats.total++
      } else if (t.status === 'finalizada') {
        sectorStats[sector].finalizadas++
        sectorStats.total++
      }
    }
  }

  return (
    <DashboardView
      stats={(stats ?? []) as UserTaskStats[]}
      totalByStatus={totalByStatus}
      sectorStats={sectorStats}
    />
  )
}
