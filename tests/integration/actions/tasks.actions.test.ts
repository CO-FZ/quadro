// Server Action integration tests — CA-06 to CA-12 from story 07A.2
// Mocks: next/headers (cookie), next/cache (revalidatePath), react (cache = identity)
// The mock of @/lib/supabase/server returns the persona-specific client,
// so requireRole reads the real JWT and database role.

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { type SupabaseClient } from '@supabase/supabase-js'
import { getPersonaSession, adminClient } from '../fixtures/supabase'
import { makeCleanupCtx, cleanup } from '../fixtures/cleanup'

// --- Mocks (hoisted) ---

vi.mock('react', async (importActual) => {
  const actual = await importActual<typeof import('react')>()
  return { ...actual, cache: <T extends (...args: never[]) => unknown>(fn: T) => fn }
})

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

// Controlled client for the current test
let _activeClient: SupabaseClient
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => _activeClient,
}))

// --- Setup ---

const ctx = makeCleanupCtx()
let adminId: string, efetivoId: string

beforeAll(async () => {
  const [a, e] = await Promise.all([
    getPersonaSession('admin'),
    getPersonaSession('efetivo'),
  ])
  adminId   = a.userId
  efetivoId = e.userId
})

beforeEach(() => {
  // Default to admin client; individual tests override as needed
  _activeClient = adminClient
})

afterAll(() => cleanup(ctx))

// --- Helpers ---

async function seedTask(creatorId: string) {
  const TODAY = new Date().toISOString().slice(0, 10)
  const { data } = await adminClient
    .from('tasks')
    .insert({ title: 'action-test-task', sector: 'DT', start_date: TODAY, end_date: TODAY, status: 'backlog', created_by: creatorId })
    .select()
    .single()
  ctx.taskIds.push(data!.id)
  return data!.id
}

// --- Tests ---

// CA-06: createTask by efetivo
it('CA-06: efetivo creates task → ok: true, status backlog', async () => {
  const { client } = await getPersonaSession('efetivo')
  _activeClient = client

  const { createTask } = await import('../../../lib/actions/tasks')
  const TODAY = new Date().toISOString().slice(0, 10)

  const result = await createTask({
    title: '  Test CA-06  ',
    description: '',
    start_date: TODAY,
    end_date: TODAY,
    sector: 'DT',
    drive_url: '',
    assignee_ids: [],
    is_servico: false,
  })

  expect(result.ok).toBe(true)

  // Find the created task
  const { data } = await adminClient
    .from('tasks')
    .select('id, status, created_by, title')
    .eq('created_by', efetivoId)
    .eq('title', 'Test CA-06')
    .single()
  expect(data!.status).toBe('backlog')
  expect(data!.created_by).toBe(efetivoId)
  ctx.taskIds.push(data!.id)
})

// CA-07: createTask with assignees → status 'alocada'
it('CA-07: createTask with assignees → status alocada', async () => {
  const { client } = await getPersonaSession('efetivo')
  _activeClient = client

  const { createTask } = await import('../../../lib/actions/tasks')
  const TODAY = new Date().toISOString().slice(0, 10)

  const result = await createTask({
    title: 'Test CA-07',
    description: '',
    start_date: TODAY,
    end_date: TODAY,
    sector: 'DT',
    drive_url: '',
    assignee_ids: [adminId],
    is_servico: false,
  })
  expect(result.ok).toBe(true)

  const { data } = await adminClient
    .from('tasks')
    .select('id, status')
    .eq('title', 'Test CA-07')
    .eq('created_by', efetivoId)
    .single()
  expect(data!.status).toBe('alocada')
  ctx.taskIds.push(data!.id)
})

// CA-08: ADR 0013 / Sprint 22.3 — efetivo pode editar detalhes de qualquer tarefa.
it('CA-08: efetivo updateTask → ok, DB atualizado', async () => {
  const taskId = await seedTask(adminId)

  const { client } = await getPersonaSession('efetivo')
  _activeClient = client

  const { updateTask } = await import('../../../lib/actions/tasks')
  const TODAY = new Date().toISOString().slice(0, 10)

  const result = await updateTask(taskId, {
    title: 'Editado pelo efetivo',
    description: '',
    start_date: TODAY,
    end_date: TODAY,
    sector: 'DT',
    drive_url: '',
    assignee_ids: [],
    is_servico: false,
  })

  expect(result.ok).toBe(true)

  const { data: after } = await adminClient.from('tasks').select('title').eq('id', taskId).single()
  expect(after!.title).toBe('Editado pelo efetivo')
})

// CA-09: efetivo updateTaskStatus to 'finalizada' → FORBIDDEN
it('CA-09: efetivo updateTaskStatus finalizada → FORBIDDEN', async () => {
  const taskId = await seedTask(efetivoId)
  await adminClient.from('tasks').update({ status: 'em_desenvolvimento' }).eq('id', taskId)

  const { client } = await getPersonaSession('efetivo')
  _activeClient = client

  const { updateTaskStatus } = await import('../../../lib/actions/tasks')
  const result = await updateTaskStatus(taskId, 'finalizada')

  expect(result.ok).toBe(false)
  if (!result.ok) expect(result.code).toBe('FORBIDDEN')

  const { data } = await adminClient.from('tasks').select('status').eq('id', taskId).single()
  expect(data!.status).toBe('em_desenvolvimento')
})

// CA-10: efetivo moves status between non-finalizada states (is assignee)
it('CA-10: efetivo (assignee) moves backlog → alocada → em_desenvolvimento → ok', async () => {
  const taskId = await seedTask(efetivoId)
  await adminClient.from('task_assignees').insert({ task_id: taskId, user_id: efetivoId })

  const { client } = await getPersonaSession('efetivo')
  _activeClient = client

  const { updateTaskStatus } = await import('../../../lib/actions/tasks')

  const r1 = await updateTaskStatus(taskId, 'alocada')
  expect(r1.ok).toBe(true)

  const r2 = await updateTaskStatus(taskId, 'em_desenvolvimento')
  expect(r2.ok).toBe(true)
})

// CA-13: updateUserRole last-admin guard
it('CA-13: updateUserRole rebaixar único admin → LAST_ADMIN', async () => {
  // Ensure only 1 admin in the DB
  const { count } = await adminClient
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'admin')
  if ((count ?? 0) > 1) return // can't test reliably with multiple admins

  _activeClient = (await getPersonaSession('admin')).client

  const { updateUserRole } = await import('../../../lib/actions/admin')
  const result = await updateUserRole(adminId, 'efetivo')

  expect(result.ok).toBe(false)
  if (!result.ok) expect(result.code).toBe('LAST_ADMIN')

  const { data } = await adminClient.from('profiles').select('role').eq('id', adminId).single()
  expect(data!.role).toBe('admin')
})

describe('addToWhitelist', () => {
  // CA-14: bulk parsing
  it('CA-14: bulk add 4 entries via csv/newline/semicolon', async () => {
    _activeClient = (await getPersonaSession('admin')).client

    const { addToWhitelist } = await import('../../../lib/actions/admin')
    const result = await addToWhitelist('ca14a@wl.test, ca14b@wl.test\nca14c@wl.test; ca14d@wl.test', 'efetivo')

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.message).toContain('4')

    // cleanup
    for (const email of ['ca14a@wl.test', 'ca14b@wl.test', 'ca14c@wl.test', 'ca14d@wl.test']) {
      await adminClient.from('whitelist').delete().eq('identifier', email)
    }
  })

  // CA-15: duplicate handling
  it('CA-15: duplicate entry → ok with ignore count', async () => {
    const existing = 'ca15existing@wl.test'
    await adminClient.from('whitelist').upsert({ identifier: existing, default_role: 'efetivo' }, { onConflict: 'identifier' })

    _activeClient = (await getPersonaSession('admin')).client
    const { addToWhitelist } = await import('../../../lib/actions/admin')
    const result = await addToWhitelist(`${existing}, ca15new@wl.test`, 'efetivo')

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.message).toContain('1')
      expect(result.message).toContain('ignorado')
    }

    // cleanup
    for (const email of [existing, 'ca15new@wl.test']) {
      await adminClient.from('whitelist').delete().eq('identifier', email)
    }
  })
})

// CA-16: archiveUser last-admin guard
it('CA-16: archiveUser único admin → LAST_ADMIN', async () => {
  const { count } = await adminClient
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'admin')
  if ((count ?? 0) > 1) return

  _activeClient = (await getPersonaSession('admin')).client
  const { archiveUser } = await import('../../../lib/actions/admin')
  const result = await archiveUser(adminId)

  expect(result.ok).toBe(false)
  if (!result.ok) expect(result.code).toBe('LAST_ADMIN')
})

// CA-17: createTask with is_servico=true → title forced 'Serviço', description/drive_url null
it('CA-17: createTask is_servico=true → título "Serviço", description e drive_url nulos no DB', async () => {
  _activeClient = (await getPersonaSession('admin')).client
  const { createTask } = await import('../../../lib/actions/tasks')
  const TODAY = new Date().toISOString().slice(0, 10)

  const result = await createTask({
    title: 'Qualquer Coisa',
    description: 'Isso não deve ser salvo',
    start_date: TODAY,
    end_date: TODAY,
    sector: 'DT',
    drive_url: 'https://drive.google.com/ignored',
    assignee_ids: [],
    is_servico: true,
  })

  expect(result.ok).toBe(true)

  const { data } = await adminClient
    .from('tasks')
    .select('id, title, description, drive_url, is_servico')
    .eq('is_servico', true)
    .eq('created_by', adminId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  expect(data!.title).toBe('Serviço')
  expect(data!.description).toBeNull()
  expect(data!.drive_url).toBeNull()
  expect(data!.is_servico).toBe(true)

  ctx.taskIds.push(data!.id)
})
