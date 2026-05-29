import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getPersonaSession, adminClient } from '../fixtures/supabase'
import { makeCleanupCtx, cleanup } from '../fixtures/cleanup'

const ctx = makeCleanupCtx()
let adminId: string, efetivoId: string, taskId: string

const TODAY = new Date().toISOString().slice(0, 10)

beforeAll(async () => {
  const [a, e] = await Promise.all([
    getPersonaSession('admin'),
    getPersonaSession('efetivo'),
  ])
  adminId   = a.userId
  efetivoId = e.userId

  const { data } = await adminClient
    .from('tasks')
    .insert({ title: 'assignees-rls-task', sector: 'DT', start_date: TODAY, end_date: TODAY, status: 'backlog', created_by: adminId })
    .select()
    .single()
  taskId = data!.id
  ctx.taskIds.push(taskId)
})

afterAll(() => cleanup(ctx))

// CA-03 from story 07A.2

it('admin can INSERT task_assignees for any user_id', async () => {
  const { error } = await (await getPersonaSession('admin')).client
    .from('task_assignees')
    .insert({ task_id: taskId, user_id: efetivoId })
  expect(error).toBeNull()

  // cleanup
  await adminClient.from('task_assignees').delete().eq('task_id', taskId).eq('user_id', efetivoId)
})

it('coord can INSERT task_assignees for any user_id', async () => {
  const coord = await getPersonaSession('coord')
  const { error } = await coord.client
    .from('task_assignees')
    .insert({ task_id: taskId, user_id: efetivoId })
  expect(error).toBeNull()
  await adminClient.from('task_assignees').delete().eq('task_id', taskId).eq('user_id', efetivoId)
})

it('efetivo can INSERT task_assignees with own user_id (self-assign)', async () => {
  const { error } = await (await getPersonaSession('efetivo')).client
    .from('task_assignees')
    .insert({ task_id: taskId, user_id: efetivoId })
  expect(error).toBeNull()
  await adminClient.from('task_assignees').delete().eq('task_id', taskId).eq('user_id', efetivoId)
})

// ADR 0013 / Sprint 22.2: qualquer autenticado pode alocar qualquer membro.
it('efetivo CAN INSERT task_assignees for another user_id', async () => {
  const { error } = await (await getPersonaSession('efetivo')).client
    .from('task_assignees')
    .insert({ task_id: taskId, user_id: adminId })
  expect(error).toBeNull()
  await adminClient.from('task_assignees').delete().eq('task_id', taskId).eq('user_id', adminId)
})

describe('SELECT task_assignees', () => {
  it('all authenticated personas can SELECT', async () => {
    for (const name of ['admin', 'coord', 'efetivo'] as const) {
      const { error } = await (await getPersonaSession(name)).client.from('task_assignees').select('task_id')
      expect(error, `${name} should be able to SELECT`).toBeNull()
    }
  })
})
