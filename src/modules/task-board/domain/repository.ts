import type { Task, TaskWithAssignees, NormalizedTaskInput, TaskStatus } from './entities'

export interface TaskRepository {
  createTask(data: NormalizedTaskInput & { created_by: string; status: TaskStatus }, assigneeIds: string[]): Promise<Task>
  updateTask(taskId: string, data: NormalizedTaskInput, assigneeIds: string[]): Promise<void>
  updateTaskStatus(taskId: string, status: TaskStatus): Promise<void>
  updateTaskAssignees(taskId: string, assigneeIds: string[]): Promise<void>
  archiveTask(taskId: string): Promise<void>
  deleteTask(taskId: string): Promise<void>
  getTaskById(taskId: string): Promise<TaskWithAssignees | null>
}
