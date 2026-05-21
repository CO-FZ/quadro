import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, getCurrentProfile } from '@/lib/supabase/queries'
import type { TaskWithAssignees } from '@/lib/supabase/types'
import KanbanBoard from '@/components/features/KanbanBoard'

export default async function KanbanPage() {
  const supabase = await createClient()

  const [{ data: tasks }, { data: profiles }, user, currentProfile] = await Promise.all([
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
            role
          )
        )
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, email, full_name, nome_guerra, avatar_url, role, patente')
      .is('archived_at', null)
      .order('email'),
    getCurrentUser(),      // deduplicated — zero DB cost if layout already called
    getCurrentProfile(),   // deduplicated — zero DB cost if layout already called
  ])

  return (
    <KanbanBoard
      tasks={(tasks ?? []) as TaskWithAssignees[]}
      profiles={profiles ?? []}
      currentUserId={user?.id ?? ''}
      currentUserRole={currentProfile?.role ?? 'efetivo'}
    />
  )
}
