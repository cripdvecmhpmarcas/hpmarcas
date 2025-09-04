import { useState, useEffect, useCallback } from 'react'
import { useSupabaseAdmin } from '@/hooks/useSupabaseAdmin'
import { CustomerAddress } from '@/types/customers'

export interface UseCustomerAddressesReturn {
  addresses: CustomerAddress[]
  loading: boolean
  error: string | null
  refreshData: () => Promise<void>
  defaultAddress: CustomerAddress | null
}

export function useCustomerAddresses(customerId: string | null): UseCustomerAddressesReturn {
  const supabase = useSupabaseAdmin()
  const [addresses, setAddresses] = useState<CustomerAddress[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAddresses = useCallback(async () => {
    if (!customerId) {
      setAddresses([])
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data: addressesData, error: addressesError } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', customerId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (addressesError) {
        throw new Error(`Erro ao carregar endereços: ${addressesError.message}`)
      }

      setAddresses(addressesData || [])

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar endereços'
      setError(message)
      console.error('Erro ao carregar endereços:', err)
    } finally {
      setLoading(false)
    }
  }, [customerId, supabase])

  const refreshData = useCallback(async () => {
    await loadAddresses()
  }, [loadAddresses])

  useEffect(() => {
    loadAddresses()
  }, [loadAddresses])

  const defaultAddress = addresses.find(addr => addr.is_default) || addresses[0] || null

  return {
    addresses,
    loading,
    error,
    refreshData,
    defaultAddress
  }
}
