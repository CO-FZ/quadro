import { describe, it, expect } from 'vitest'
import { buildTaskHaystack, matchesSearch, normalizeForSearch } from '@/lib/utils/task-search'
import type { TaskWithAssignees } from '@/lib/supabase/types'

function makeTask(overrides: Partial<TaskWithAssignees> = {}): TaskWithAssignees {
  return {
    id: 't1',
    title: 'Revisar plano operacional',
    description: 'Análise das instruções do comando',
    start_date: '2026-05-10',
    end_date: '2026-05-17',
    sector: 'DT',
    status: 'finalizada',
    is_servico: false,
    drive_url: null,
    created_by: 'user-1',
    created_at: '2026-05-09T12:00:00Z',
    updated_at: '2026-05-17T18:30:00Z',
    task_assignees: [
      {
        task_id: 't1',
        user_id: 'u1',
        assigned_at: '2026-05-09T12:00:00Z',
        profiles: {
          id: 'u1',
          email: 'joao.silva@example.mil.br',
          full_name: 'João da Silva',
          nome_guerra: 'Silva',
          avatar_url: null,
          role: 'efetivo',
          patente: 'Cap',
          divisao: 'DT',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
          archived_at: null,
        },
      },
    ],
    ...overrides,
  }
}

describe('normalizeForSearch', () => {
  it('lowercase + remove diacríticos + trim', () => {
    expect(normalizeForSearch('  João é Capitão  ')).toBe('joao e capitao')
  })

  it('string vazia → string vazia', () => {
    expect(normalizeForSearch('')).toBe('')
  })
})

describe('matchesSearch', () => {
  it('termo vazio sempre casa (mostra tudo)', () => {
    expect(matchesSearch('qualquer haystack', '')).toBe(true)
    expect(matchesSearch('qualquer haystack', '   ')).toBe(true)
  })

  it('case- e accent-insensitive', () => {
    expect(matchesSearch('joao da silva', 'JOÃO')).toBe(true)
    expect(matchesSearch('cao', 'Cão')).toBe(true)
  })
})

describe('buildTaskHaystack', () => {
  it('inclui título da tarefa', () => {
    const h = buildTaskHaystack(makeTask())
    expect(matchesSearch(h, 'plano operacional')).toBe(true)
  })

  it('inclui descrição da tarefa', () => {
    const h = buildTaskHaystack(makeTask())
    expect(matchesSearch(h, 'instruções')).toBe(true)
    expect(matchesSearch(h, 'instrucoes')).toBe(true) // sem acento
  })

  it('inclui setor em código e em label expandida', () => {
    const h = buildTaskHaystack(makeTask({ sector: 'DT' }))
    expect(matchesSearch(h, 'DT')).toBe(true)
    expect(matchesSearch(h, 'Técnica')).toBe(true)
    expect(matchesSearch(h, 'tecnica')).toBe(true)
    expect(matchesSearch(h, 'Divisão Técnica')).toBe(true)
  })

  it('inclui setor DA com label expandida', () => {
    const h = buildTaskHaystack(makeTask({ sector: 'DA' }))
    expect(matchesSearch(h, 'DA')).toBe(true)
    expect(matchesSearch(h, 'Administrativa')).toBe(true)
  })

  it('inclui status em código e label', () => {
    const finalizada = buildTaskHaystack(makeTask({ status: 'finalizada' }))
    expect(matchesSearch(finalizada, 'finalizada')).toBe(true)
    expect(matchesSearch(finalizada, 'Finalizada')).toBe(true)

    const arquivada = buildTaskHaystack(makeTask({ status: 'arquivada' }))
    expect(matchesSearch(arquivada, 'Arquivada')).toBe(true)
  })

  it('busca data em formato BR (dd/MM/yyyy)', () => {
    const h = buildTaskHaystack(makeTask({ start_date: '2026-05-10', end_date: '2026-05-17' }))
    expect(matchesSearch(h, '10/05/2026')).toBe(true)
    expect(matchesSearch(h, '17/05')).toBe(true)
  })

  it('busca data em formato ISO', () => {
    const h = buildTaskHaystack(makeTask({ start_date: '2026-05-10' }))
    expect(matchesSearch(h, '2026-05-10')).toBe(true)
  })

  it('busca por full_name, nome_guerra, email e patente do assignee', () => {
    const h = buildTaskHaystack(makeTask())
    expect(matchesSearch(h, 'João da Silva')).toBe(true)
    expect(matchesSearch(h, 'silva')).toBe(true) // nome_guerra
    expect(matchesSearch(h, 'joao.silva@example')).toBe(true)
    expect(matchesSearch(h, 'Cap')).toBe(true)
    expect(matchesSearch(h, 'Cap Silva')).toBe(true) // formatNomeCompleto
  })

  it('busca por "serviço" encontra tarefa is_servico=true', () => {
    const h = buildTaskHaystack(makeTask({ is_servico: true, title: 'Serviço' }))
    expect(matchesSearch(h, 'serviço')).toBe(true)
    expect(matchesSearch(h, 'servico')).toBe(true)
  })

  it('não casa "serviço" em tarefa is_servico=false sem essa palavra', () => {
    const h = buildTaskHaystack(makeTask({ is_servico: false, title: 'Outra coisa', description: 'Sem mencionar' }))
    expect(matchesSearch(h, 'serviço')).toBe(false)
  })

  it('tolera description null', () => {
    const h = buildTaskHaystack(makeTask({ description: null }))
    expect(() => h).not.toThrow()
    expect(matchesSearch(h, 'plano')).toBe(true)
  })

  it('tolera task_assignees vazio', () => {
    const h = buildTaskHaystack(makeTask({ task_assignees: [] }))
    expect(() => h).not.toThrow()
    expect(matchesSearch(h, 'plano')).toBe(true)
  })

  it('termo que não existe em nenhum campo retorna false', () => {
    const h = buildTaskHaystack(makeTask())
    expect(matchesSearch(h, 'inexistentexyz')).toBe(false)
  })

  it('múltiplos assignees: encontra qualquer um deles', () => {
    const h = buildTaskHaystack(
      makeTask({
        task_assignees: [
          {
            task_id: 't1',
            user_id: 'u1',
            assigned_at: '2026-05-09T12:00:00Z',
            profiles: {
              id: 'u1',
              email: 'a@x.br',
              full_name: 'Alfa',
              nome_guerra: null,
              avatar_url: null,
              role: 'efetivo',
              patente: null,
              divisao: null,
              created_at: '2026-01-01T00:00:00Z',
              updated_at: '2026-01-01T00:00:00Z',
              archived_at: null,
            },
          },
          {
            task_id: 't1',
            user_id: 'u2',
            assigned_at: '2026-05-09T12:00:00Z',
            profiles: {
              id: 'u2',
              email: 'b@x.br',
              full_name: 'Bravo Oliveira',
              nome_guerra: 'Oliveira',
              avatar_url: null,
              role: 'coordenador',
              patente: 'Maj',
              divisao: 'DA',
              created_at: '2026-01-01T00:00:00Z',
              updated_at: '2026-01-01T00:00:00Z',
              archived_at: null,
            },
          },
        ],
      })
    )
    expect(matchesSearch(h, 'Alfa')).toBe(true)
    expect(matchesSearch(h, 'oliveira')).toBe(true)
    expect(matchesSearch(h, 'Maj')).toBe(true)
  })
})
