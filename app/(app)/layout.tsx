import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentProfile } from '@/lib/supabase/queries'
import type { Profile } from '@/lib/supabase/types'
import AppShell from '@/components/features/AppShell'
import { ToastProvider } from '@/components/ui/ToastProvider'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile()

  return (
    <ToastProvider>
      <AppShell profile={profile as Profile}>
        {children}
      </AppShell>
    </ToastProvider>
  )
}
