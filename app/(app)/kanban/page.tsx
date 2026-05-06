import { createClient } from '@/lib/supabase/server'
import type { TaskWithAssignees } from '@/lib/supabase/types'
import KanbanBoard from '@/components/features/KanbanBoard'

export default async function KanbanPage() {
  const supabase = await createClient()

  const { data: tasks } = await supabase
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
          avatar_url,
          role
        )
      )
    `)
    .order('created_at', { ascending: false })

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, avatar_url, role')
    .order('email')

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
    .single()

  return (
    <KanbanBoard
      tasks={(tasks ?? []) as TaskWithAssignees[]}
      profiles={profiles ?? []}
      currentUserRole={currentProfile?.role ?? 'efetivo'}
    />
  )
}
