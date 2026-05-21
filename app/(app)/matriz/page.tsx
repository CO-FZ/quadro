import { createClient } from '@/lib/supabase/server'
import type { Profile, TaskWithAssignees } from '@/lib/supabase/types'
import MatrizView from '@/components/features/MatrizView'

export default async function MatrizPage() {
  const supabase = await createClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const windowStart = new Date(today)
  windowStart.setDate(today.getDate() - 7)

  const windowEnd = new Date(today)
  windowEnd.setDate(today.getDate() + 7)

  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  const [{ data: tasks }, { data: profiles }] = await Promise.all([
    supabase
      .from('tasks')
      .select(`
        *,
        task_assignees (
          task_id,
          user_id,
          assigned_at,
          profiles (
            id,
            email,
            full_name,
            avatar_url,
            role,
            patente
          )
        )
      `)
      .lte('start_date', fmt(windowEnd))
      .gte('end_date', fmt(windowStart))
      .neq('status', 'arquivada'),
    supabase
      .from('profiles')
      .select('id, email, full_name, nome_guerra, avatar_url, role, patente')
      .is('archived_at', null),
  ])

  return (
    <MatrizView
      tasks={(tasks ?? []) as TaskWithAssignees[]}
      profiles={(profiles ?? []) as Pick<Profile, 'id' | 'email' | 'full_name' | 'nome_guerra' | 'avatar_url' | 'role' | 'patente'>[]}
      today={fmt(today)}
      windowStart={fmt(windowStart)}
      windowEnd={fmt(windowEnd)}
    />
  )
}
