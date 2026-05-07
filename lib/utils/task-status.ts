import type { TaskWithAssignees } from '@/lib/supabase/types'

export function isOverdue(task: Pick<TaskWithAssignees, 'status' | 'end_date'>): boolean {
  if (task.status === 'finalizada' || task.status === 'arquivada') return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(task.end_date + 'T00:00:00')
  return due < today
}
