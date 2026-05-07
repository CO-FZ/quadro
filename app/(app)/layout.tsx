import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/supabase/types'
import AppShell from '@/components/features/AppShell'
import { ToastProvider } from '@/components/ui/ToastProvider'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <ToastProvider>
      <AppShell profile={profile as Profile}>
        {children}
      </AppShell>
    </ToastProvider>
  )
}
