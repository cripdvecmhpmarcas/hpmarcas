import { useState, useCallback, useEffect } from 'react'
import { useAnonymousAuth } from '@/components/auth/AnonymousAuthProvider'
import type { CreateOrderResponse } from '@/types/checkout'
import { toast } from 'sonner'

interface OrderSessionData {
  orderId: string
  preferenceId: string
  created_at: string
  customer_id: string
  total_amount: number
  step: string
}

interface UseOrderSessionReturn {
  currentOrderSession: OrderSessionData | null
  hasActiveOrder: boolean
  createOrderSession: (order: CreateOrderResponse['order']) => void
  updateOrderSession: (updates: Partial<OrderSessionData>) => void
  clearOrderSession: () => void
  isOrderSessionValid: () => boolean
  validateOrderExists: () => Promise<boolean>
}

const SESSION_KEY = 'hp_checkout_order_session'
const SESSION_EXPIRY_HOURS = 2

export function useOrderSession(): UseOrderSessionReturn {
  const { customer } = useAnonymousAuth()
  const [currentOrderSession, setCurrentOrderSession] = useState<OrderSessionData | null>(null)

  // Carrega sessão do localStorage na inicialização
  useEffect(() => {
    if (!customer?.id) {
      setCurrentOrderSession(null)
      return
    }

    try {
      const stored = localStorage.getItem(`${SESSION_KEY}_${customer.id}`)
      if (stored) {
        const session: OrderSessionData = JSON.parse(stored)
        
        // Verifica se a sessão não expirou
        const createdAt = new Date(session.created_at)
        const now = new Date()
        const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
        
        if (diffHours < SESSION_EXPIRY_HOURS && session.customer_id === customer.id) {
          setCurrentOrderSession(session)
        } else {
          // Remove sessão expirada
          localStorage.removeItem(`${SESSION_KEY}_${customer.id}`)
          setCurrentOrderSession(null)
        }
      }
    } catch (error) {
      console.error('Error loading order session:', error)
      localStorage.removeItem(`${SESSION_KEY}_${customer.id}`)
      setCurrentOrderSession(null)
    }
  }, [customer?.id])

  // Cria nova sessão de pedido
  const createOrderSession = useCallback((order: CreateOrderResponse['order']) => {
    if (!order || !customer?.id) {
      console.error('Cannot create order session: missing order or customer')
      return
    }

    const sessionData: OrderSessionData = {
      orderId: order.id,
      preferenceId: order.payment_external_id || order.id,
      created_at: new Date().toISOString(),
      customer_id: customer.id,
      total_amount: order.total_amount,
      step: 'payment'
    }

    try {
      localStorage.setItem(`${SESSION_KEY}_${customer.id}`, JSON.stringify(sessionData))
      setCurrentOrderSession(sessionData)
    } catch (error) {
      console.error('Error saving order session:', error)
      toast.error('Erro ao salvar sessão do pedido')
    }
  }, [customer?.id])

  // Atualiza sessão existente
  const updateOrderSession = useCallback((updates: Partial<OrderSessionData>) => {
    if (!currentOrderSession || !customer?.id) return

    const updatedSession = {
      ...currentOrderSession,
      ...updates
    }

    try {
      localStorage.setItem(`${SESSION_KEY}_${customer.id}`, JSON.stringify(updatedSession))
      setCurrentOrderSession(updatedSession)
    } catch (error) {
      console.error('Error updating order session:', error)
    }
  }, [currentOrderSession, customer?.id])

  // Limpa sessão atual
  const clearOrderSession = useCallback(() => {
    if (!customer?.id) return

    try {
      localStorage.removeItem(`${SESSION_KEY}_${customer.id}`)
      setCurrentOrderSession(null)
    } catch (error) {
      console.error('Error clearing order session:', error)
    }
  }, [customer?.id])

  // Verifica se a sessão atual é válida
  const isOrderSessionValid = useCallback((): boolean => {
    if (!currentOrderSession) return false

    try {
      // Verifica expiração
      const createdAt = new Date(currentOrderSession.created_at)
      const now = new Date()
      const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
      
      if (diffHours >= SESSION_EXPIRY_HOURS) {
        clearOrderSession()
        return false
      }

      // Verifica se pertence ao customer atual
      if (currentOrderSession.customer_id !== customer?.id) {
        clearOrderSession()
        return false
      }

      return true
    } catch (error) {
      console.error('Error validating order session:', error)
      clearOrderSession()
      return false
    }
  }, [currentOrderSession, customer?.id, clearOrderSession])

  // Valida se o pedido ainda existe no backend
  const validateOrderExists = useCallback(async (): Promise<boolean> => {
    if (!currentOrderSession) return false

    try {
      const response = await fetch(`/api/orders/${currentOrderSession.orderId}`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        console.log('Pedido não encontrado no backend, limpando sessão')
        clearOrderSession()
        return false
      }

      // Verifica se o pedido pertence ao customer atual
      if (result.order?.customer_id !== customer?.id) {
        console.log('Pedido não pertence ao customer atual, limpando sessão')
        clearOrderSession()
        return false
      }

      // Verifica se o pedido não foi finalizado ainda
      if (result.order?.status === 'confirmed' || result.order?.payment_status === 'approved') {
        console.log('Pedido já foi finalizado, limpando sessão')
        clearOrderSession()
        return false
      }

      return true
    } catch (error) {
      console.error('Erro ao validar pedido no backend:', error)
      clearOrderSession()
      return false
    }
  }, [currentOrderSession, customer?.id, clearOrderSession])

  const hasActiveOrder = currentOrderSession !== null && isOrderSessionValid()

  return {
    currentOrderSession,
    hasActiveOrder,
    createOrderSession,
    updateOrderSession,
    clearOrderSession,
    isOrderSessionValid,
    validateOrderExists
  }
}