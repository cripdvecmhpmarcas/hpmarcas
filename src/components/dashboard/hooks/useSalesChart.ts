import { useEffect, useState } from 'react'
import { useSupabaseAdmin } from '@/hooks/useSupabaseAdmin'
import type { TimePeriod } from '@/types/dashboard'

interface ChartDataPoint {
  date: string
  revenue: number
  sales: number
  customers: number
  formattedDate: string
}

export function useSalesChart() {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('last7days')
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
        startDate.setDate(startDate.getDate() - 6)
    }

    return { startDate, endDate }
  }

  const formatDate = (dateStr: string, period: TimePeriod) => {
    const date = new Date(dateStr)

    if (period === 'thisYear' || period === 'last30days') {
      return date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })
    }

    if (period === 'thisMonth' || period === 'lastMonth') {
      return date.toLocaleDateString('pt-BR', { day: 'numeric' })
    }

    return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })
  }

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true)
      try {
        const { startDate, endDate } = getDateRange(selectedPeriod)
        const startDateStr = startDate.toISOString().split('T')[0]
        const endDateStr = endDate.toISOString().split('T')[0]

        // Fetch sales data for the period
        const { data: salesData, error: salesError } = await supabase
          .from('sales')
          .select('created_at, total, customer_id')
          .gte('created_at', startDateStr)
          .lte('created_at', `${endDateStr}T23:59:59`)
          .eq('status', 'completed')
          .order('created_at', { ascending: true })

        if (salesError) {
          console.error('Error fetching sales data:', salesError)
          setChartData([])
          return
        }

        if (!salesData) {
          setChartData([])
          return
        }

        // Group data by date
        const groupedData = new Map<string, {
          revenue: number
          sales: number
          customers: Set<string>
        }>()

        // Initialize all dates in range
        const currentDate = new Date(startDate)
        while (currentDate <= endDate) {
          const dateKey = currentDate.toISOString().split('T')[0]
          groupedData.set(dateKey, {
            revenue: 0,
            sales: 0,
            customers: new Set<string>()
          })
          currentDate.setDate(currentDate.getDate() + 1)
        }

        type Sale = {
          created_at: string
          total: number
          customer_id: string
        }

        // Aggregate sales data
        (salesData as Sale[]).forEach((sale: Sale) => {
          const saleDate = sale.created_at.split('T')[0]
          const existing = groupedData.get(saleDate)

          if (existing) {
            existing.revenue += sale.total
            existing.sales += 1
            existing.customers.add(sale.customer_id)
          }
        })

        // Convert to chart data format
        const chartPoints: ChartDataPoint[] = Array.from(groupedData.entries()).map(([date, data]) => ({
          date,
          revenue: data.revenue,
          sales: data.sales,
          customers: data.customers.size,
          formattedDate: formatDate(date, selectedPeriod)
        }))

        setChartData(chartPoints)
      } catch (error) {
        console.error('Error fetching chart data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchChartData()
  }, [selectedPeriod, supabase])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return {
    chartData,
    loading,
    selectedPeriod,
    setSelectedPeriod,
    formatCurrency
  }
}
