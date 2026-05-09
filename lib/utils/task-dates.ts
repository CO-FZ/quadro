export type TaskDatesValidation =
  | { ok: true }
  | {
      ok: false
      code: 'START_REQUIRED' | 'END_REQUIRED' | 'END_BEFORE_START'
      message: string
    }

/**
 * Valida o par (start_date, end_date) de uma tarefa.
 * Espera strings no formato `YYYY-MM-DD` (input `<input type="date">`).
 *
 * Regras (extraídas de TaskModal — Sprint 03):
 * - start vazio → START_REQUIRED
 * - end vazio → END_REQUIRED
 * - end < start → END_BEFORE_START
 * - start = end e start < end → ok
 */
export function validateTaskDates(
  start: string,
  end: string,
): TaskDatesValidation {
  if (!start) {
    return {
      ok: false,
      code: 'START_REQUIRED',
      message: 'A data de início é obrigatória.',
    }
  }
  if (!end) {
    return {
      ok: false,
      code: 'END_REQUIRED',
      message: 'A data de entrega é obrigatória.',
    }
  }
  if (end < start) {
    return {
      ok: false,
      code: 'END_BEFORE_START',
      message: 'A data de entrega não pode ser anterior à data de início.',
    }
  }
  return { ok: true }
}
