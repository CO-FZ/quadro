import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getWhitelist } from '@/lib/actions/admin'
import AdminView from '@/components/features/AdminView'
import type { Profile } from '@/lib/supabase/types'

export const metadata = {
  title: 'Admin — Quadro de Atividades',
  description: 'Painel administrativo para gerenciamento de usuários e whitelist.',
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Guard: apenas admin acessa esta rota
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (currentProfile?.role !== 'admin') {
    redirect('/kanban')
  }

  // Busca todos os perfis para listagem
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })

  // Busca whitelist
  const whitelistResult = await getWhitelist()

  return (
    <AdminView
      profiles={(profiles ?? []) as Profile[]}
      whitelist={whitelistResult.ok ? (whitelistResult.data ?? []) : []}
    />
  )
}
