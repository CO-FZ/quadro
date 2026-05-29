import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getPersonaSession, adminClient, SUPABASE_URL, SUPABASE_ANON_KEY } from '../fixtures/supabase'
import { makeCleanupCtx, cleanup } from '../fixtures/cleanup'

const ctx = makeCleanupCtx()
let adminId: string, coordId: string, efetivoId: string
let adminTaskId: string, coordTaskId: string, efetivoTaskId: string

const TODAY = new Date().toISOString().slice(0, 10)
const baseTask = { sector: 'DT', start_date: TODAY, end_date: TODAY, status: 'backlog' }

beforeAll(async () => {
  const [a, c, e] = await Promise.all([
    getPersonaSession('admin'),
    getPersonaSession('coord'),
    getPersonaSession('efetivo'),
  ])
  adminId = a.userId
  coordId = c.userId
  efetivoId = e.userId

  // Seed tasks owned by each persona
  const tasks = await Promise.all([
    adminClient.from('tasks').insert({ ...baseTask, title: 'rls-admin-task', created_by: adminId }).select().single(),
    adminClient.from('tasks').insert({ ...baseTask, title: 'rls-coord-task', created_by: coordId }).select().single(),
    adminClient.from('tasks').insert({ ...baseTask, title: 'rls-efetivo-task', created_by: efetivoId }).select().single(),
  ])
  adminTaskId   = tasks[0].data!.id
  coordTaskId   = tasks[1].data!.id
  efetivoTaskId = tasks[2].data!.id
  ctx.taskIds.push(adminTaskId, coordTaskId, efetivoTaskId)
})

afterAll(() => cleanup(ctx))

describe('SELECT tasks', () => {
  it('admin sees all tasks', async () => {
    const { data, error } = await (await getPersonaSession('admin')).client.from('tasks').select('id')
    expect(error).toBeNull()
    expect(data!.length).toBeGreaterThanOrEqual(3)
  })

  it('coord sees all tasks', async () => {
    const { data, error } = await (await getPersonaSession('coord')).client.from('tasks').select('id')
    expect(error).toBeNull()
    expect(data!.length).toBeGreaterThanOrEqual(3)
  })

  it('efetivo sees all tasks', async () => {
    const { data, error } = await (await getPersonaSession('efetivo')).client.from('tasks').select('id')
    expect(error).toBeNull()
    expect(data!.length).toBeGreaterThanOrEqual(3)
  })

  it('anon cannot select tasks', async () => {
    await adminClient.from('tasks').select('id')
    // adminClient bypasses RLS; use a truly unauthenticated client
    const { createClient } = await import('@supabase/supabase-js')
    const anonClient = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data } = await anonClient.from('tasks').select('id')
    expect(data?.length ?? 0).toBe(0) // RLS returns empty for anon, not 403
  })
})

describe('INSERT tasks', () => {
  it('admin can insert with own created_by', async () => {
    const { data, error } = await (await getPersonaSession('admin')).client
      .from('tasks')
      .insert({ ...baseTask, title: 'rls-admin-insert', created_by: adminId })
      .select()
      .single()
    expect(error).toBeNull()
    ctx.taskIds.push(data!.id)
  })

  it('efetivo can insert with own created_by', async () => {
    const { data, error } = await (await getPersonaSession('efetivo')).client
      .from('tasks')
      .insert({ ...baseTask, title: 'rls-efetivo-insert', created_by: efetivoId })
      .select()
      .single()
    expect(error).toBeNull()
    ctx.taskIds.push(data!.id)
  })

  it('spoofing — efetivo INSERT with created_by = admin → RLS blocks', async () => {
    const { error } = await (await getPersonaSession('efetivo')).client
      .from('tasks')
      .insert({ ...baseTask, title: 'rls-spoof-insert', created_by: adminId })
    expect(error).not.toBeNull()
    expect(error!.message).toMatch(/row-level security|policy|violates/i)
  })
})

describe('UPDATE tasks', () => {
  it('admin can update any task metadata', async () => {
    const { error } = await (await getPersonaSession('admin')).client
      .from('tasks')
      .update({ title: 'rls-admin-updated' })
      .eq('id', efetivoTaskId)
    expect(error).toBeNull()
  })

  // ADR 0013 / Sprint 22.3: tasks UPDATE liberado a qualquer autenticado (USING true).
  it('efetivo can update task even when not assignee', async () => {
    const { data, error } = await (await getPersonaSession('efetivo')).client
      .from('tasks')
      .update({ title: 'rls-efetivo-update-ok' })
      .eq('id', adminTaskId)
      .select()
    expect(error).toBeNull()
    expect(data?.length ?? 0).toBe(1) // RLS permite — 1 linha alterada
  })
})

describe('DELETE tasks', () => {
  it('admin can delete task', async () => {
    const { data: t } = await adminClient
      .from('tasks')
      .insert({ ...baseTask, title: 'rls-delete-target', created_by: adminId })
      .select()
      .single()
    ctx.taskIds.push(t!.id)

    const { error } = await (await getPersonaSession('admin')).client.from('tasks').delete().eq('id', t!.id)
    expect(error).toBeNull()
    ctx.taskIds = ctx.taskIds.filter(id => id !== t!.id) // already deleted
  })

  it('efetivo cannot delete task', async () => {
    const { error } = await (await getPersonaSession('efetivo')).client
      .from('tasks')
      .delete()
      .eq('id', adminTaskId)
    // RLS: either error or 0 rows deleted (both acceptable)
    if (error) {
      expect(error.message).toMatch(/row-level security|policy|permission/i)
    } else {
      const { data } = await adminClient.from('tasks').select('id').eq('id', adminTaskId)
      expect(data!.length).toBe(1) // task still exists
    }
  })
})
