'use server'

import { revalidatePath } from 'next/cache'
import { getCallerRole } from '@/lib/auth/require-role'
import type { Leave, RawLeaveInput, LeaveFilter } from '@/lib/supabase/types'
import { normalizeLeaveInput } from '@/src/modules/personnel/domain/leave'
import { LeaveUseCases } from '@/src/modules/personnel/application/use-cases'
import { SupabaseLeaveRepository } from '@/src/modules/personnel/infrastructure/supabase-leave-repository'

type ActionResult =
  | { ok: true }
  | { ok: false; code: string; message: string }

type ListResult =
  | { ok: true; data: Leave[] }
  | { ok: false; code: string; message: string }

function revalidateLeaves() {
  revalidatePath('/admin')
  revalidatePath('/matriz')
}

const leaveRepository = new SupabaseLeaveRepository()
const leaveUseCases = new LeaveUseCases(leaveRepository)

function mapError(e: unknown): { ok: false; code: string; message: string } {
  const msg = e instanceof Error ? e.message : String(e)
  if (msg === 'UNAUTHENTICATED') return { ok: false, code: 'UNAUTHENTICATED', message: 'Não autenticado.' }
  if (msg === 'FORBIDDEN') return { ok: false, code: 'FORBIDDEN', message: 'Você não tem permissão para esta ação.' }
  if (msg === 'VALIDATION') return { ok: false, code: 'VALIDATION', message: 'Período inválido: verifique as datas.' }
  return { ok: false, code: 'UNEXPECTED', message: msg }
}

export async function getLeaves(filter?: LeaveFilter): Promise<ListResult> {
  try {
    const data = await leaveUseCases.listLeaves(filter)
    return { ok: true, data }
  } catch (e) {
    return mapError(e)
  }
}

export async function createLeave(data: RawLeaveInput): Promise<ActionResult> {
  try {
    const caller = await getCallerRole()
    const normalized = normalizeLeaveInput(data)
    await leaveUseCases.createLeave(caller, normalized)
    revalidateLeaves()
    return { ok: true }
  } catch (e) {
    return mapError(e)
  }
}

export async function updateLeave(id: string, data: RawLeaveInput): Promise<ActionResult> {
  try {
    const caller = await getCallerRole()
    const normalized = normalizeLeaveInput(data)
    await leaveUseCases.updateLeave(caller, id, normalized)
    revalidateLeaves()
    return { ok: true }
  } catch (e) {
    return mapError(e)
  }
}

export async function deleteLeave(id: string): Promise<ActionResult> {
  try {
    const caller = await getCallerRole()
    await leaveUseCases.deleteLeave(caller, id)
    revalidateLeaves()
    return { ok: true }
  } catch (e) {
    return mapError(e)
  }
}
