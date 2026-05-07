import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { TaskWithAssignees } from '@/lib/supabase/types'
import ProfileView from '@/components/features/ProfileView'

export const metadata = {
  title: 'Meu Perfil — Quadro CO-FZ',
  description: 'Suas atividades e informações de perfil',
}

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: tasks } = await supabase
    .from('tasks')
    .select(
      `
      *,
      task_assignees!inner(
        user_id,
        assigned_at,
        profiles(id, email, full_name, avatar_url, role)
      )
    `
    )
    .eq('task_assignees.user_id', user.id)
    .neq('status', 'arquivada')
    .order('end_date', { ascending: true })

  return (
    <ProfileView
      profile={profile}
      tasks={(tasks ?? []) as TaskWithAssignees[]}
    />
  )
}
