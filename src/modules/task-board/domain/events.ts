import type { TaskStatus, TaskSector } from './entities'

export interface TaskCreatedEvent {
  type: 'TaskCreated'
  taskId: string
  title: string
  status: TaskStatus
  sector: TaskSector
  createdBy: string
}

export interface TaskMovedEvent {
  type: 'TaskMoved'
  taskId: string
  from: TaskStatus
  to: TaskStatus
  movedBy: string
}

export interface TaskArchivedEvent {
  type: 'TaskArchived'
  taskId: string
  archivedBy: string
}

export interface TaskDeletedEvent {
  type: 'TaskDeleted'
  taskId: string
  deletedBy: string
}

export interface TaskUpdatedEvent {
  type: 'TaskUpdated'
  taskId: string
  updatedBy: string
}

export type TaskDomainEvent =
  | TaskCreatedEvent
  | TaskMovedEvent
  | TaskArchivedEvent
  | TaskDeletedEvent
  | TaskUpdatedEvent
