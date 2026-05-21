import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, getCurrentProfile } from '@/lib/supabase/queries'
import type { TaskWithAssignees } from '@/lib/supabase/types'
import ProfileView from '@/components/features/ProfileView'

export const metadata = {
  title: 'Meu Perfil — Quadro CO-FZ',
  description: 'Suas atividades e informações de perfil',
}

export default async function ProfilePage() {
  const [user, profile] = await Promise.all([getCurrentUser(), getCurrentProfile()])

  if (!user) redirect('/login')

  const supabase = await createClient()

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
