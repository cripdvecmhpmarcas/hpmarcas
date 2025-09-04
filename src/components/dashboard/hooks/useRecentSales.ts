import { useEffect, useState } from 'react'
import { useSupabaseAdmin } from '@/hooks/useSupabaseAdmin'
import type { RecentSaleData } from '@/types/dashboard'

export function useRecentSales() {
  const [recentSales, setRecentSales] = useState<RecentSaleData[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useSupabaseAdmin()

  useEffect(() => {
    const fetchRecentSales = async () => {
      try {
        const { data: salesData, error: salesError } = await supabase
          .from('sales')
          .select(`
            id,
            customer_name,
            total,
            payment_method,
            created_at,
            status,
            sale_items(quantity)
          `)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(10)

        if (salesError) {
          console.error('Error fetching recent sales:', salesError)
          setRecentSales([])
          return
        }

        if (salesData) {
          const sales: RecentSaleData[] = salesData.map(sale => ({
            id: sale.id,
            customerName: sale.customer_name,
            total: sale.total,
            paymentMethod: sale.payment_method,
            itemCount: Array.isArray(sale.sale_items)
              ? sale.sale_items.reduce((sum, item) => sum + item.quantity, 0)
              : 0,
            createdAt: sale.created_at,
            status: sale.status
          }))

          setRecentSales(sales)
        }
      } catch (error) {
        console.error('Error fetching recent sales:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentSales()
  }, [supabase])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return diffInMinutes < 1 ? 'Agora' : `${diffInMinutes}min atrás`
    }

    if (diffInHours < 24) {
      return `${diffInHours}h atrás`
    }

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash':
        return 'Dinheiro'
      case 'card':
        return 'Cartão'
      case 'pix':
        return 'PIX'
      case 'transfer':
        return 'Transferência'
      case 'check':
        return 'Cheque'
      default:
        return method
    }
  }

  return {
    recentSales,
    loading,
    formatCurrency,
    formatDate,
    getPaymentMethodLabel
  }
}
