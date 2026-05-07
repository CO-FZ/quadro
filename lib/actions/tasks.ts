'use server'

import { createClient } from '@/lib/supabase/server'
import type { TaskSector, TaskStatus } from '@/lib/supabase/types'
import { revalidatePath } from 'next/cache'

type ActionResult =
  | { ok: true }
  | { ok: false; code: string; message: string }

function revalidateKanban() {
  revalidatePath('/app/kanban')
  revalidatePath('/app/dashboard')
}

// ─── Criar tarefa ────────────────────────────────────────────────────────────

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

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        title: data.title.trim(),
        description: data.description.trim() || null,
        start_date: data.start_date,
        end_date: data.end_date,
        sector: data.sector,
        drive_url: data.drive_url.trim() || null,
        created_by: user.id,
        status: data.assignee_ids.length > 0 ? 'alocada' : 'backlog',
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

// ─── Editar tarefa ───────────────────────────────────────────────────────────

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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, code: 'UNAUTHENTICATED', message: 'Não autenticado.' }

    const { error } = await supabase
      .from('tasks')
      .update({
        title: data.title.trim(),
        description: data.description.trim() || null,
        start_date: data.start_date,
        end_date: data.end_date,
        sector: data.sector,
        drive_url: data.drive_url.trim() || null,
      })
      .eq('id', taskId)

    if (error) return { ok: false, code: 'DB_ERROR', message: error.message }

    // Re-sincroniza assignees
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

// ─── Mover status ────────────────────────────────────────────────────────────

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus
): Promise<ActionResult> {
  try {
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

// ─── Atualizar assignees ──────────────────────────────────────────────────────

export async function updateTaskAssignees(
  taskId: string,
  assigneeIds: string[]
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    await supabase.from('task_assignees').delete().eq('task_id', taskId)
    if (assigneeIds.length > 0) {
      const { error } = await supabase.from('task_assignees').insert(
        assigneeIds.map((user_id) => ({ task_id: taskId, user_id }))
      )
      if (error) return { ok: false, code: 'ASSIGN_ERROR', message: error.message }
    }

    // Se agora tem assignees e a tarefa estava no backlog, move para alocada
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

// ─── Arquivar tarefa ─────────────────────────────────────────────────────────

export async function archiveTask(taskId: string): Promise<ActionResult> {
  try {
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

// ─── Excluir tarefa ──────────────────────────────────────────────────────────

export async function deleteTask(taskId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)
    if (error) return { ok: false, code: 'DB_ERROR', message: error.message }
    revalidateKanban()
    return { ok: true }
  } catch (e) {
    return { ok: false, code: 'UNEXPECTED', message: String(e) }
  }
}
