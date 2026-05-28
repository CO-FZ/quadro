import type { LeaveRepository } from '../domain/repository'
import type { Leave, NormalizedLeaveInput, LeaveFilter, AppRoleLike } from '../domain/entities'
import { validateLeaveDates } from '../domain/leave'

export type UseCaseCaller = {
  userId: string
  role: AppRoleLike
}

const MANAGER_ROLES: AppRoleLike[] = ['admin', 'coordenador']

function assertManager(caller: UseCaseCaller | null) {
  if (!caller) throw new Error('UNAUTHENTICATED')
  if (!MANAGER_ROLES.includes(caller.role)) throw new Error('FORBIDDEN')
}

function assertDates(data: NormalizedLeaveInput) {
  const v = validateLeaveDates(data.start_date, data.end_date)
  if (!v.ok) throw new Error('VALIDATION')
}

export class LeaveUseCases {
  constructor(private readonly leaveRepository: LeaveRepository) {}

  async listLeaves(filter?: LeaveFilter): Promise<Leave[]> {
    return this.leaveRepository.listLeaves(filter)
  }

  async createLeave(caller: UseCaseCaller | null, data: NormalizedLeaveInput): Promise<Leave> {
    assertManager(caller)
    assertDates(data)
    return this.leaveRepository.createLeave({ ...data, created_by: caller!.userId })
  }

  async updateLeave(caller: UseCaseCaller | null, id: string, data: NormalizedLeaveInput): Promise<Leave> {
    assertManager(caller)
    assertDates(data)
    return this.leaveRepository.updateLeave(id, data)
  }

  async deleteLeave(caller: UseCaseCaller | null, id: string): Promise<void> {
    assertManager(caller)
    return this.leaveRepository.deleteLeave(id)
  }
}
