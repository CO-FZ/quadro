import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentProfile } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { getWhitelist, getPrivilegedRoleAudit } from '@/lib/actions/admin'
import { getLeaves } from '@/lib/actions/leaves'
import AdminView from '@/components/features/AdminView'
import type { Profile } from '@/lib/supabase/types'

export const metadata = {
  title: 'Admin — Quadro de Atividades',
  description: 'Painel administrativo para gerenciamento de usuários, whitelist e férias.',
}

export default async function AdminPage() {
  const [user, currentProfile] = await Promise.all([getCurrentUser(), getCurrentProfile()])

  if (!user) redirect('/login')
  const role = currentProfile?.role
  if (role !== 'admin' && role !== 'coordenador') redirect('/kanban')

  const isAdmin = role === 'admin'
  const year = new Date().getFullYear()
  const supabase = await createClient()

  const [{ data: profiles }, leavesResult, whitelistResult, auditResult] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: true }),
    getLeaves({ year }),
    isAdmin ? getWhitelist() : Promise.resolve({ ok: true as const, data: [] }),
    isAdmin ? getPrivilegedRoleAudit({ limit: 50 }) : Promise.resolve({ ok: true as const, data: [] }),
  ])

  return (
    <AdminView
      profiles={(profiles ?? []) as Profile[]}
      whitelist={whitelistResult.ok ? (whitelistResult.data ?? []) : []}
      auditEntries={auditResult.ok ? auditResult.data : []}
      auditError={auditResult.ok ? null : auditResult.message}
      currentUserRole={role}
      leaves={leavesResult.ok ? leavesResult.data : []}
      currentYear={year}
    />
  )
}
