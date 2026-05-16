import { createClient } from '@/lib/supabase/server'
import type { TaskRepository } from '../domain/repository'
import type { Task, TaskWithAssignees, NormalizedTaskInput, TaskStatus } from '../domain/entities'

export class SupabaseTaskRepository implements TaskRepository {
  async createTask(
    data: NormalizedTaskInput & { created_by: string; status: TaskStatus },
    assigneeIds: string[]
  ): Promise<Task> {
    const supabase = await createClient()

    const { data: task, error } = await supabase
      .from('tasks')
      .insert(data)
      .select()
      .single()

    if (error) throw new Error(error.message)

    if (assigneeIds.length > 0) {
      const { error: assignError } = await supabase.from('task_assignees').insert(
        assigneeIds.map((user_id) => ({ task_id: task.id, user_id }))
      )
      if (assignError) throw new Error(assignError.message)
    }

    return task as unknown as Task
  }

  async updateTask(taskId: string, data: NormalizedTaskInput, assigneeIds: string[]): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase.from('tasks').update(data).eq('id', taskId)
    if (error) throw new Error(error.message)

    await supabase.from('task_assignees').delete().eq('task_id', taskId)
    if (assigneeIds.length > 0) {
      const { error: assignError } = await supabase.from('task_assignees').insert(
        assigneeIds.map((user_id) => ({ task_id: taskId, user_id }))
      )
      if (assignError) throw new Error(assignError.message)
    }
  }

  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase.from('tasks').update({ status }).eq('id', taskId)
    if (error) throw new Error(error.message)
  }

  async updateTaskAssignees(taskId: string, assigneeIds: string[]): Promise<void> {
    const supabase = await createClient()

    await supabase.from('task_assignees').delete().eq('task_id', taskId)
    if (assigneeIds.length > 0) {
      const { error } = await supabase.from('task_assignees').insert(
        assigneeIds.map((user_id) => ({ task_id: taskId, user_id }))
      )
      if (error) throw new Error(error.message)
    }
  }

  async archiveTask(taskId: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'arquivada' })
      .eq('id', taskId)
    if (error) throw new Error(error.message)
  }

  async deleteTask(taskId: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)
    if (error) throw new Error(error.message)
  }

  async getTaskById(taskId: string): Promise<TaskWithAssignees | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('tasks')
      .select('*, task_assignees(*, profiles(*))')
      .eq('id', taskId)
      .single()

    if (error || !data) return null
    return data as unknown as TaskWithAssignees
  }
}
