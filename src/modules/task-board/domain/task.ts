// Backward-compatibility re-exports — canonical source is domain/entities.ts and domain/rules.ts
export type {
  AppRole,
  TaskSector,
  TaskStatus,
  Profile,
  Task,
  TaskAssignee,
  TaskWithAssignees,
  RawTaskInput,
  NormalizedTaskInput,
  TaskDatesValidation,
} from './entities'
export { KANBAN_COLUMNS, SECTOR_LABELS } from './entities'
export { normalizeTaskInput, initialStatusFor, isOverdue, validateTaskDates } from './rules'
