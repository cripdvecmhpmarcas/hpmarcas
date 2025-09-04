import { useEffect, useState } from 'react'
import { useSupabaseAdmin } from '@/hooks/useSupabaseAdmin'
import type { PaymentDistributionData, TimePeriod } from '@/types/dashboard'

type ChartType = 'pie' | 'bar'

export function usePaymentDistribution() {
  const [paymentData, setPaymentData] = useState<PaymentDistributionData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('last30days')
  const [chartType, setChartType] = useState<ChartType>('pie')
  const supabase = useSupabaseAdmin()

  const getDateRange = (period: TimePeriod) => {
    const today = new Date()
    let endDate = new Date(today)
    let startDate = new Date(today)

    switch (period) {
      case 'today':
        startDate = new Date(today)
        break
      case 'yesterday':
        startDate = new Date(today)
        startDate.setDate(startDate.getDate() - 1)
        endDate.setDate(endDate.getDate() - 1)
        break
      case 'last7days':
        startDate.setDate(startDate.getDate() - 6)
        break
      case 'last30days':
        startDate.setDate(startDate.getDate() - 29)
        break
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        break
      case 'lastMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        endDate = new Date(today.getFullYear(), today.getMonth(), 0)
        break
      case 'thisYear':
        startDate = new Date(today.getFullYear(), 0, 1)
        break
      default:
        startDate.setDate(startDate.getDate() - 29)
    }

    return { startDate, endDate }
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

  const getPaymentMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash':
      case 'dinheiro':
        return '#22c55e'
      case 'card':
      case 'cartão':
        return '#3b82f6'
      case 'pix':
        return '#8b5cf6'
      case 'transfer':
      case 'transferência':
        return '#f59e0b'
      case 'check':
      case 'cheque':
        return '#ef4444'
      default:
        return '#6b7280'
    }
  }

  useEffect(() => {
    const fetchPaymentDistribution = async () => {
      setLoading(true)
      try {
        const { startDate, endDate } = getDateRange(selectedPeriod)
        const startDateStr = startDate.toISOString().split('T')[0]
        const endDateStr = endDate.toISOString().split('T')[0]

        const { data: salesData, error: salesError } = await supabase
          .from('sales')
          .select('payment_method, total')
          .gte('created_at', startDateStr)
          .lte('created_at', `${endDateStr}T23:59:59`)
          .eq('status', 'completed')

        if (salesError) {
          console.error('Error fetching payment distribution:', salesError)
          setPaymentData([])
          return
        }

        if (!salesData) {
          setPaymentData([])
          return
        }

        // Group by payment method
        const paymentMap = new Map<string, {
          count: number
          total: number
        }>()

        salesData.forEach(sale => {
          const method = sale.payment_method
          const existing = paymentMap.get(method)

          if (existing) {
            existing.count += 1
            existing.total += sale.total
          } else {
            paymentMap.set(method, {
              count: 1,
              total: sale.total
            })
          }
        })

        // Calculate totals for percentages
        const totalSales = salesData.length

        // Convert to chart data format
        const distributionData: PaymentDistributionData[] = Array.from(paymentMap.entries()).map(([method, data]) => ({
          method: getPaymentMethodLabel(method),
          count: data.count,
          total: data.total,
          percentage: totalSales > 0 ? (data.count / totalSales) * 100 : 0
        }))

        // Sort by count descending
        distributionData.sort((a, b) => b.count - a.count)

        setPaymentData(distributionData)
      } catch (error) {
        console.error('Error fetching payment distribution:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentDistribution()
  }, [selectedPeriod, supabase])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getChartColors = () => {
    return paymentData.map(item => getPaymentMethodColor(item.method))
  }

  return {
    paymentData,
    loading,
    selectedPeriod,
    setSelectedPeriod,
    chartType,
    setChartType,
    formatCurrency,
    formatPercentage,
    getChartColors,
    getPaymentMethodColor
  }
}
