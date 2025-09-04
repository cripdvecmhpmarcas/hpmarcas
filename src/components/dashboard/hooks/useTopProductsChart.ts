import { useEffect, useState } from 'react'
import { useSupabaseAdmin } from '@/hooks/useSupabaseAdmin'
import type { TimePeriod } from '@/types/dashboard'

interface TopProductData {
  id: string
  name: string
  brand: string
  category: string
  totalSold: number
  totalRevenue: number
  timesSold: number
  shortName: string
}

type SortBy = 'revenue' | 'quantity' | 'frequency'

export function useTopProductsChart() {
  const [products, setProducts] = useState<TopProductData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('last30days')
  const [sortBy, setSortBy] = useState<SortBy>('revenue')
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

  const truncateName = (name: string, maxLength: number = 15) => {
    if (name.length <= maxLength) return name
    return name.substring(0, maxLength) + '...'
  }

  useEffect(() => {
    const fetchTopProducts = async () => {
      setLoading(true)
      try {
        const { startDate, endDate } = getDateRange(selectedPeriod)
        const startDateStr = startDate.toISOString().split('T')[0]
        const endDateStr = endDate.toISOString().split('T')[0]

        // Fetch sales items for the period with product details
        const { data: salesData, error: salesError } = await supabase
          .from('sale_items')
          .select(`
            product_id,
            product_name,
            quantity,
            total_price,
            sales!inner(created_at, status),
            products!inner(brand, category)
          `)
          .gte('sales.created_at', startDateStr)
          .lte('sales.created_at', `${endDateStr}T23:59:59`)
          .eq('sales.status', 'completed')

        if (salesError) {
          console.error('Error fetching top products data:', salesError)
          setProducts([])
          return
        }

        if (!salesData) {
          setProducts([])
          return
        }

        // Group and aggregate data by product
        const productMap = new Map<string, {
          id: string
          name: string
          brand: string
          category: string
          totalSold: number
          totalRevenue: number
          timesSold: number
        }>()

        salesData.forEach(item => {
          const productId = item.product_id
          const existing = productMap.get(productId)

          if (existing) {
            existing.totalSold += item.quantity
            existing.totalRevenue += item.total_price
            existing.timesSold += 1
          } else {
            productMap.set(productId, {
              id: productId,
              name: item.product_name,
              brand: Array.isArray(item.products) ? item.products[0]?.brand || 'N/A' : item.products?.brand || 'N/A',
              category: Array.isArray(item.products) ? item.products[0]?.category || 'N/A' : item.products?.category || 'N/A',
              totalSold: item.quantity,
              totalRevenue: item.total_price,
              timesSold: 1
            })
          }
        })

        // Convert to array and sort
        const sortedProducts = Array.from(productMap.values())

        // Sort by selected criteria
        switch (sortBy) {
          case 'revenue':
            sortedProducts.sort((a, b) => b.totalRevenue - a.totalRevenue)
            break
          case 'quantity':
            sortedProducts.sort((a, b) => b.totalSold - a.totalSold)
            break
          case 'frequency':
            sortedProducts.sort((a, b) => b.timesSold - a.timesSold)
            break
        }

        // Take top 10 and add shortened names for chart display
        const topProducts: TopProductData[] = sortedProducts.slice(0, 10).map(product => ({
          ...product,
          shortName: truncateName(product.name)
        }))

        setProducts(topProducts)
      } catch (error) {
        console.error('Error fetching top products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTopProducts()
  }, [selectedPeriod, sortBy, supabase])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const getBarDataKey = () => {
    switch (sortBy) {
      case 'revenue':
        return 'totalRevenue'
      case 'quantity':
        return 'totalSold'
      case 'frequency':
        return 'timesSold'
      default:
        return 'totalRevenue'
    }
  }

  const getYAxisFormatter = () => {
    switch (sortBy) {
      case 'revenue':
        return (value: number) => formatCurrency(value)
      case 'quantity':
        return (value: number) => `${value} un`
      case 'frequency':
        return (value: number) => `${value}x`
      default:
        return (value: number) => formatCurrency(value)
    }
  }

  const getSortLabel = () => {
    switch (sortBy) {
      case 'revenue':
        return 'Receita'
      case 'quantity':
        return 'Quantidade'
      case 'frequency':
        return 'Frequência'
      default:
        return 'Receita'
    }
  }

  return {
    products,
    loading,
    selectedPeriod,
    setSelectedPeriod,
    sortBy,
    setSortBy,
    formatCurrency,
    getBarDataKey,
    getYAxisFormatter,
    getSortLabel
  }
}
