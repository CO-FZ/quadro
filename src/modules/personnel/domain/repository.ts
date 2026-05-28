import type { Leave, NormalizedLeaveInput, LeaveFilter } from './entities'

export interface LeaveRepository {
  listLeaves(filter?: LeaveFilter): Promise<Leave[]>
  createLeave(data: NormalizedLeaveInput & { created_by: string }): Promise<Leave>
  updateLeave(id: string, data: NormalizedLeaveInput): Promise<Leave>
  deleteLeave(id: string): Promise<void>
}
