import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

// Cliente para componentes do servidor (Server Components)
export const createServerClient = () => createServerComponentClient<Database>({ cookies })

// Cliente Service Role para operações administrativas no servidor
export const createServiceRoleClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables for service role client')
  }
  
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Função para obter usuário no servidor
export const getServerUser = async () => {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Função para obter sessão no servidor
export const getServerSession = async () => {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}
