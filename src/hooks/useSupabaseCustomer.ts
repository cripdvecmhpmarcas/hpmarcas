import { useMemo } from 'react'
import { createCustomerClient } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Custom hook that provides a singleton Supabase customer client instance.
 * 
 * This hook ensures that only one customer client instance is created per component
 * lifecycle, preventing multiple GoTrueClient instances and improving performance.
 * 
 * @returns The singleton Supabase customer client instance
 */
export function useSupabaseCustomer(): SupabaseClient<Database> {
  // Use useMemo to ensure the client is created only once per component lifecycle
  // and doesn't change on re-renders, preventing useEffect re-triggers
  const supabase = useMemo(() => {
    return createCustomerClient()
  }, [])

  return supabase
}