// Server Action integration tests — lib/actions/leaves.ts (Sprint 23, ADR 0014)
// Mesma estratégia de tasks.actions.test.ts: mock de next/headers/cache/react,
// e @/lib/supabase/server retorna o client da persona ativa.

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { type SupabaseClient } from '@supabase/supabase-js'
import { getPersonaSession, adminClient } from '../fixtures/supabase'
import { makeCleanupCtx, cleanup } from '../fixtures/cleanup'

vi.mock('react', async (importActual) => {
  const actual = await importActual<typeof import('react')>()
  return { ...actual, cache: <T extends (...args: never[]) => unknown>(fn: T) => fn }
})

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

let _activeClient: SupabaseClient
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => _activeClient,
}))

const ctx = makeCleanupCtx()
let adminId: string, coordId: string, efetivoId: string
const Y = new Date().getFullYear()

beforeAll(async () => {
  const [a, c, e] = await Promise.all([
    getPersonaSession('admin'),
    getPersonaSession('coord'),
    getPersonaSession('efetivo'),
  ])
  adminId = a.userId
  coordId = c.userId
  efetivoId = e.userId
})

beforeEach(() => {
  _activeClient = adminClient
})

afterAll(() => cleanup(ctx))

it('coordenador cria período → ok, persistido', async () => {
  _activeClient = (await getPersonaSession('coord')).client
  const { createLeave } = await import('../../../lib/actions/leaves')

  const result = await createLeave({
    profile_id: efetivoId,
    type: 'ferias',
    start_date: `${Y}-08-01`,
    end_date: `${Y}-08-10`,
    description: '  veraneio  ',
  })
  expect(result.ok).toBe(true)

  const { data } = await adminClient
    .from('leaves')
    .select('id, description, created_by')
    .eq('profile_id', efetivoId)
    .eq('start_date', `${Y}-08-01`)
    .single()
  expect(data!.description).toBe('veraneio') // trim aplicado
  expect(data!.created_by).toBe(coordId)
  ctx.leaveIds.push(data!.id)
})

it('admin edita e exclui → ok', async () => {
  const { data: seed } = await adminClient
    .from('leaves')
    .insert({ type: 'instalacao', profile_id: efetivoId, start_date: `${Y}-09-01`, end_date: `${Y}-09-05`, created_by: adminId })
    .select()
    .single()
  ctx.leaveIds.push(seed!.id)

  _activeClient = (await getPersonaSession('admin')).client
  const { updateLeave, deleteLeave } = await import('../../../lib/actions/leaves')

  const upd = await updateLeave(seed!.id, {
    profile_id: efetivoId,
    type: 'dispensa',
    start_date: `${Y}-09-01`,
    end_date: `${Y}-09-06`,
    description: '',
  })
  expect(upd.ok).toBe(true)

  const { data: after } = await adminClient.from('leaves').select('type, end_date').eq('id', seed!.id).single()
  expect(after!.type).toBe('dispensa')
  expect(after!.end_date).toBe(`${Y}-09-06`)

  const del = await deleteLeave(seed!.id)
  expect(del.ok).toBe(true)
  ctx.leaveIds = ctx.leaveIds.filter((id) => id !== seed!.id)
})

it('efetivo cria período → FORBIDDEN, nada persistido', async () => {
  _activeClient = (await getPersonaSession('efetivo')).client
  const { createLeave } = await import('../../../lib/actions/leaves')

  const result = await createLeave({
    profile_id: efetivoId,
    type: 'ferias',
    start_date: `${Y}-10-01`,
    end_date: `${Y}-10-05`,
    description: 'tentativa',
  })
  expect(result.ok).toBe(false)
  if (!result.ok) expect(result.code).toBe('FORBIDDEN')

  const { data } = await adminClient.from('leaves').select('id').eq('profile_id', efetivoId).eq('start_date', `${Y}-10-01`)
  expect(data?.length ?? 0).toBe(0)
})

it('datas invertidas → VALIDATION (não chega ao banco)', async () => {
  _activeClient = (await getPersonaSession('admin')).client
  const { createLeave } = await import('../../../lib/actions/leaves')

  const result = await createLeave({
    profile_id: efetivoId,
    type: 'ferias',
    start_date: `${Y}-11-20`,
    end_date: `${Y}-11-01`,
    description: '',
  })
  expect(result.ok).toBe(false)
  if (!result.ok) expect(result.code).toBe('VALIDATION')

  const { data } = await adminClient.from('leaves').select('id').eq('profile_id', efetivoId).eq('start_date', `${Y}-11-20`)
  expect(data?.length ?? 0).toBe(0)
})
