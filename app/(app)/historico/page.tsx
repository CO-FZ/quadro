import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/queries'
import type { TaskWithAssignees } from '@/lib/supabase/types'
import HistoricoView from '@/components/features/HistoricoView'

interface PageProps {
  searchParams: Promise<{
    q?: string
    page?: string
  }>
}

export default async function HistoricoPage({ searchParams }: PageProps) {
  const params = await searchParams
  const q = params.q || ''
  const page = Math.max(1, parseInt(params.page || '1', 10))
  const pageSize = 20

  const supabase = await createClient()

  // Buscar perfil atual para passar às permissões
  const currentProfile = await getCurrentProfile()

  // Iniciar query base de tarefas
  let query = supabase
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
    `, { count: 'exact' })
    .in('status', ['finalizada', 'arquivada'])

  // Se houver busca, filtrar nos campos da tarefa
  if (q.trim()) {
    const searchTerm = q.trim()
    
    // Tratando termos para pesquisa de setor
    const isDT = 'divisão técnica'.includes(searchTerm.toLowerCase()) || 'dt'.includes(searchTerm.toLowerCase())
    const isDA = 'divisão administrativa'.includes(searchTerm.toLowerCase()) || 'da'.includes(searchTerm.toLowerCase())
    
    let orConditions = `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
    
    if (isDT) orConditions += `,sector.eq.DT`
    if (isDA) orConditions += `,sector.eq.DA`
    
    // Filtro por tipo de serviço
    if ('servico'.includes(searchTerm.toLowerCase()) || 'serviço'.includes(searchTerm.toLowerCase())) {
      orConditions += `,is_servico.eq.true`
    }

    query = query.or(orConditions)
  }

  // Ordenação: mais recente primeiro (conforme requisito)
  query = query.order('created_at', { ascending: false })

  // Paginação: exibir apenas 20 por vez
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const [{ data: tasks, count }, { data: profiles }] = await Promise.all([
    query,
    supabase
      .from('profiles')
      .select('id, email, full_name, nome_guerra, avatar_url, role, patente')
      .is('archived_at', null)
      .order('email')
  ])

  const totalCount = count || 0
  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <HistoricoView
      tasks={(tasks ?? []) as TaskWithAssignees[]}
      profiles={(profiles ?? []) as Pick<import('@/lib/supabase/types').Profile, 'id' | 'email' | 'full_name' | 'nome_guerra' | 'avatar_url' | 'role' | 'patente'>[]}
      query={q}
      currentPage={page}
      totalPages={totalPages}
      totalCount={totalCount}
      currentUserRole={currentProfile?.role ?? 'efetivo'}
    />
  )
}
