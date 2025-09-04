import { useState, useEffect, useCallback } from 'react'
import { useSupabasePublic } from '@/hooks/useSupabasePublic'
import { useAnonymousAuth } from '@/components/auth/AnonymousAuthProvider'
import type { CustomerAddress, AddressFormData } from '@/types/checkout'
import { toast } from 'sonner'

interface UseAddressesReturn {
  addresses: CustomerAddress[]
  loading: boolean
  error: string | null
  defaultAddress: CustomerAddress | null
  createAddress: (data: AddressFormData) => Promise<CustomerAddress | null>
  updateAddress: (id: string, data: Partial<AddressFormData>) => Promise<boolean>
  deleteAddress: (id: string) => Promise<boolean>
  setDefaultAddress: (id: string) => Promise<boolean>
  refreshAddresses: () => Promise<void>
}

export function useAddresses(): UseAddressesReturn {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { supabase } = useSupabasePublic()
  const { customer } = useAnonymousAuth()

  const defaultAddress = addresses.find(addr => addr.is_default) || null

  // carrega os endereços do cliente
  const loadAddresses = useCallback(async () => {
    if (!customer?.id) {
      setAddresses([])
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', customer.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      setAddresses(data || [])
    } catch (err) {
      console.error('Error loading addresses:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar endereços'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [customer?.id, supabase])

  // cria novo endereço
  const createAddress = useCallback(async (data: AddressFormData): Promise<CustomerAddress | null> => {
    if (!customer?.id) {
      toast.error('Você precisa estar logado para criar endereços')
      return null
    }

    try {
      setLoading(true)
      setError(null)

      // se for o primeiro endereço ou marcado como padrão, garante que não haja outro padrão
      if (data.is_default || addresses.length === 0) {
        await supabase
          .from('customer_addresses')
          .update({ is_default: false })
          .eq('customer_id', customer.id)
      }

      const { data: newAddress, error: createError } = await supabase
        .from('customer_addresses')
        .insert({
          ...data,
          customer_id: customer.id,
          is_default: data.is_default || addresses.length === 0,
        })
        .select()
        .single()

      if (createError) {
        throw new Error(createError.message)
      }

      setAddresses(prev => [newAddress, ...prev])
      toast.success('Endereço cadastrado com sucesso')
      return newAddress

    } catch (err) {
      console.error('Error creating address:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao cadastrar endereço'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [customer?.id, addresses.length, supabase])

  // atualiza endereço existente
  const updateAddress = useCallback(async (id: string, data: Partial<AddressFormData>): Promise<boolean> => {
    if (!customer?.id) {
      toast.error('Você precisa estar logado para atualizar endereços')
      return false
    }

    try {
      setLoading(true)
      setError(null)

      // se for marcado como padrão, desmarca outros padrões
      if (data.is_default) {
        await supabase
          .from('customer_addresses')
          .update({ is_default: false })
          .eq('customer_id', customer.id)
          .neq('id', id)
      }

      const { data: updatedAddress, error: updateError } = await supabase
        .from('customer_addresses')
        .update(data)
        .eq('id', id)
        .eq('customer_id', customer.id)
        .select()
        .single()

      if (updateError) {
        throw new Error(updateError.message)
      }

      setAddresses(prev =>
        prev.map(addr => addr.id === id ? updatedAddress : addr)
      )
      toast.success('Endereço atualizado com sucesso')
      return true

    } catch (err) {
      console.error('Error updating address:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar endereço'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [customer?.id, supabase])

  const deleteAddress = useCallback(async (id: string): Promise<boolean> => {
    if (!customer?.id) {
      toast.error('Você precisa estar logado para remover endereços')
      return false
    }

    try {
      setLoading(true)
      setError(null)

      const addressToDelete = addresses.find(addr => addr.id === id)
      if (!addressToDelete) {
        throw new Error('Endereço não encontrado')
      }

      const { error: deleteError } = await supabase
        .from('customer_addresses')
        .delete()
        .eq('id', id)
        .eq('customer_id', customer.id)

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      // se o endereço deletado era padrão, define o primeiro restante como padrão
      const remainingAddresses = addresses.filter(addr => addr.id !== id)
      if (addressToDelete.is_default && remainingAddresses.length > 0) {
        await supabase
          .from('customer_addresses')
          .update({ is_default: true })
          .eq('id', remainingAddresses[0].id)
          .eq('customer_id', customer.id)

        remainingAddresses[0].is_default = true
      }

      setAddresses(remainingAddresses)
      toast.success('Endereço removido com sucesso')
      return true

    } catch (err) {
      console.error('Error deleting address:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover endereço'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [customer?.id, addresses, supabase])

  const setDefaultAddress = useCallback(async (id: string): Promise<boolean> => {
    return updateAddress(id, { is_default: true })
  }, [updateAddress])

  const refreshAddresses = useCallback(async () => {
    await loadAddresses()
  }, [loadAddresses])

  useEffect(() => {
    loadAddresses()
  }, [loadAddresses])

  return {
    addresses,
    loading,
    error,
    defaultAddress,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    refreshAddresses,
  }
}
