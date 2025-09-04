import { useEffect, useState } from 'react'
import { useSupabaseAdmin } from '@/hooks/useSupabaseAdmin'
import { DollarSign, ShoppingCart, Users, Package } from 'lucide-react'

interface MetricCardData {
  title: string
  value: string
  change: string
  trend: 'up' | 'down' | 'neutral'
  icon: React.ComponentType<{ className?: string }>
  description: string
}

export function useMetricsCards() {
  const [metrics, setMetrics] = useState<MetricCardData[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useSupabaseAdmin()

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        const todayStr = today.toISOString().split('T')[0]
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        // Fetch today's sales
        const { data: todaySales, error: todayError } = await supabase
          .from('sales')
          .select('total, customer_id')
          .gte('created_at', todayStr)
          .lt('created_at', `${todayStr}T23:59:59`)
          .eq('status', 'completed')

        if (todayError) {
          console.error('Error fetching today sales:', todayError)
        }

        // Fetch yesterday's sales for comparison
        const { data: yesterdaySales, error: yesterdayError } = await supabase
          .from('sales')
          .select('total, customer_id')
          .gte('created_at', yesterdayStr)
          .lt('created_at', `${yesterdayStr}T23:59:59`)
          .eq('status', 'completed')

        if (yesterdayError) {
          console.error('Error fetching yesterday sales:', yesterdayError)
        }

        // Fetch low stock products
        const { data: lowStockProducts } = await supabase
          .from('low_stock_products')
          .select('*')
          .eq('is_low_stock', true)

        // Calculate metrics
        const todayRevenue = todaySales?.reduce((sum, sale) => sum + sale.total, 0) || 0
        const yesterdayRevenue = yesterdaySales?.reduce((sum, sale) => sum + sale.total, 0) || 0
        const revenueChange = yesterdayRevenue > 0
          ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1)
          : '0'

        const todaySalesCount = todaySales?.length || 0
        const yesterdaySalesCount = yesterdaySales?.length || 0
        const salesChange = yesterdaySalesCount > 0
          ? ((todaySalesCount - yesterdaySalesCount) / yesterdaySalesCount * 100).toFixed(1)
          : '0'

        const todayUniqueCustomers = new Set(todaySales?.map(sale => sale.customer_id)).size
        const yesterdayUniqueCustomers = new Set(yesterdaySales?.map(sale => sale.customer_id)).size
        const customersChange = yesterdayUniqueCustomers > 0
          ? ((todayUniqueCustomers - yesterdayUniqueCustomers) / yesterdayUniqueCustomers * 100).toFixed(1)
          : '0'

        const metricsData: MetricCardData[] = [
          {
            title: 'Receita Hoje',
            value: `R$ ${todayRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            change: `${revenueChange}%`,
            trend: parseFloat(revenueChange) > 0 ? 'up' : parseFloat(revenueChange) < 0 ? 'down' : 'neutral',
            icon: DollarSign,
            description: 'vs ontem'
          },
          {
            title: 'Vendas Hoje',
            value: todaySalesCount.toString(),
            change: `${salesChange}%`,
            trend: parseFloat(salesChange) > 0 ? 'up' : parseFloat(salesChange) < 0 ? 'down' : 'neutral',
            icon: ShoppingCart,
            description: 'vs ontem'
          },
          {
            title: 'Clientes Ativos',
            value: (todayUniqueCustomers || 0).toString(),
            change: `${customersChange}%`,
            trend: parseFloat(customersChange) > 0 ? 'up' : parseFloat(customersChange) < 0 ? 'down' : 'neutral',
            icon: Users,
            description: 'vs ontem'
          },
          {
            title: 'Produtos em Baixa',
            value: (lowStockProducts?.length || 0).toString(),
            change: 'Alerta',
            trend: (lowStockProducts?.length || 0) > 0 ? 'down' : 'neutral',
            icon: Package,
            description: 'Requer atenção'
          }
        ]

        setMetrics(metricsData)
      } catch (error) {
        console.error('Error fetching metrics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [supabase])

  return {
    metrics,
    loading
  }
}
