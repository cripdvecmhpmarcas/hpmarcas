import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface UseOrderPollingOptions {
  enabled?: boolean
  interval?: number
  onStatusChange?: (newStatus: string) => void
}

export function useOrderPolling(
  orderId: string | null,
  currentPaymentStatus: string | null,
  options: UseOrderPollingOptions = {}
) {
  const { enabled = true, interval = 5000, onStatusChange } = options
  const router = useRouter()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!orderId || !enabled || !currentPaymentStatus) return

    // Se o pagamento já foi aprovado, redirecionar imediatamente
    if (currentPaymentStatus === 'approved' || currentPaymentStatus === 'paid') {
      toast.success('Pagamento confirmado! Redirecionando...')
      setTimeout(() => {
        router.replace(`/checkout/sucesso/${orderId}`)
      }, 1000)
      return
    }

    // Iniciar polling apenas se o pagamento estiver pendente
    if (currentPaymentStatus === 'pending') {
      intervalRef.current = setInterval(async () => {
        try {
          const response = await fetch(`/api/orders/${orderId}/status`)
          const statusData = await response.json()

          if (response.ok && statusData.paymentStatus) {
            // Se o status mudou para aprovado
            if (statusData.paymentStatus === 'approved' || statusData.paymentStatus === 'paid') {
              if (intervalRef.current) {
                clearInterval(intervalRef.current)
              }
              
              toast.success('Pagamento aprovado! Seu pedido foi confirmado.')
              
              // Notificar mudança de status se callback fornecido
              if (onStatusChange) {
                onStatusChange(statusData.paymentStatus)
              }

              setTimeout(() => {
                router.replace(`/checkout/sucesso/${orderId}`)
              }, 2000)
            }
          }
        } catch (error) {
          console.error('Error polling order status:', error)
        }
      }, interval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [orderId, currentPaymentStatus, enabled, interval, router, onStatusChange])

  // Função para parar o polling manualmente
  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  return { stopPolling }
}