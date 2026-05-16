'use server'

import { revalidatePath } from 'next/cache'
import { getCallerRole } from '@/lib/auth/require-role'
import type { TaskSector, TaskStatus } from '@/lib/supabase/types'
import { normalizeTaskInput } from '@/src/modules/task-board/domain/task'
import { TaskUseCases } from '@/src/modules/task-board/application/use-cases'
import { SupabaseTaskRepository } from '@/src/modules/task-board/infrastructure/supabase-task-repository'

type ActionResult =
  | { ok: true }
  | { ok: false; code: string; message: string }

function revalidateKanban() {
  revalidatePath('/kanban')
  revalidatePath('/dashboard')
}

// Instancia as dependências do caso de uso
const taskRepository = new SupabaseTaskRepository()
const taskUseCases = new TaskUseCases(taskRepository)

export async function createTask(data: {
  title: string
  description: string
  start_date: string
  end_date: string
  sector: TaskSector
  drive_url: string
  assignee_ids: string[]
}): Promise<ActionResult> {
  try {
    const caller = await getCallerRole()
    const normalized = normalizeTaskInput(data)
    await taskUseCases.createTask(caller, normalized, data.assignee_ids)
    
    revalidateKanban()
    return { ok: true }
  } catch (e: any) {
    if (e.message === 'UNAUTHENTICATED') return { ok: false, code: 'UNAUTHENTICATED', message: 'Não autenticado.' }
    return { ok: false, code: 'UNEXPECTED', message: String(e) }
  }
}

export async function updateTask(
  taskId: string,
  data: {
    title: string
    description: string
    start_date: string
    end_date: string
    sector: TaskSector
    drive_url: string
    assignee_ids: string[]
  }
): Promise<ActionResult> {
  try {
    const caller = await getCallerRole()
    const normalized = normalizeTaskInput(data)
    await taskUseCases.updateTask(caller, taskId, normalized, data.assignee_ids)
    
    revalidateKanban()
    return { ok: true }
  } catch (e: any) {
    if (e.message === 'UNAUTHENTICATED') return { ok: false, code: 'UNAUTHENTICATED', message: 'Não autenticado.' }
    if (e.message === 'FORBIDDEN') return { ok: false, code: 'FORBIDDEN', message: 'Você não tem permissão para esta ação.' }
    return { ok: false, code: 'UNEXPECTED', message: String(e) }
  }
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus
): Promise<ActionResult> {
  try {
    const caller = await getCallerRole()
    await taskUseCases.updateTaskStatus(caller, taskId, status)
    
    revalidateKanban()
    return { ok: true }
  } catch (e: any) {
    if (e.message === 'UNAUTHENTICATED') return { ok: false, code: 'UNAUTHENTICATED', message: 'Não autenticado.' }
    if (e.message === 'FORBIDDEN') return { ok: false, code: 'FORBIDDEN', message: 'Você não tem permissão para esta ação.' }
    return { ok: false, code: 'UNEXPECTED', message: String(e) }
  }
}

export async function updateTaskAssignees(
  taskId: string,
  assigneeIds: string[]
): Promise<ActionResult> {
  try {
    const caller = await getCallerRole()
    await taskUseCases.updateTaskAssignees(caller, taskId, assigneeIds)
    
    revalidateKanban()
    return { ok: true }
  } catch (e: any) {
    if (e.message === 'UNAUTHENTICATED') return { ok: false, code: 'UNAUTHENTICATED', message: 'Não autenticado.' }
    if (e.message === 'FORBIDDEN') return { ok: false, code: 'FORBIDDEN', message: 'Você não tem permissão para esta ação.' }
    return { ok: false, code: 'UNEXPECTED', message: String(e) }
  }
}

export async function archiveTask(taskId: string): Promise<ActionResult> {
  try {
    const caller = await getCallerRole()
    await taskUseCases.archiveTask(caller, taskId)
    
    revalidateKanban()
    return { ok: true }
  } catch (e: any) {
    if (e.message === 'UNAUTHENTICATED') return { ok: false, code: 'UNAUTHENTICATED', message: 'Não autenticado.' }
    if (e.message === 'FORBIDDEN') return { ok: false, code: 'FORBIDDEN', message: 'Você não tem permissão para esta ação.' }
    return { ok: false, code: 'UNEXPECTED', message: String(e) }
  }
}

export async function deleteTask(taskId: string): Promise<ActionResult> {
  try {
    const caller = await getCallerRole()
    await taskUseCases.deleteTask(caller, taskId)
    
    revalidateKanban()
    return { ok: true }
  } catch (e: any) {
    if (e.message === 'UNAUTHENTICATED') return { ok: false, code: 'UNAUTHENTICATED', message: 'Não autenticado.' }
    if (e.message === 'FORBIDDEN') return { ok: false, code: 'FORBIDDEN', message: 'Você não tem permissão para esta ação.' }
    return { ok: false, code: 'UNEXPECTED', message: String(e) }
  }
}
