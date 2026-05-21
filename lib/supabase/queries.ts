import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/supabase/types'

/**
 * Deduplicated within the same RSC render-pass via React cache().
 * Layout + page both call this — DB hit happens once per request.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

/**
 * Full profile row, deduplicated within the same RSC render-pass.
 * Returns null when no authenticated session.
 */
export const getCurrentProfile = cache(async () => {
  const user = await getCurrentUser()
  if (!user) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  return data as Profile | null
})
