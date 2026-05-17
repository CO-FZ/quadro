import { createClient } from '@/lib/supabase/server'
import type { TaskWithAssignees } from '@/lib/supabase/types'
import ArquivadosView from '@/components/features/ArquivadosView'

export default async function ArquivadosPage() {
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
          full_name,
          nome_guerra,
          avatar_url,
          role,
          patente
        )
      )
    `)
    .in('status', ['finalizada', 'arquivada'])
    .order('updated_at', { ascending: false })

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name, nome_guerra, avatar_url, role, patente')
    .is('archived_at', null)
    .order('email')

  const { data: { user } } = await supabase.auth.getUser()
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user?.id ?? '')
    .single()

  return (
    <ArquivadosView
      initialTasks={(tasks ?? []) as TaskWithAssignees[]}
      profiles={profiles ?? []}
      currentUserRole={currentProfile?.role ?? 'efetivo'}
    />
  )
}
