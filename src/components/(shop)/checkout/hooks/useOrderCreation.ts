import { useState, useCallback } from 'react'
import { useAnonymousAuth } from '@/components/auth/AnonymousAuthProvider'
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  CartDisplayItem
} from '@/types/checkout'
import { toast } from 'sonner'

interface UseOrderCreationReturn {
  creating: boolean
  error: string | null
  createOrder: (orderData: CreateOrderRequest) => Promise<CreateOrderResponse | null>
  createOrderFromCart: (
    cartItems: CartDisplayItem[],
    shippingAddressId: string,
    shippingCost: number,
    shippingMethod?: string,
    couponCode?: string
  ) => Promise<CreateOrderResponse | null>
}

export function useOrderCreation(): UseOrderCreationReturn {
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { customer } = useAnonymousAuth()

  // cria pedido com dados customizados
  const createOrder = useCallback(async (orderData: CreateOrderRequest): Promise<CreateOrderResponse | null> => {
    try {
      setCreating(true)
      setError(null)

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      const result: CreateOrderResponse = await response.json()

      if (!response.ok || !result.success) {
        const errorMessage = result.error || 'Erro ao criar pedido'
        setError(errorMessage)

        // mostra erros de validação específicos se disponíveis
        if (result.validation_errors) {
          if (result.validation_errors.stock) {
            const stockErrors = result.validation_errors.stock
            if (Array.isArray(stockErrors)) {
              stockErrors.forEach((error: unknown) => {
                if (typeof error === 'object' && error !== null && 'product_name' in error) {
                  const stockError = error as { product_name: string; requested: number; available: number }
                  toast.error(
                    `${stockError.product_name}: Disponível ${stockError.available}, solicitado ${stockError.requested}`
                  )
                } else {
                  toast.error(String(error))
                }
              })
            } else {
              toast.error('Erro de estoque')
            }
          } else {
            toast.error(errorMessage)
          }
        } else {
          toast.error(errorMessage)
        }

        return null
      }

      toast.success('Pedido criado com sucesso!')
      return result

    } catch (err) {
      console.error('Error creating order:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro na comunicação com o servidor'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setCreating(false)
    }
  }, [])

  // cria pedido a partir dos itens do carrinho
  const createOrderFromCart = useCallback(async (
    cartItems: CartDisplayItem[],
    shippingAddressId: string,
    shippingCost: number,
    shippingMethod?: string,
    couponCode?: string
  ): Promise<CreateOrderResponse | null> => {
    if (!customer?.id) {
      toast.error('Você precisa estar logado para criar pedidos')
      return null
    }

    if (!cartItems.length) {
      toast.error('Carrinho vazio')
      return null
    }

    // converte itens do carrinho para o formato de itens do pedido
    const items = cartItems.map(item => ({
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.price,
    }))

    const orderData: CreateOrderRequest = {
      customer_id: customer.id,
      shipping_address_id: shippingAddressId,
      shipping_cost: shippingCost,
      shipping_method: shippingMethod,
      coupon_code: couponCode,
      items,
    }

    return createOrder(orderData)
  }, [customer?.id, createOrder])

  return {
    creating,
    error,
    createOrder,
    createOrderFromCart,
  }
}
