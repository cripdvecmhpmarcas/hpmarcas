import { useMemo } from 'react'
import { createAdminClient } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export function useSupabaseAdmin(): SupabaseClient<Database> {
  const supabase = useMemo(() => {
    return createAdminClient()
  }, [])

  return supabase
}
