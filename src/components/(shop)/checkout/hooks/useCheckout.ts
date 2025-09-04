import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type {
  CheckoutData,
  CheckoutStep,
  ShippingOption,
  CustomerAddress,
  CouponValidationResponse,
  OrderSummary,
  CheckoutValidation,
  CreateOrderResponse
} from '@/types/checkout'
import { useAddresses } from './useAddresses'
import { useOrderCreation } from './useOrderCreation'
import { useOrderSession } from './useOrderSession'
import { useCart } from '@/components/(shop)/carrinho/hooks/useCart'
import { useCartItems } from '@/components/(shop)/carrinho/hooks/useCartItems'
import { useAnonymousAuth } from '@/components/auth/AnonymousAuthProvider'
import { toast } from 'sonner'

interface UseCheckoutReturn {
  checkoutData: CheckoutData
  currentStep: CheckoutStep
  loading: boolean

  canProceedToStep: (step: CheckoutStep) => boolean
  validateCurrentStep: () => CheckoutValidation

  goToStep: (step: CheckoutStep) => void
  nextStep: () => void
  previousStep: () => void

  updateAddress: (address: CustomerAddress) => void
  updateShipping: (option: ShippingOption) => void
  updateCoupon: (code: string, discount: number) => void
  removeCoupon: () => void

  orderSummary: OrderSummary

  validateCoupon: (code: string) => Promise<CouponValidationResponse | null>
  calculateShipping: (destinationZip: string) => Promise<ShippingOption[]>
  createOrderForPayment: () => Promise<CreateOrderResponse | null>
  submitOrder: () => Promise<void>

  addresses: ReturnType<typeof useAddresses>
  cart: ReturnType<typeof useCart>
  cartItems: ReturnType<typeof useCartItems>
  orderCreation: ReturnType<typeof useOrderCreation>
  orderSession: ReturnType<typeof useOrderSession>
}

const CHECKOUT_STEPS: CheckoutStep[] = ['address', 'shipping', 'payer-data', 'payment', 'review', 'confirmation']

export function useCheckout(): UseCheckoutReturn {
  const router = useRouter()
  const { customer } = useAnonymousAuth()

  const addresses = useAddresses()
  const cart = useCart()
  const cartItems = useCartItems(cart.cartItems)
  const orderCreation = useOrderCreation()
  const orderSession = useOrderSession()

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('address')
  const [loading, setLoading] = useState(false)

  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    step: 'address',
    customer_id: customer?.id || '',
    customer_name: customer?.name || '',
    email: customer?.email || '',
    shipping_cost: 0,
    payment_method: 'pix',
    subtotal: 0,
    total: 0,
    items_count: 0,
  })

  const updateCheckoutData = useCallback(() => {
    setCheckoutData(prev => ({
      ...prev,
      customer_id: customer?.id || '',
      customer_name: customer?.name || '',
      email: customer?.email || '',
      subtotal: cartItems.summary.subtotal,
      total: cartItems.summary.subtotal + prev.shipping_cost - (prev.coupon_discount || 0),
      items_count: cartItems.summary.itemCount,
    }))
  }, [customer, cartItems.summary])

  useEffect(() => {
    updateCheckoutData()
  }, [updateCheckoutData])

  const orderSummary: OrderSummary = useMemo(() => {
    const subtotal = cartItems.summary.subtotal
    const shippingCost = checkoutData.shipping_cost
    const couponDiscount = checkoutData.coupon_discount || 0
    const total = subtotal + shippingCost - couponDiscount

    return {
      subtotal,
      shipping_cost: shippingCost,
      coupon_discount: couponDiscount,
      total: Math.max(0, total),
      items_count: cartItems.summary.itemCount,
      estimated_delivery: checkoutData.shipping_option?.delivery_time_description,
    }
  }, [cartItems.summary, checkoutData.shipping_cost, checkoutData.coupon_discount, checkoutData.shipping_option])

  const validateCurrentStep = useCallback((): CheckoutValidation => {
    const errors: Record<string, string[]> = {}
    const warnings: Record<string, string[]> = {}

    switch (currentStep) {
      case 'address':
        if (!checkoutData.shipping_address) {
          errors.address = ['Selecione um endereço de entrega']
        }
        break

      case 'shipping':
        if (!checkoutData.shipping_option) {
          errors.shipping = ['Selecione uma opção de entrega']
        }
        break

      case 'payer-data':
        // A validação do CPF será feita no componente, aqui apenas validamos se chegou até aqui
        // No futuro, pode adicionar validação adicional se necessário
        break

      case 'payment':
        if (!checkoutData.payment_method) {
          errors.payment = ['Selecione um método de pagamento']
        }
        break

      case 'review':
        if (!checkoutData.shipping_address) {
          errors.address = ['Endereço de entrega obrigatório']
        }
        if (!checkoutData.shipping_option) {
          errors.shipping = ['Opção de entrega obrigatória']
        }
        if (cartItems.displayItems.length === 0) {
          errors.cart = ['Carrinho vazio']
        }
        const outOfStockItems = cartItems.displayItems.filter(item => !item.isAvailable)
        if (outOfStockItems.length > 0) {
          errors.stock = outOfStockItems.map(item => `${item.name} está fora de estoque`)
        }
        break
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      warnings,
    }
  }, [currentStep, checkoutData, cartItems.displayItems])

  const canProceedToStep = useCallback((step: CheckoutStep): boolean => {
    const stepIndex = CHECKOUT_STEPS.indexOf(step)
    const currentStepIndex = CHECKOUT_STEPS.indexOf(currentStep)

    if (stepIndex <= currentStepIndex) {
      return true
    }

    return validateCurrentStep().valid
  }, [currentStep, validateCurrentStep])

  const goToStep = useCallback((step: CheckoutStep) => {
    if (canProceedToStep(step)) {
      setCurrentStep(step)
      setCheckoutData(prev => ({ ...prev, step }))
    }
  }, [canProceedToStep])

  const nextStep = useCallback(() => {
    const currentIndex = CHECKOUT_STEPS.indexOf(currentStep)
    if (currentIndex < CHECKOUT_STEPS.length - 1) {
      const nextStepName = CHECKOUT_STEPS[currentIndex + 1]
      goToStep(nextStepName)
    }
  }, [currentStep, goToStep])

  const previousStep = useCallback(() => {
    const currentIndex = CHECKOUT_STEPS.indexOf(currentStep)
    if (currentIndex > 0) {
      const prevStepName = CHECKOUT_STEPS[currentIndex - 1]
      goToStep(prevStepName)
    }
  }, [currentStep, goToStep])

  const updateAddress = useCallback((address: CustomerAddress) => {
    setCheckoutData(prev => ({
      ...prev,
      shipping_address: address,
    }))
  }, [])

  const updateShipping = useCallback((option: ShippingOption) => {
    setCheckoutData(prev => ({
      ...prev,
      shipping_option: option,
      shipping_method: option.method,
      shipping_cost: option.price,
    }))
  }, [])

  const updateCoupon = useCallback((code: string, discount: number) => {
    setCheckoutData(prev => ({
      ...prev,
      coupon_code: code,
      coupon_discount: discount,
    }))
  }, [])

  const removeCoupon = useCallback(() => {
    setCheckoutData(prev => ({
      ...prev,
      coupon_code: undefined,
      coupon_discount: 0,
    }))
  }, [])

  const validateCoupon = useCallback(async (code: string): Promise<CouponValidationResponse | null> => {
    if (!customer?.id) return null

    try {
      setLoading(true)

      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          customer_id: customer.id,
          order_total: orderSummary.subtotal + orderSummary.shipping_cost,
        }),
      })

      const result: CouponValidationResponse = await response.json()

      if (result.valid) {
        updateCoupon(code, result.discount_amount || 0)
        toast.success(`Cupom aplicado! Desconto de R$ ${result.discount_amount?.toFixed(2)}`)
      } else {
        toast.error(result.error || 'Cupom inválido')
      }

      return result
    } catch (err) {
      console.error('Error validating coupon:', err)
      toast.error('Erro ao validar cupom')
      return null
    } finally {
      setLoading(false)
    }
  }, [customer?.id, orderSummary, updateCoupon])

  const calculateShipping = useCallback(async (destinationZip: string): Promise<ShippingOption[]> => {
    try {
      setLoading(true)

      const items = cartItems.displayItems.map(item => ({
        weight: (item.weight || 500) / 1000, // Convert grams to kg, default 500g
        length: item.length || 20,  // Default 20cm
        width: item.width || 15,    // Default 15cm
        height: item.height || 5,   // Default 5cm
        value: item.currentPrice,
      }))

      const response = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin_zip_code: '01310-100', // CEP da empresa
          destination_zip_code: destinationZip,
          items,
        }),
      })

      const result = await response.json()

      if (result.success) {
        return result.options
      } else {
        toast.error(result.error || 'Erro ao calcular frete')
        return []
      }
    } catch (err) {
      console.error('Error calculating shipping:', err)
      toast.error('Erro ao calcular frete')
      return []
    } finally {
      setLoading(false)
    }
  }, [cartItems.displayItems])

  // Cria pedido para pagamento (sem redirecionar) - COM PROTEÇÃO CONTRA DUPLICAÇÃO
  const createOrderForPayment = useCallback(async () => {

    // PRIMEIRO: Verifica se já existe um pedido ativo na sessão E se ainda existe no backend
    if (orderSession.hasActiveOrder && orderSession.currentOrderSession) {
      const orderExists = await orderSession.validateOrderExists()

      if (orderExists) {

        // Retorna os dados do pedido existente
        return {
          success: true,
          order: {
            id: orderSession.currentOrderSession.orderId,
            total_amount: orderSession.currentOrderSession.total_amount,
            payment_external_id: orderSession.currentOrderSession.preferenceId
          }
        } as CreateOrderResponse
      } else {
        orderSession.clearOrderSession()
      }
    }

    // SEGUNDO: Validações antes de criar novo pedido
    if (!checkoutData.shipping_address) {
      toast.error('Endereço de entrega obrigatório')
      return null
    }

    const validation = validateCurrentStep()
    if (!validation.valid) {
      toast.error('Verifique os dados antes de finalizar o pedido')
      return null
    }

    try {
      setLoading(true)

      const result = await orderCreation.createOrderFromCart(
        cartItems.displayItems,
        checkoutData.shipping_address.id,
        checkoutData.shipping_cost,
        checkoutData.shipping_method,
        checkoutData.coupon_code
      )


      // TERCEIRO: Se sucesso, salva na sessão
      if (result?.success && result.order) {
        orderSession.createOrderSession(result.order)
      }

      return result
    } catch (err) {
      console.error('Error creating order for payment:', err)
      toast.error('Erro ao criar pedido')
      return null
    } finally {
      setLoading(false)
    }
  }, [checkoutData, validateCurrentStep, orderCreation, cartItems.displayItems, orderSession])

  const submitOrder = useCallback(async () => {
    // Se já existe pedido na sessão, finaliza ele
    if (orderSession.hasActiveOrder && orderSession.currentOrderSession) {
      try {
        setLoading(true)
        cart.clearCart()
        orderSession.clearOrderSession()
        toast.success('Pedido finalizado com sucesso!')
        router.push(`/checkout/status/${orderSession.currentOrderSession.orderId}`)
        return
      } catch (err) {
        console.error('Error finalizing existing order:', err)
        toast.error('Erro ao finalizar pedido')
        return
      } finally {
        setLoading(false)
      }
    }

    // Caso contrário, cria novo pedido (fallback)
    if (!checkoutData.shipping_address) {
      toast.error('Endereço de entrega obrigatório')
      return
    }

    const validation = validateCurrentStep()
    if (!validation.valid) {
      toast.error('Verifique os dados antes de finalizar o pedido')
      return
    }

    try {
      setLoading(true)

      const result = await orderCreation.createOrderFromCart(
        cartItems.displayItems,
        checkoutData.shipping_address.id,
        checkoutData.shipping_cost,
        checkoutData.shipping_method,
        checkoutData.coupon_code
      )

      if (result?.success && result.order) {
        cart.clearCart()
        orderSession.clearOrderSession()
        toast.success('Pedido criado com sucesso! Redirecionando para acompanhamento...')
        router.push(`/checkout/status/${result.order.id}`)
      }
    } catch (err) {
      console.error('Error submitting order:', err)
      toast.error('Erro ao finalizar pedido')
    } finally {
      setLoading(false)
    }
  }, [checkoutData, validateCurrentStep, orderCreation, cartItems.displayItems, cart, router, orderSession])

  return {
    checkoutData,
    currentStep,
    loading,

    canProceedToStep,
    validateCurrentStep,

    goToStep,
    nextStep,
    previousStep,

    updateAddress,
    updateShipping,
    updateCoupon,
    removeCoupon,

    orderSummary,

    validateCoupon,
    calculateShipping,
    createOrderForPayment,
    submitOrder,

    addresses,
    cart,
    cartItems,
    orderCreation,
    orderSession,
  }
}
