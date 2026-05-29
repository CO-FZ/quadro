import { createClient } from '@/lib/supabase/server'
import type { Leave, Profile, TaskWithAssignees } from '@/lib/supabase/types'
import MatrizView from '@/components/features/MatrizView'

interface PageProps {
  searchParams: Promise<{ ref?: string }>
}

function parseRef(ref: string | undefined, fallback: string): string {
  if (ref && /^\d{4}-\d{2}-\d{2}$/.test(ref)) {
    const d = new Date(ref + 'T00:00:00')
    if (!Number.isNaN(d.getTime())) return ref
  }
  return fallback
}

export default async function MatrizPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  const todayStr = fmt(today)

  const anchorStr = parseRef(params.ref, todayStr)
  const anchor = new Date(anchorStr + 'T00:00:00')

  const windowStart = new Date(anchor)
  windowStart.setDate(anchor.getDate() - 7)

  const windowEnd = new Date(anchor)
  windowEnd.setDate(anchor.getDate() + 7)

  const [{ data: tasks }, { data: profiles }, { data: leaves }] = await Promise.all([
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
    supabase
      .from('leaves')
      .select('id, profile_id, type, start_date, end_date, description')
      .lte('start_date', fmt(windowEnd))
      .gte('end_date', fmt(windowStart)),
  ])

  const sheetsUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL || undefined

  return (
    <MatrizView
      tasks={(tasks ?? []) as TaskWithAssignees[]}
      profiles={(profiles ?? []) as Pick<Profile, 'id' | 'email' | 'full_name' | 'nome_guerra' | 'avatar_url' | 'role' | 'patente'>[]}
      leaves={(leaves ?? []) as Pick<Leave, 'id' | 'profile_id' | 'type' | 'start_date' | 'end_date' | 'description'>[]}
      today={todayStr}
      anchor={anchorStr}
      windowStart={fmt(windowStart)}
      windowEnd={fmt(windowEnd)}
      sheetsUrl={sheetsUrl}
    />
  )
}
