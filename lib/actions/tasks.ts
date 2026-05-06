'use server'

import { createClient } from '@/lib/supabase/server'
import type { TaskSector, TaskStatus } from '@/lib/supabase/types'
import { revalidatePath } from 'next/cache'

export async function createTask(data: {
  title: string
  description: string
  start_date: string
  end_date: string
  sector: TaskSector
  drive_url: string
  assignee_ids: string[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

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

  if (error) throw error

  if (data.assignee_ids.length > 0) {
    await supabase.from('task_assignees').insert(
      data.assignee_ids.map((user_id) => ({ task_id: task.id, user_id }))
    )
  }

  revalidatePath('/app/kanban')
  revalidatePath('/app/dashboard')
  return { ok: true }
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId)

  if (error) throw error
  revalidatePath('/app/kanban')
  revalidatePath('/app/dashboard')
  return { ok: true }
}

export async function updateTaskAssignees(taskId: string, assigneeIds: string[]) {
  const supabase = await createClient()

  // Remove todos e reinseere (simples e correto para alocação pequena)
  await supabase.from('task_assignees').delete().eq('task_id', taskId)

  if (assigneeIds.length > 0) {
    await supabase.from('task_assignees').insert(
      assigneeIds.map((user_id) => ({ task_id: taskId, user_id }))
    )
  }

  // Se houver responsáveis e a tarefa estiver no backlog, move para alocada
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

  revalidatePath('/app/kanban')
  revalidatePath('/app/dashboard')
  return { ok: true }
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)
  if (error) throw error
  revalidatePath('/app/kanban')
  revalidatePath('/app/dashboard')
  return { ok: true }
}
