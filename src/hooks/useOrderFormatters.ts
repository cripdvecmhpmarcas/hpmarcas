import { useMemo } from 'react'
import {
  CheckCircle,
  Package,
  Truck,
  Clock,
  AlertCircle
} from 'lucide-react'

export interface PaymentStatusInfo {
  color: string
  text: string
  description: string
  icon: typeof CheckCircle
  canRedirect?: boolean
}

export interface OrderStatusInfo {
  color: string
  text: string
  icon: typeof CheckCircle
}

export function useOrderFormatters() {
  const formatCurrency = useMemo(() => {
    return (amount: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(amount)
    }
  }, [])

  const getPaymentStatusInfo = useMemo(() => {
    return (status: string | null): PaymentStatusInfo => {
      if (!status) {
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          text: 'Não informado',
          description: 'Status de pagamento não disponível',
          icon: AlertCircle,
          canRedirect: false
        }
      }

      switch (status) {
        case 'approved':
        case 'paid':
          return {
            color: 'bg-green-100 text-green-800 border-green-200',
            text: 'Pago',
            description: 'Pagamento confirmado',
            icon: CheckCircle,
            canRedirect: true
          }
        case 'pending':
          return {
            color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            text: 'Pendente',
            description: 'Aguardando confirmação do pagamento',
            icon: Clock,
            canRedirect: false
          }
        case 'processing':
          return {
            color: 'bg-blue-100 text-blue-800 border-blue-200',
            text: 'Processando',
            description: 'Processando pagamento',
            icon: Clock,
            canRedirect: false
          }
        case 'rejected':
        case 'cancelled':
        case 'failed':
          return {
            color: 'bg-red-100 text-red-800 border-red-200',
            text: 'Falhou',
            description: 'Pagamento não foi processado',
            icon: AlertCircle,
            canRedirect: false
          }
        default:
          return {
            color: 'bg-gray-100 text-gray-800 border-gray-200',
            text: 'Desconhecido',
            description: 'Status desconhecido',
            icon: Clock,
            canRedirect: false
          }
      }
    }
  }, [])

  const getOrderStatusInfo = useMemo(() => {
    return (status: string): OrderStatusInfo => {
      switch (status) {
        case 'confirmed':
          return {
            color: 'bg-green-100 text-green-800 border-green-200',
            text: 'Confirmado',
            icon: CheckCircle
          }
        case 'processing':
          return {
            color: 'bg-blue-100 text-blue-800 border-blue-200',
            text: 'Processando',
            icon: Clock
          }
        case 'shipped':
          return {
            color: 'bg-purple-100 text-purple-800 border-purple-200',
            text: 'Enviado',
            icon: Truck
          }
        case 'delivered':
          return {
            color: 'bg-green-100 text-green-800 border-green-200',
            text: 'Entregue',
            icon: Package
          }
        default:
          return {
            color: 'bg-gray-100 text-gray-800 border-gray-200',
            text: 'Pendente',
            icon: Clock
          }
      }
    }
  }, [])

  return {
    formatCurrency,
    getPaymentStatusInfo,
    getOrderStatusInfo
  }
}
