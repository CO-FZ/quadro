import type { TaskRepository } from '../domain/repository'
import type { NormalizedTaskInput, TaskStatus, Task, AppRole } from '../domain/entities'
import { initialStatusFor } from '../domain/rules'

export type UseCaseCaller = {
  userId: string
  role: AppRole
}

function assertRole(caller: UseCaseCaller | null, allowed: AppRole[]) {
  if (!caller) throw new Error('UNAUTHENTICATED')
  if (!allowed.includes(caller.role)) throw new Error('FORBIDDEN')
}

export class TaskUseCases {
  constructor(private readonly taskRepository: TaskRepository) {}

  async createTask(
    caller: UseCaseCaller | null,
    data: NormalizedTaskInput,
    assigneeIds: string[]
  ): Promise<Task> {
    if (!caller) throw new Error('UNAUTHENTICATED')

    const status = initialStatusFor(assigneeIds)
    return this.taskRepository.createTask(
      { ...data, created_by: caller.userId, status },
      assigneeIds
    )
  }

  async updateTask(
    caller: UseCaseCaller | null,
    taskId: string,
    data: NormalizedTaskInput,
    assigneeIds: string[]
  ): Promise<void> {
    assertRole(caller, ['admin', 'coordenador'])
    return this.taskRepository.updateTask(taskId, data, assigneeIds)
  }

  async updateTaskStatus(
    caller: UseCaseCaller | null,
    taskId: string,
    status: TaskStatus
  ): Promise<void> {
    // finalizada + arquivada: apenas admin/coordenador
    // em_revisao + demais status ativos: qualquer autenticado
    if (status === 'finalizada' || status === 'arquivada') {
      assertRole(caller, ['admin', 'coordenador'])
    } else if (!caller) {
      throw new Error('UNAUTHENTICATED')
    }
    return this.taskRepository.updateTaskStatus(taskId, status)
  }

  async updateTaskAssignees(
    caller: UseCaseCaller | null,
    taskId: string,
    assigneeIds: string[]
  ): Promise<void> {
    assertRole(caller, ['admin', 'coordenador'])

    if (assigneeIds.length > 0) {
      const task = await this.taskRepository.getTaskById(taskId)
      await this.taskRepository.updateTaskAssignees(taskId, assigneeIds)
      if (task?.status === 'backlog') {
        await this.taskRepository.updateTaskStatus(taskId, 'alocada')
      }
    } else {
      await this.taskRepository.updateTaskAssignees(taskId, assigneeIds)
    }
  }

  async archiveTask(caller: UseCaseCaller | null, taskId: string): Promise<void> {
    assertRole(caller, ['admin', 'coordenador'])
    return this.taskRepository.archiveTask(taskId)
  }

  async deleteTask(caller: UseCaseCaller | null, taskId: string): Promise<void> {
    assertRole(caller, ['admin', 'coordenador'])
    return this.taskRepository.deleteTask(taskId)
  }
}
