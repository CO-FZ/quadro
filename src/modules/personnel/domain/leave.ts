import type { RawLeaveInput, NormalizedLeaveInput, LeaveDatesValidation } from './entities'

export function normalizeLeaveInput(data: RawLeaveInput): NormalizedLeaveInput {
  return {
    profile_id: data.profile_id,
    type: data.type,
    start_date: data.start_date,
    end_date: data.end_date,
    description: data.description.trim() || null,
  }
}

/**
 * Valida o intervalo de um afastamento. Comparação lexicográfica de
 * 'YYYY-MM-DD' (sem `Date`, evita armadilha de fuso).
 */
export function validateLeaveDates(start: string, end: string): LeaveDatesValidation {
  if (!start) {
    return { ok: false, code: 'START_REQUIRED', message: 'A data de início é obrigatória.' }
  }
  if (!end) {
    return { ok: false, code: 'END_REQUIRED', message: 'A data de fim é obrigatória.' }
  }
  if (end < start) {
    return { ok: false, code: 'END_BEFORE_START', message: 'A data de fim não pode ser anterior à data de início.' }
  }
  return { ok: true }
}
