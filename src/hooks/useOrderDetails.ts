import { useState, useEffect, useCallback } from 'react'
import { useSupabaseCustomer } from '@/hooks/useSupabaseCustomer'
import type { EcommerceOrder } from '@/types/checkout'

interface UseOrderDetailsOptions {
  customerId?: string
}

interface UseOrderDetailsReturn {
  order: EcommerceOrder | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useOrderDetails(
  orderId: string | null,
  options: UseOrderDetailsOptions = {}
): UseOrderDetailsReturn {
  const { customerId } = options
  const supabase = useSupabaseCustomer()
  const [order, setOrder] = useState<EcommerceOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrder = useCallback(async () => {
    if (!orderId || !customerId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Buscar dados do pedido diretamente da tabela sales
      const { data, error: fetchError } = await supabase
        .from('sales')
        .select(`
          *,
          customers!inner(name, email)
        `)
        .eq('id', orderId)
        .eq('customer_id', customerId)
        .single()

      if (fetchError) {
        console.error('Error fetching order:', fetchError)
        setError('Pedido não encontrado')
        return
      }

      // Buscar endereço de entrega se existir shipping_address_id
      let shippingAddress = null
      if (data.shipping_address_id) {
        const { data: addressData } = await supabase
          .from('customer_addresses')
          .select('*')
          .eq('id', data.shipping_address_id)
          .single()

        shippingAddress = addressData
      }

      // Buscar items do pedido separadamente
      const { data: items } = await supabase
        .from('sale_items')
        .select(`
          *,
          product:products(*)
        `)
        .eq('sale_id', orderId)

      const orderData: EcommerceOrder = {
        ...data,
        items: items || [],
        total_amount: data.total,
        subtotal_amount: data.subtotal,
        coupon_discount: data.discount_amount || 0,
        shipping_cost: data.shipping_cost || 0,
        street: shippingAddress?.street,
        number: shippingAddress?.number,
        complement: shippingAddress?.complement,
        neighborhood: shippingAddress?.neighborhood,
        city: shippingAddress?.city,
        state: shippingAddress?.state,
        zip_code: shippingAddress?.zip_code,
        shipping_name: shippingAddress?.name || data.customers?.name
      }

      setOrder(orderData)
    } catch (err) {
      console.error('Error:', err)
      setError('Erro ao carregar pedido')
    } finally {
      setLoading(false)
    }
  }, [orderId, customerId, supabase])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  return {
    order,
    loading,
    error,
    refetch: fetchOrder
  }
}