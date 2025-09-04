import { useState, useEffect, useCallback } from 'react'
import { useSupabaseAdmin } from '@/hooks/useSupabaseAdmin'
import { useToast } from '@/hooks/useToast'
import {
  TopSeller,
  UseTopSellersReturn
} from '@/types/sales'

// Interfaces para query data
interface SalesQueryData {
  id: string
  created_at: string
  customer_id: string
  customer_name: string
  customer_type: string
  total: number
  subtotal: number
  discount_amount: number | null
  discount_percent: number | null
  payment_method: string
  status: string
  salesperson_name: string | null
  notes: string | null
  updated_at: string
  user_id: string
  user_name: string
  sale_items?: Array<{
    id?: string
    quantity: number
    unit_price: number
    total_price: number
    product_name?: string
    product_sku?: string
    product_id?: string
    created_at?: string
    sale_id?: string
    products?: {
      id?: string
      name?: string
      sku?: string
      cost: number
      retail_price?: number
      wholesale_price?: number
      category?: string
      brand?: string
    }
  }>
  customers?: {
    id?: string
    name?: string
    email?: string | null
    phone?: string | null
    type?: string
    cpf_cnpj?: string | null
  }
}

// Interface para dados agregados de vendedor
interface SellerAggregatedData {
  salesperson_name: string
  total_revenue: number
  total_profit: number
  sales_count: number
  avg_ticket: number
  profit_margin: number
  best_sale_date: string
  best_sale_value: number
  sales_by_customer_type: {
    retail: { sales: number; revenue: number; profit: number }
    wholesale: { sales: number; revenue: number; profit: number }
  }
  sales_by_payment_method: Array<{
    method: string
    count: number
    revenue: number
    profit: number
  }>
  top_products: Array<{
    name: string
    category: string
    sales: number
    revenue: number
    profit: number
  }>
  time_analysis: {
    best_day_of_week: string
    best_hour: string
    peak_performance_day: string
  }
}

export function useTopSellers(): UseTopSellersReturn {
  const [topSellers, setTopSellers] = useState<TopSeller[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriodState] = useState<string>('30')
  const [sortBy, setSortByState] = useState<'revenue' | 'profit' | 'sales_count' | 'avg_ticket' | 'profit_margin'>('profit')
  const [totalPeriodStats, setTotalPeriodStats] = useState({
    total_revenue: 0,
    total_profit: 0,
    total_sales: 0,
    active_sellers: 0
  })

  const supabase = useSupabaseAdmin()
  const { toast } = useToast()

  // Função para calcular data de início baseada no período
  const getStartDate = useCallback((periodValue: string): Date => {
    const today = new Date()
    const startDate = new Date()

    switch (periodValue) {
      case '1':
        startDate.setDate(today.getDate() - 1)
        break
      case '7':
        startDate.setDate(today.getDate() - 7)
        break
      case '15':
        startDate.setDate(today.getDate() - 15)
        break
      case '30':
        startDate.setDate(today.getDate() - 30)
        break
      case '90':
        startDate.setDate(today.getDate() - 90)
        break
      default:
        startDate.setDate(today.getDate() - 30)
    }

    startDate.setHours(0, 0, 0, 0)
    return startDate
  }, [])

  // Função para buscar vendas do período
  const fetchSalesData = useCallback(async (periodValue: string) => {
    try {
      const startDate = getStartDate(periodValue)
      const endDate = new Date()

      const { data, error: queryError } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            id,
            quantity,
            unit_price,
            total_price,
            product_name,
            product_sku,
            product_id,
            created_at,
            sale_id,
            products (
              id,
              name,
              sku,
              cost,
              retail_price,
              wholesale_price,
              category,
              brand
            )
          ),
          customers (
            id,
            name,
            email,
            phone,
            type,
            cpf_cnpj
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('status', 'completed')
        .not('salesperson_name', 'is', null)
        .not('salesperson_name', 'eq', '')

      if (queryError) {
        throw queryError
      }

      return data || []
    } catch (error) {
      console.error('Error fetching sales data:', error)
      throw error
    }
  }, [getStartDate, supabase])

  // Função para buscar dados do período anterior para comparação
  const fetchPreviousPeriodData = useCallback(async (periodValue: string) => {
    try {
      const currentStartDate = getStartDate(periodValue)
      const periodDays = parseInt(periodValue)

      const previousEndDate = new Date(currentStartDate)
      const previousStartDate = new Date(currentStartDate)
      previousStartDate.setDate(previousStartDate.getDate() - periodDays)

      const { data, error: queryError } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            quantity,
            unit_price,
            total_price,
            products (
              cost
            )
          ),
          customers (
            type
          )
        `)
        .gte('created_at', previousStartDate.toISOString())
        .lte('created_at', previousEndDate.toISOString())
        .eq('status', 'completed')
        .not('salesperson_name', 'is', null)
        .not('salesperson_name', 'eq', '')

      if (queryError) {
        throw queryError
      }

      return data || []
    } catch (error) {
      console.error('Error fetching previous period data:', error)
      throw error
    }
  }, [getStartDate, supabase])

  // Função para processar dados agregados por vendedor
  const processSellerData = useCallback((salesData: SalesQueryData[]): SellerAggregatedData[] => {
    const sellersMap = new Map<string, SellerAggregatedData>()

    salesData.forEach((sale: SalesQueryData) => {
      const sellerName = sale.salesperson_name || 'Não informado'

      if (!sellersMap.has(sellerName)) {
        sellersMap.set(sellerName, {
          salesperson_name: sellerName,
          total_revenue: 0,
          total_profit: 0,
          sales_count: 0,
          avg_ticket: 0,
          profit_margin: 0,
          best_sale_date: '',
          best_sale_value: 0,
          sales_by_customer_type: {
            retail: { sales: 0, revenue: 0, profit: 0 },
            wholesale: { sales: 0, revenue: 0, profit: 0 }
          },
          sales_by_payment_method: [],
          top_products: [],
          time_analysis: {
            best_day_of_week: '',
            best_hour: '',
            peak_performance_day: ''
          }
        })
      }

      const seller = sellersMap.get(sellerName)!

      // Calcular lucro da venda
      let saleProfit = 0
      sale.sale_items?.forEach((item) => {
        const cost = item.products?.cost || 0
        const itemProfit = (item.unit_price - cost) * item.quantity
        saleProfit += itemProfit
      })

      // Atualizar dados básicos
      seller.total_revenue += sale.total
      seller.total_profit += saleProfit
      seller.sales_count += 1

      // Atualizar melhor venda
      if (sale.total > seller.best_sale_value) {
        seller.best_sale_value = sale.total
        seller.best_sale_date = sale.created_at
      }

      // Atualizar dados por tipo de cliente
      const customerType = sale.customers?.type || 'retail'
      if (customerType === 'wholesale') {
        seller.sales_by_customer_type.wholesale.sales += 1
        seller.sales_by_customer_type.wholesale.revenue += sale.total
        seller.sales_by_customer_type.wholesale.profit += saleProfit
      } else {
        seller.sales_by_customer_type.retail.sales += 1
        seller.sales_by_customer_type.retail.revenue += sale.total
        seller.sales_by_customer_type.retail.profit += saleProfit
      }

      // Processar métodos de pagamento
      const existingPaymentMethod = seller.sales_by_payment_method.find(pm => pm.method === sale.payment_method)
      if (existingPaymentMethod) {
        existingPaymentMethod.count += 1
        existingPaymentMethod.revenue += sale.total
        existingPaymentMethod.profit += saleProfit
      } else {
        seller.sales_by_payment_method.push({
          method: sale.payment_method,
          count: 1,
          revenue: sale.total,
          profit: saleProfit
        })
      }

      // Processar produtos
      const productMap = new Map<string, { name: string; category: string; sales: number; revenue: number; profit: number }>()
      sale.sale_items?.forEach((item) => {
        const productName = item.products?.name || item.product_name || 'Produto não identificado'
        const category = item.products?.category || 'Sem categoria'
        const cost = item.products?.cost || 0
        const itemProfit = (item.unit_price - cost) * item.quantity

        if (!productMap.has(productName)) {
          productMap.set(productName, {
            name: productName,
            category,
            sales: 0,
            revenue: 0,
            profit: 0
          })
        }

        const product = productMap.get(productName)!
        product.sales += item.quantity
        product.revenue += item.total_price
        product.profit += itemProfit
      })

      // Atualizar top produtos (manter apenas os top 3)
      const newProducts = Array.from(productMap.values())
      const allProducts = [...seller.top_products, ...newProducts]

      // Consolidar produtos duplicados
      const consolidatedProducts = new Map<string, { name: string; category: string; sales: number; revenue: number; profit: number }>()
      allProducts.forEach(product => {
        if (!consolidatedProducts.has(product.name)) {
          consolidatedProducts.set(product.name, { ...product })
        } else {
          const existing = consolidatedProducts.get(product.name)!
          existing.sales += product.sales
          existing.revenue += product.revenue
          existing.profit += product.profit
        }
      })

      seller.top_products = Array.from(consolidatedProducts.values())
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 3)

      // Análise temporal básica
      const saleDate = new Date(sale.created_at)
      const dayOfWeek = saleDate.toLocaleDateString('pt-BR', { weekday: 'long' })
      const hour = saleDate.getHours()

      // Simplificado: apenas registrar o dia da melhor venda
      if (sale.total === seller.best_sale_value) {
        seller.time_analysis.best_day_of_week = dayOfWeek
        seller.time_analysis.best_hour = `${hour}:00`
        seller.time_analysis.peak_performance_day = saleDate.toLocaleDateString('pt-BR')
      }
    })

    // Calcular métricas finais
    const sellers = Array.from(sellersMap.values())
    sellers.forEach(seller => {
      seller.avg_ticket = seller.sales_count > 0 ? seller.total_revenue / seller.sales_count : 0
      seller.profit_margin = seller.total_revenue > 0 ? (seller.total_profit / seller.total_revenue) * 100 : 0

      // Ordenar métodos de pagamento por lucro
      seller.sales_by_payment_method.sort((a, b) => b.profit - a.profit)
    })

    return sellers
  }, [])

  // Função para calcular crescimento vs período anterior
  const calculateGrowth = useCallback((current: SellerAggregatedData, previous: SellerAggregatedData | undefined) => {
    if (!previous) {
      return { revenue: 0, profit: 0, sales: 0, margin: 0 }
    }

    const revenueGrowth = previous.total_revenue > 0 ? ((current.total_revenue - previous.total_revenue) / previous.total_revenue) * 100 : 0
    const profitGrowth = previous.total_profit > 0 ? ((current.total_profit - previous.total_profit) / previous.total_profit) * 100 : 0
    const salesGrowth = previous.sales_count > 0 ? ((current.sales_count - previous.sales_count) / previous.sales_count) * 100 : 0
    const marginGrowth = previous.profit_margin > 0 ? ((current.profit_margin - previous.profit_margin) / previous.profit_margin) * 100 : 0

    return {
      revenue: revenueGrowth,
      profit: profitGrowth,
      sales: salesGrowth,
      margin: marginGrowth
    }
  }, [])

  // Função principal para buscar e processar dados
  const fetchTopSellers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [currentData, previousData] = await Promise.all([
        fetchSalesData(period),
        fetchPreviousPeriodData(period)
      ])

      const currentSellers = processSellerData(currentData)
      const previousSellers = processSellerData(previousData)

      // Calcular estatísticas totais do período
      const totalRevenue = currentSellers.reduce((sum, seller) => sum + seller.total_revenue, 0)
      const totalProfit = currentSellers.reduce((sum, seller) => sum + seller.total_profit, 0)
      const totalSales = currentSellers.reduce((sum, seller) => sum + seller.sales_count, 0)

      setTotalPeriodStats({
        total_revenue: totalRevenue,
        total_profit: totalProfit,
        total_sales: totalSales,
        active_sellers: currentSellers.length
      })

      // Ordenar vendedores baseado no critério selecionado
      const sortedSellers = currentSellers.sort((a, b) => {
        switch (sortBy) {
          case 'revenue':
            return b.total_revenue - a.total_revenue
          case 'profit':
            return b.total_profit - a.total_profit
          case 'sales_count':
            return b.sales_count - a.sales_count
          case 'avg_ticket':
            return b.avg_ticket - a.avg_ticket
          case 'profit_margin':
            return b.profit_margin - a.profit_margin
          default:
            return b.total_profit - a.total_profit
        }
      })

      // Limitar a exatamente 5 vendedores
      const top5Sellers = sortedSellers.slice(0, 5)

      // Converter para formato final com comparações
      const topSellersWithComparison: TopSeller[] = top5Sellers.map((seller, index) => {
        const previousSeller = previousSellers.find(ps => ps.salesperson_name === seller.salesperson_name)
        const growth = calculateGrowth(seller, previousSeller)

        return {
          salesperson_name: seller.salesperson_name,
          position: index + 1,
          total_sales: seller.sales_count,
          total_revenue: seller.total_revenue,
          total_profit: seller.total_profit,
          sales_count: seller.sales_count,
          avg_ticket: seller.avg_ticket,
          profit_margin: seller.profit_margin,
          best_sale_date: seller.best_sale_date,
          best_sale_value: seller.best_sale_value,
          growth_vs_previous: growth,
          performance_breakdown: {
            by_customer_type: seller.sales_by_customer_type,
            by_payment_method: seller.sales_by_payment_method,
            top_products: seller.top_products,
            time_analysis: seller.time_analysis
          },
          revenue_share: totalRevenue > 0 ? (seller.total_revenue / totalRevenue) * 100 : 0,
          profit_share: totalProfit > 0 ? (seller.total_profit / totalProfit) * 100 : 0
        }
      })

      setTopSellers(topSellersWithComparison)

    } catch (error) {
      console.error('Error fetching top sellers:', error)
      setError('Erro ao buscar top vendedores')
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o ranking de vendedores',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [period, sortBy, fetchSalesData, fetchPreviousPeriodData, processSellerData, calculateGrowth, toast])

  // Função para definir período
  const setPeriod = useCallback((newPeriod: string) => {
    setPeriodState(newPeriod)
  }, [])

  // Função para definir ordenação
  const setSortBy = useCallback((newSortBy: 'revenue' | 'profit' | 'sales_count' | 'avg_ticket' | 'profit_margin') => {
    setSortByState(newSortBy)
  }, [])

  // Função para atualizar dados
  const refreshData = useCallback(async () => {
    await fetchTopSellers()
  }, [fetchTopSellers])

  // Effect para carregar dados quando período ou ordenação mudar
  useEffect(() => {
    fetchTopSellers()
  }, [fetchTopSellers])

  return {
    topSellers,
    loading,
    error,
    period,
    sortBy,
    setPeriod,
    setSortBy,
    refreshData,
    totalPeriodStats
  }
}
