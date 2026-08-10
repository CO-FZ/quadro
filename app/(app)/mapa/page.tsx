import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentProfile } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { getBuildings } from '@/lib/actions/buildings'
import MapaView from '@/components/features/MapaView'
import type { Profile } from '@/lib/supabase/types'

export const metadata = {
  title: 'Mapa — Quadro de Atividades',
  description: 'Alocação do efetivo da CO-FZ nas edificações em obra.',
}

export default async function MapaPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const currentProfile = await getCurrentProfile()
  const role = currentProfile?.role
  const canManage = role === 'admin' || role === 'coordenador'

  const supabase = await createClient()
  const [buildingsResult, { data: profiles }] = await Promise.all([
    getBuildings(),
    supabase
      .from('profiles')
      .select('id, email, full_name, nome_guerra, avatar_url, role, patente')
      .is('archived_at', null),
  ])

  return (
    <MapaView
      initialBuildings={buildingsResult.ok ? buildingsResult.data : []}
      profiles={(profiles ?? []) as Pick<Profile, 'id' | 'email' | 'full_name' | 'nome_guerra' | 'avatar_url' | 'role' | 'patente'>[]}
      canManage={canManage}
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''}
    />
  )
}
