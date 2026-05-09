'use server'

import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/require-role'
import { initialStatusFor, normalizeTaskInput } from '@/lib/actions/_validation'
import type { TaskSector, TaskStatus } from '@/lib/supabase/types'
import { revalidatePath } from 'next/cache'

type ActionResult =
  | { ok: true }
  | { ok: false; code: string; message: string }

function revalidateKanban() {
  revalidatePath('/kanban')
  revalidatePath('/dashboard')
}

// ─── Criar tarefa (qualquer authenticated — ADR 0003 §B) ─────────────────────

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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, code: 'UNAUTHENTICATED', message: 'Não autenticado.' }

    const normalized = normalizeTaskInput(data)

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        ...normalized,
        created_by: user.id,
        status: initialStatusFor(data.assignee_ids),
      })
      .select()
      .single()

    if (error) return { ok: false, code: 'DB_ERROR', message: error.message }

    if (data.assignee_ids.length > 0) {
      const { error: assignError } = await supabase.from('task_assignees').insert(
        data.assignee_ids.map((user_id) => ({ task_id: task.id, user_id }))
      )
      if (assignError) return { ok: false, code: 'ASSIGN_ERROR', message: assignError.message }
    }

    revalidateKanban()
    return { ok: true }
  } catch (e) {
    return { ok: false, code: 'UNEXPECTED', message: String(e) }
  }
}

// ─── Editar tarefa (admin/coord — ADR 0003 §A) ───────────────────────────────

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
    const deny = await requireRole(['admin', 'coordenador'])
    if (deny) return deny

    const supabase = await createClient()

    const { error } = await supabase
      .from('tasks')
      .update(normalizeTaskInput(data))
      .eq('id', taskId)

    if (error) return { ok: false, code: 'DB_ERROR', message: error.message }

    await supabase.from('task_assignees').delete().eq('task_id', taskId)
    if (data.assignee_ids.length > 0) {
      const { error: assignError } = await supabase.from('task_assignees').insert(
        data.assignee_ids.map((user_id) => ({ task_id: taskId, user_id }))
      )
      if (assignError) return { ok: false, code: 'ASSIGN_ERROR', message: assignError.message }
    }

    revalidateKanban()
    return { ok: true }
  } catch (e) {
    return { ok: false, code: 'UNEXPECTED', message: String(e) }
  }
}

// ─── Mover status (RLS cobre admin/coord/alocado; finalizada exige role) ─────

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus
): Promise<ActionResult> {
  try {
    if (status === 'finalizada') {
      const deny = await requireRole(['admin', 'coordenador'])
      if (deny) return deny
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('tasks')
      .update({ status })
      .eq('id', taskId)

    if (error) return { ok: false, code: 'DB_ERROR', message: error.message }
    revalidateKanban()
    return { ok: true }
  } catch (e) {
    return { ok: false, code: 'UNEXPECTED', message: String(e) }
  }
}

// ─── Atualizar assignees (admin/coord — ADR 0003 §A) ─────────────────────────

export async function updateTaskAssignees(
  taskId: string,
  assigneeIds: string[]
): Promise<ActionResult> {
  try {
    const deny = await requireRole(['admin', 'coordenador'])
    if (deny) return deny

    const supabase = await createClient()

    await supabase.from('task_assignees').delete().eq('task_id', taskId)
    if (assigneeIds.length > 0) {
      const { error } = await supabase.from('task_assignees').insert(
        assigneeIds.map((user_id) => ({ task_id: taskId, user_id }))
      )
      if (error) return { ok: false, code: 'ASSIGN_ERROR', message: error.message }
    }

    if (assigneeIds.length > 0) {
      const { data: task } = await supabase
        .from('tasks')
        .select('status')
        .eq('id', taskId)
        .single()

      if (task?.status === 'backlog') {
        await supabase.from('tasks').update({ status: 'alocada' }).eq('id', taskId)
      }
    }

    revalidateKanban()
    return { ok: true }
  } catch (e) {
    return { ok: false, code: 'UNEXPECTED', message: String(e) }
  }
}

// ─── Arquivar tarefa (admin/coord — ADR 0003 §A) ─────────────────────────────

export async function archiveTask(taskId: string): Promise<ActionResult> {
  try {
    const deny = await requireRole(['admin', 'coordenador'])
    if (deny) return deny

    const supabase = await createClient()
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'arquivada' as TaskStatus })
      .eq('id', taskId)

    if (error) return { ok: false, code: 'DB_ERROR', message: error.message }
    revalidateKanban()
    return { ok: true }
  } catch (e) {
    return { ok: false, code: 'UNEXPECTED', message: String(e) }
  }
}

// ─── Excluir tarefa (admin/coord — ADR 0003 §A) ──────────────────────────────

export async function deleteTask(taskId: string): Promise<ActionResult> {
  try {
    const deny = await requireRole(['admin', 'coordenador'])
    if (deny) return deny

    const supabase = await createClient()
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)
    if (error) return { ok: false, code: 'DB_ERROR', message: error.message }
    revalidateKanban()
    return { ok: true }
  } catch (e) {
    return { ok: false, code: 'UNEXPECTED', message: String(e) }
  }
}
