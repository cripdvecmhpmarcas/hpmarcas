import { useState, useEffect, useCallback } from 'react'
import { useSupabaseAdmin } from '@/hooks/useSupabaseAdmin'
import { useToast } from '@/hooks/useToast'
import {
  SaleProfitAnalysis,
  ProfitSummary,
  UseSaleProfitReturn,
  ProfitComparison,
  ProfitBreakdown,
  TopPerformers,
  TrendAnalysis
} from '@/types/sales'


interface SaleProfitQueryData {
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
  sale_items: ProfitSaleItemQueryData[]
  customers: ProfitCustomerQueryData
}

interface ProfitSaleItemQueryData {
  id: string
  quantity: number
  unit_price: number
  total_price: number
  product_name: string
  product_sku: string
  product_id: string
  created_at: string
  sale_id: string
  products: ProfitProductQueryData
}

interface ProfitCustomerQueryData {
  id: string
  name: string
  email: string | null
  phone: string | null
  type: string
  cpf_cnpj: string | null
}

interface ProfitProductQueryData {
  id: string
  name: string
  sku: string
  cost: number
  retail_price: number
  wholesale_price: number
  category: string | null
}

export function useSaleProfit(): UseSaleProfitReturn {
  const [profitAnalysis] = useState<SaleProfitAnalysis[]>([])
  const [profitSummary, setProfitSummary] = useState<ProfitSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30')
  const [profitComparison, setProfitComparison] = useState<ProfitComparison | null>(null)
  const [profitBreakdown, setProfitBreakdown] = useState<ProfitBreakdown | null>(null)

  const supabase = useSupabaseAdmin()
  const { toast } = useToast()

  const calculateSaleProfit = useCallback(async (saleId: string): Promise<SaleProfitAnalysis> => {
    try {
      setLoading(true)
      setError(null)

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
              category
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
        .eq('id', saleId)
        .single()

      if (queryError) {
        throw queryError
      }

      if (!data) {
        throw new Error('Venda não encontrada')
      }

      const sale = data as SaleProfitQueryData
      let totalCost = 0
      let itemsCount = 0

      sale.sale_items?.forEach((item: ProfitSaleItemQueryData) => {
        const cost = item.products?.cost || 0
        totalCost += cost * item.quantity
        itemsCount += item.quantity
      })

      const totalProfit = sale.total - totalCost
      const profitMargin = sale.total > 0 ? (totalProfit / sale.total) * 100 : 0

      const analysis: SaleProfitAnalysis = {
        sale_id: sale.id,
        sale_date: sale.created_at,
        customer_name: sale.customers?.name || 'Cliente não identificado',
        total_sale: sale.total,
        total_cost: totalCost,
        total_profit: totalProfit,
        profit_margin: profitMargin,
        items_count: itemsCount,
        payment_method: sale.payment_method,
        salesperson_name: sale.salesperson_name || undefined
      }

      return analysis

    } catch (error) {
      console.error('Error calculating sale profit:', error)
      setError('Erro ao calcular lucro da venda')
      toast({
        title: 'Erro',
        description: 'Não foi possível calcular o lucro da venda',
        variant: 'destructive'
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [supabase, toast])

  const calculateProfitByPeriod = useCallback(async (days: number): Promise<ProfitSummary> => {
    try {
      setLoading(true)
      setError(null)

      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

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
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('status', 'completed')

      if (queryError) {
        throw queryError
      }

      let totalRevenue = 0
      let totalCost = 0
      let salesCount = 0

      const salesData = data || []

      salesData.forEach((sale: { total: number; customers?: { type?: string | null }; salesperson_name?: string | null; payment_method?: string | null; sale_items?: Array<{ quantity: number; unit_price: number; total_price: number; product_name?: string | null; products?: { cost?: number | null; category?: string | null; name?: string | null } }> }) => {
        totalRevenue += sale.total
        salesCount += 1

        sale.sale_items?.forEach((item: { quantity: number; unit_price: number; total_price: number; product_name?: string | null; products?: { cost?: number | null; category?: string | null; name?: string | null } }) => {
          const cost = item.products?.cost || 0
          totalCost += cost * item.quantity
        })
      })

      const totalProfit = totalRevenue - totalCost
      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
      const avgTicket = salesCount > 0 ? totalRevenue / salesCount : 0

      const summary: ProfitSummary = {
        period: `${days} dias`,
        total_sales: salesCount,
        total_revenue: totalRevenue,
        total_cost: totalCost,
        total_profit: totalProfit,
        profit_margin: profitMargin,
        sales_count: salesCount,
        avg_ticket: avgTicket
      }

      return summary

    } catch (error) {
      console.error('Error calculating profit by period:', error)
      setError('Erro ao calcular lucro por período')
      toast({
        title: 'Erro',
        description: 'Não foi possível calcular o lucro por período',
        variant: 'destructive'
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [supabase, toast])

  const calculateProfitComparison = useCallback(async (days: number): Promise<ProfitComparison> => {
    try {
      const currentPeriod = await calculateProfitByPeriod(days)

      const previousEndDate = new Date()
      previousEndDate.setDate(previousEndDate.getDate() - days)
      const previousStartDate = new Date()
      previousStartDate.setDate(previousStartDate.getDate() - (days * 2))

      const { data: previousData, error: previousError } = await supabase
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

      if (previousError) {
        throw previousError
      }

      let previousRevenue = 0
      let previousCost = 0
      let previousSalesCount = 0

      const previousSalesData = previousData || []

      previousSalesData.forEach((sale: { total: number; sale_items?: Array<{ quantity: number; products?: { cost?: number | null } }> }) => {
        previousRevenue += sale.total
        previousSalesCount += 1

        sale.sale_items?.forEach((item) => {
          const cost = item.products?.cost || 0
          previousCost += cost * item.quantity
        })
      })

      const previousProfit = previousRevenue - previousCost
      const previousProfitMargin = previousRevenue > 0 ? (previousProfit / previousRevenue) * 100 : 0
      const previousAvgTicket = previousSalesCount > 0 ? previousRevenue / previousSalesCount : 0

      const previousPeriod: ProfitSummary = {
        period: `${days} dias anteriores`,
        total_sales: previousSalesCount,
        total_revenue: previousRevenue,
        total_cost: previousCost,
        total_profit: previousProfit,
        profit_margin: previousProfitMargin,
        sales_count: previousSalesCount,
        avg_ticket: previousAvgTicket
      }

      const revenueGrowth = previousRevenue > 0 ? ((currentPeriod.total_revenue - previousRevenue) / previousRevenue) * 100 : 0
      const profitGrowth = previousProfit > 0 ? ((currentPeriod.total_profit - previousProfit) / previousProfit) * 100 : 0
      const marginGrowth = previousProfitMargin > 0 ? ((currentPeriod.profit_margin - previousProfitMargin) / previousProfitMargin) * 100 : 0
      const salesGrowth = previousSalesCount > 0 ? ((currentPeriod.sales_count - previousSalesCount) / previousSalesCount) * 100 : 0
      const avgTicketGrowth = previousAvgTicket > 0 ? ((currentPeriod.avg_ticket - previousAvgTicket) / previousAvgTicket) * 100 : 0

      return {
        current: currentPeriod,
        previous: previousPeriod,
        growth: {
          revenue: revenueGrowth,
          profit: profitGrowth,
          margin: marginGrowth,
          sales: salesGrowth,
          avg_ticket: avgTicketGrowth
        }
      }

    } catch (error) {
      console.error('Error calculating profit comparison:', error)
      throw error
    }
  }, [calculateProfitByPeriod, supabase])

  const calculateProfitBreakdown = useCallback(async (days: number): Promise<ProfitBreakdown> => {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error: queryError } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            quantity,
            unit_price,
            total_price,
            product_name,
            products (
              cost,
              category,
              name
            )
          ),
          customers (
            type
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('status', 'completed')

      if (queryError) {
        throw queryError
      }

      const salesData = data || []

      const categoryMap = new Map<string, { profit: number; revenue: number; sales: number }>()
      const customerTypeMap = new Map<string, { profit: number; revenue: number; sales: number }>()
      const salespersonMap = new Map<string, { profit: number; revenue: number; sales: number }>()
      const paymentMethodMap = new Map<string, { profit: number; revenue: number; sales: number }>()
      const productMap = new Map<string, { profit: number; revenue: number; sales: number }>()

      salesData.forEach((sale: { total: number; customers?: { type?: string | null }; salesperson_name?: string | null; payment_method?: string | null; sale_items?: Array<{ quantity: number; unit_price: number; total_price: number; product_name?: string | null; products?: { cost?: number | null; category?: string | null; name?: string | null } }> }) => {
        const customerType = sale.customers?.type || 'Não informado'
        const salesperson = sale.salesperson_name || 'Não informado'
        const paymentMethod = sale.payment_method || 'Não informado'

        if (!customerTypeMap.has(customerType)) {
          customerTypeMap.set(customerType, { profit: 0, revenue: 0, sales: 0 })
        }
        if (!salespersonMap.has(salesperson)) {
          salespersonMap.set(salesperson, { profit: 0, revenue: 0, sales: 0 })
        }
        if (!paymentMethodMap.has(paymentMethod)) {
          paymentMethodMap.set(paymentMethod, { profit: 0, revenue: 0, sales: 0 })
        }

        customerTypeMap.get(customerType)!.revenue += sale.total
        customerTypeMap.get(customerType)!.sales += 1
        salespersonMap.get(salesperson)!.revenue += sale.total
        salespersonMap.get(salesperson)!.sales += 1
        paymentMethodMap.get(paymentMethod)!.revenue += sale.total
        paymentMethodMap.get(paymentMethod)!.sales += 1

        sale.sale_items?.forEach((item: { quantity: number; unit_price: number; total_price: number; product_name?: string | null; products?: { cost?: number | null; category?: string | null; name?: string | null } }) => {
          const cost = item.products?.cost || 0
          const category = item.products?.category || 'Sem categoria'
          const productName = item.products?.name || item.product_name || 'Produto não encontrado'
          const itemProfit = (item.unit_price - cost) * item.quantity

          if (!categoryMap.has(category)) {
            categoryMap.set(category, { profit: 0, revenue: 0, sales: 0 })
          }
          if (!productMap.has(productName)) {
            productMap.set(productName, { profit: 0, revenue: 0, sales: 0 })
          }

          categoryMap.get(category)!.profit += itemProfit
          categoryMap.get(category)!.revenue += item.total_price
          categoryMap.get(category)!.sales += item.quantity

          productMap.get(productName)!.profit += itemProfit
          productMap.get(productName)!.revenue += item.total_price
          productMap.get(productName)!.sales += item.quantity

          customerTypeMap.get(customerType)!.profit += itemProfit
          salespersonMap.get(salesperson)!.profit += itemProfit
          paymentMethodMap.get(paymentMethod)!.profit += itemProfit
        })
      })

      const breakdown: ProfitBreakdown = {
        by_category: Array.from(categoryMap.entries()).map(([category, data]) => ({
          category,
          profit: data.profit,
          margin: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0,
          sales: data.sales
        })).sort((a, b) => b.profit - a.profit),

        by_customer_type: Array.from(customerTypeMap.entries()).map(([type, data]) => ({
          type,
          profit: data.profit,
          margin: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0,
          sales: data.sales
        })).sort((a, b) => b.profit - a.profit),

        by_salesperson: Array.from(salespersonMap.entries()).map(([name, data]) => ({
          name,
          profit: data.profit,
          margin: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0,
          sales: data.sales
        })).sort((a, b) => b.profit - a.profit),

        by_payment_method: Array.from(paymentMethodMap.entries()).map(([method, data]) => ({
          method,
          profit: data.profit,
          margin: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0,
          sales: data.sales
        })).sort((a, b) => b.profit - a.profit),

        by_product: Array.from(productMap.entries()).map(([name, data]) => ({
          name,
          profit: data.profit,
          margin: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0,
          sales: data.sales
        })).sort((a, b) => b.profit - a.profit).slice(0, 10)
      }

      return breakdown

    } catch (error) {
      console.error('Error calculating profit breakdown:', error)
      throw error
    }
  }, [supabase])

  const setPeriod = useCallback((period: string) => {
    setSelectedPeriod(period)
  }, [])

  const calculateMultiplePeriods = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const periods = [1, 7, 15, 30, 60, 90]
      const summaries: ProfitSummary[] = []

      for (const period of periods) {
        const summary = await calculateProfitByPeriod(period)
        summaries.push(summary)
      }

      setProfitSummary(summaries)

    } catch (error) {
      console.error('Error calculating multiple periods:', error)
      setError('Erro ao calcular períodos múltiplos')
    } finally {
      setLoading(false)
    }
  }, [calculateProfitByPeriod])

  const refreshData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const periodDays = parseInt(selectedPeriod)
      if (isNaN(periodDays)) {
        return
      }

      const [summary, comparison, breakdown] = await Promise.all([
        calculateProfitByPeriod(periodDays),
        calculateProfitComparison(periodDays),
        calculateProfitBreakdown(periodDays)
      ])

      setProfitSummary([summary])
      setProfitComparison(comparison)
      setProfitBreakdown(breakdown)

    } catch (error) {
      console.error('Error refreshing data:', error)
      setError('Erro ao atualizar dados')
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar os dados',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [selectedPeriod, calculateProfitByPeriod, calculateProfitComparison, calculateProfitBreakdown, toast])

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }, [])

  const formatPercentage = useCallback((value: number) => {
    return `${value.toFixed(2)}%`
  }, [])

  const getTopPerformers = useCallback((breakdown: ProfitBreakdown): TopPerformers => {
    return {
      topCategory: breakdown.by_category[0] || null,
      topSalesperson: breakdown.by_salesperson[0] || null,
      topProduct: breakdown.by_product[0] || null,
      topCustomerType: breakdown.by_customer_type[0] || null,
      topPaymentMethod: breakdown.by_payment_method[0] || null
    }
  }, [])

  const getTrendAnalysis = useCallback((comparison: ProfitComparison): TrendAnalysis => {
    const trends: TrendAnalysis = {
      revenue: comparison.growth.revenue > 0 ? 'up' : comparison.growth.revenue < 0 ? 'down' : 'stable',
      profit: comparison.growth.profit > 0 ? 'up' : comparison.growth.profit < 0 ? 'down' : 'stable',
      margin: comparison.growth.margin > 0 ? 'up' : comparison.growth.margin < 0 ? 'down' : 'stable',
      sales: comparison.growth.sales > 0 ? 'up' : comparison.growth.sales < 0 ? 'down' : 'stable',
      avg_ticket: comparison.growth.avg_ticket > 0 ? 'up' : comparison.growth.avg_ticket < 0 ? 'down' : 'stable'
    }

    return trends
  }, [])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  return {
    profitAnalysis,
    profitSummary,
    loading,
    error,
    selectedPeriod,
    setPeriod,
    calculateProfitByPeriod,
    calculateSaleProfit,
    refreshData,
    profitComparison,
    profitBreakdown,
    calculateMultiplePeriods,
    formatCurrency,
    formatPercentage,
    getTopPerformers,
    getTrendAnalysis
  }
}
