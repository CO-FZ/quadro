import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getPersonaSession, adminClient, SUPABASE_URL, SUPABASE_ANON_KEY } from '../fixtures/supabase'
import { makeCleanupCtx, cleanup } from '../fixtures/cleanup'

const ctx = makeCleanupCtx()
let adminId: string, coordId: string, efetivoId: string
let seedLeaveId: string

const Y = new Date().getFullYear()
const baseLeave = { type: 'ferias' as const, start_date: `${Y}-07-01`, end_date: `${Y}-07-20` }

beforeAll(async () => {
  const [a, c, e] = await Promise.all([
    getPersonaSession('admin'),
    getPersonaSession('coord'),
    getPersonaSession('efetivo'),
  ])
  adminId = a.userId
  coordId = c.userId
  efetivoId = e.userId

  const { data } = await adminClient
    .from('leaves')
    .insert({ ...baseLeave, profile_id: efetivoId, created_by: adminId })
    .select()
    .single()
  seedLeaveId = data!.id
  ctx.leaveIds.push(seedLeaveId)
})

afterAll(() => cleanup(ctx))

describe('SELECT leaves', () => {
  it('efetivo can see leaves (read liberada)', async () => {
    const { data, error } = await (await getPersonaSession('efetivo')).client.from('leaves').select('id')
    expect(error).toBeNull()
    expect(data!.length).toBeGreaterThanOrEqual(1)
  })

  it('anon cannot select leaves', async () => {
    const { createClient } = await import('@supabase/supabase-js')
    const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data } = await anon.from('leaves').select('id')
    expect(data?.length ?? 0).toBe(0)
  })
})

describe('INSERT leaves', () => {
  it('coordenador pode inserir', async () => {
    const { data, error } = await (await getPersonaSession('coord')).client
      .from('leaves')
      .insert({ ...baseLeave, profile_id: adminId, created_by: coordId })
      .select()
      .single()
    expect(error).toBeNull()
    ctx.leaveIds.push(data!.id)
  })

  it('admin pode inserir', async () => {
    const { data, error } = await (await getPersonaSession('admin')).client
      .from('leaves')
      .insert({ ...baseLeave, profile_id: coordId, created_by: adminId })
      .select()
      .single()
    expect(error).toBeNull()
    ctx.leaveIds.push(data!.id)
  })

  it('efetivo NÃO pode inserir → RLS bloqueia', async () => {
    const { error } = await (await getPersonaSession('efetivo')).client
      .from('leaves')
      .insert({ ...baseLeave, profile_id: efetivoId, created_by: efetivoId })
    expect(error).not.toBeNull()
    expect(error!.message).toMatch(/row-level security|policy|violates/i)
  })
})

describe('UPDATE / DELETE leaves', () => {
  it('coordenador pode atualizar', async () => {
    const { error } = await (await getPersonaSession('coord')).client
      .from('leaves')
      .update({ description: 'rls-coord-update' })
      .eq('id', seedLeaveId)
    expect(error).toBeNull()
  })

  it('efetivo NÃO pode atualizar (0 linhas)', async () => {
    const { data } = await (await getPersonaSession('efetivo')).client
      .from('leaves')
      .update({ description: 'rls-efetivo-bad' })
      .eq('id', seedLeaveId)
      .select()
    expect(data?.length ?? 0).toBe(0)
  })

  it('admin pode excluir', async () => {
    const { data: l } = await adminClient
      .from('leaves')
      .insert({ ...baseLeave, profile_id: efetivoId, created_by: adminId })
      .select()
      .single()
    const { error } = await (await getPersonaSession('admin')).client.from('leaves').delete().eq('id', l!.id)
    expect(error).toBeNull()
  })

  it('efetivo NÃO pode excluir', async () => {
    const { error } = await (await getPersonaSession('efetivo')).client.from('leaves').delete().eq('id', seedLeaveId)
    if (error) {
      expect(error.message).toMatch(/row-level security|policy|permission/i)
    } else {
      const { data } = await adminClient.from('leaves').select('id').eq('id', seedLeaveId)
      expect(data!.length).toBe(1)
    }
  })
})

describe('CHECK constraint', () => {
  it('end_date < start_date rejeitado pelo banco', async () => {
    const { error } = await adminClient
      .from('leaves')
      .insert({ type: 'ferias', profile_id: efetivoId, start_date: `${Y}-07-20`, end_date: `${Y}-07-01`, created_by: adminId })
    expect(error).not.toBeNull()
    expect(error!.message).toMatch(/leaves_end_after_start|check/i)
  })
})
