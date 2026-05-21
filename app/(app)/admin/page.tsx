import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentProfile } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { getWhitelist, getPrivilegedRoleAudit } from '@/lib/actions/admin'
import AdminView from '@/components/features/AdminView'
import type { Profile } from '@/lib/supabase/types'

export const metadata = {
  title: 'Admin — Quadro de Atividades',
  description: 'Painel administrativo para gerenciamento de usuários e whitelist.',
}

export default async function AdminPage() {
  const [user, currentProfile] = await Promise.all([getCurrentUser(), getCurrentProfile()])

  if (!user) redirect('/login')
  if (currentProfile?.role !== 'admin') redirect('/kanban')

  const supabase = await createClient()

  const [{ data: profiles }, whitelistResult, auditResult] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: true }),
    getWhitelist(),
    getPrivilegedRoleAudit({ limit: 50 }),
  ])

  return (
    <AdminView
      profiles={(profiles ?? []) as Profile[]}
      whitelist={whitelistResult.ok ? (whitelistResult.data ?? []) : []}
      auditEntries={auditResult.ok ? auditResult.data : []}
      auditError={auditResult.ok ? null : auditResult.message}
      currentUserRole="admin"
    />
  )
}
