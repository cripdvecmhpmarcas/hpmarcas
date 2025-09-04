import { useMemo, useEffect, useState } from 'react'
import { createPublicClient } from '@/lib/supabase'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// NÃO MEXE !!!!

interface UseSupabasePublicReturn {
  supabase: SupabaseClient<Database>
  user: User | null
}

export function useSupabasePublic(): UseSupabasePublicReturn {
  const supabase = useMemo(() => {
    return createPublicClient()
  }, [])

  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return { supabase, user }
}
