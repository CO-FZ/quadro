import { createClient } from '@/lib/supabase/server'
import type { LeaveRepository } from '../domain/repository'
import type { Leave, NormalizedLeaveInput, LeaveFilter } from '../domain/entities'

const LEAVE_COLUMNS = 'id, profile_id, type, start_date, end_date, description, created_by, created_at, updated_at'

export class SupabaseLeaveRepository implements LeaveRepository {
  async listLeaves(filter?: LeaveFilter): Promise<Leave[]> {
    const supabase = await createClient()
    let query = supabase.from('leaves').select(LEAVE_COLUMNS)

    if (filter?.year != null) {
      const yearStart = `${filter.year}-01-01`
      const yearEnd = `${filter.year}-12-31`
      query = query.lte('start_date', yearEnd).gte('end_date', yearStart)
    }
    if (filter?.from != null) query = query.gte('end_date', filter.from)
    if (filter?.to != null) query = query.lte('start_date', filter.to)

    const { data, error } = await query.order('start_date', { ascending: true })
    if (error) throw new Error(error.message)
    return (data ?? []) as unknown as Leave[]
  }

  async createLeave(data: NormalizedLeaveInput & { created_by: string }): Promise<Leave> {
    const supabase = await createClient()
    const { data: leave, error } = await supabase
      .from('leaves')
      .insert(data)
      .select(LEAVE_COLUMNS)
      .single()
    if (error) throw new Error(error.message)
    return leave as unknown as Leave
  }

  async updateLeave(id: string, data: NormalizedLeaveInput): Promise<Leave> {
    const supabase = await createClient()
    const { data: leave, error } = await supabase
      .from('leaves')
      .update(data)
      .eq('id', id)
      .select(LEAVE_COLUMNS)
      .single()
    if (error) throw new Error(error.message)
    return leave as unknown as Leave
  }

  async deleteLeave(id: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase.from('leaves').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }
}
