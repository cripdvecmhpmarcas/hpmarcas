import { useState, useEffect, useCallback } from 'react'
import { useSupabaseAdmin } from '@/hooks/useSupabaseAdmin'
import { useToast } from '@/hooks/useToast'
import {
  SaleWithDetails,
  SaleFilters,
  SalesStats,
  UseSalesReturn,
  SALE_STATUSES,
  PAYMENT_METHODS,
  CUSTOMER_TYPES
} from '@/types/sales'
import { exportData, SALES_EXPORT_COLUMNS } from '@/lib/export-utils'

// Tipos para dados da query principal
interface SaleQueryData {
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
  sale_items: SaleItemQueryData[]
  customers: CustomerQueryData
}

// Tipos para query de estatísticas (campos reduzidos)
interface StatsQueryData {
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
  sale_items: StatsItemQueryData[]
  customers: StatsCustomerQueryData
}

// Tipos para itens na query de estatísticas
interface StatsItemQueryData {
  quantity: number
  unit_price: number
  total_price: number
  products: {
    cost: number
  }
}

// Tipos para customer na query de estatísticas
interface StatsCustomerQueryData {
  type: string
}

// Tipos para query de vendas de hoje
interface TodaySalesQueryData {
  total: number
  payment_method: string
  sale_items: {
    quantity: number
    unit_price: number
    products: {
      cost: number
    }
  }[]
}

interface SaleItemQueryData {
  id: string
  quantity: number
  unit_price: number
  total_price: number
  product_name: string
  product_sku: string
  product_id: string
  created_at: string
  sale_id: string
  products: ProductQueryData
}

interface CustomerQueryData {
  id: string
  name: string
  email: string | null
  phone: string | null
  type: string
  cpf_cnpj: string | null
}

interface ProductQueryData {
  id: string
  name: string
  sku: string
  cost: number
  retail_price: number
  wholesale_price: number
}

const DEFAULT_FILTERS: SaleFilters = {
  search: '',
  customer_type: 'all',
  payment_method: 'all',
  status: 'all',
  order_source: 'all',
  sort_by: 'created_at',
  sort_order: 'desc',
  page: 1,
  limit: 20
}

export function useSales(initialFilters: Partial<SaleFilters> = {}): UseSalesReturn {
  const [sales, setSales] = useState<SaleWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<SalesStats | null>(null)
  const [filters, setFiltersState] = useState<SaleFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters
  })
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  })

  const supabase = useSupabaseAdmin()
  const { toast } = useToast()

  const fetchSales = useCallback(async (newFilters: SaleFilters, append = false) => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
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
              wholesale_price
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

      // Aplicar filtros de busca
      if (newFilters.search) {
        query = query.or(`
          customers.name.ilike.%${newFilters.search}%,
          id.ilike.%${newFilters.search}%,
          salesperson_name.ilike.%${newFilters.search}%
        `)
      }

      // Filtros de data
      if (newFilters.date_from) {
        query = query.gte('created_at', newFilters.date_from)
      }
      if (newFilters.date_to) {
        query = query.lte('created_at', newFilters.date_to)
      }

      // Filtros de tipo de cliente
      if (newFilters.customer_type && newFilters.customer_type !== 'all') {
        query = query.eq('customers.type', newFilters.customer_type)
      }

      // Filtros de método de pagamento
      if (newFilters.payment_method && newFilters.payment_method !== 'all') {
        query = query.eq('payment_method', newFilters.payment_method)
      }

      // Filtros de status
      if (newFilters.status && newFilters.status !== 'all') {
        query = query.eq('status', newFilters.status)
      }

      // Filtros de origem do pedido
      if (newFilters.order_source && newFilters.order_source !== 'all') {
        query = query.eq('order_source', newFilters.order_source)
      }

      // Filtros de vendedor
      if (newFilters.salesperson_name) {
        query = query.ilike('salesperson_name', `%${newFilters.salesperson_name}%`)
      }

      // Filtros de valor
      if (newFilters.min_total) {
        query = query.gte('total', newFilters.min_total)
      }
      if (newFilters.max_total) {
        query = query.lte('total', newFilters.max_total)
      }

      // Aplicar ordenação
      const sortColumn = newFilters.sort_by === 'customer_name' ? 'customers.name' : newFilters.sort_by
      query = query.order(sortColumn || 'created_at', {
        ascending: newFilters.sort_order === 'asc'
      })

      // Aplicar paginação
      const from = ((newFilters.page || 1) - 1) * (newFilters.limit || 20)
      const to = from + (newFilters.limit || 20) - 1
      query = query.range(from, to)

      const { data, error: salesError, count } = await query

      if (salesError) {
        throw salesError
      }

      // Processar dados para calcular lucros
      const salesWithDetails: SaleWithDetails[] = (data || []).map((sale: SaleQueryData) => {
        const saleItems = sale.sale_items?.map((item: SaleItemQueryData) => {
          const product = item.products
          const costPrice = product?.cost || 0
          const profitPerUnit = item.unit_price - costPrice
          const totalProfit = profitPerUnit * item.quantity

          return {
            ...item,
            product,
            profit_per_unit: profitPerUnit,
            total_profit: totalProfit
          }
        }) || []

        const totalProfit = saleItems.reduce((sum: number, item: SaleItemQueryData & { total_profit?: number }) => sum + (item.total_profit || 0), 0)
        const profitMargin = sale.total > 0 ? (totalProfit / sale.total) * 100 : 0

        return {
          ...sale,
          sale_items: saleItems,
          customer: sale.customers,
          total_profit: totalProfit,
          profit_margin: profitMargin,
          items_count: saleItems.length
        } as unknown as SaleWithDetails
      })

      if (append) {
        setSales(prev => [...prev, ...salesWithDetails])
      } else {
        setSales(salesWithDetails)
      }

      // Atualizar paginação
      setPagination({
        page: newFilters.page || 1,
        pageSize: newFilters.limit || 20,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / (newFilters.limit || 20))
      })

    } catch (error) {
      console.error('Error fetching sales:', error)
      setError('Erro ao buscar vendas')
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as vendas',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [supabase, toast])

  const fetchStats = useCallback(async (currentFilters: SaleFilters) => {
    try {
      // Buscar estatísticas com os mesmos filtros
      let statsQuery = supabase
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

      // Aplicar mesmos filtros da busca principal
      if (currentFilters.search) {
        statsQuery = statsQuery.or(`
          customers.name.ilike.%${currentFilters.search}%,
          id.ilike.%${currentFilters.search}%,
          salesperson_name.ilike.%${currentFilters.search}%
        `)
      }

      if (currentFilters.date_from) {
        statsQuery = statsQuery.gte('created_at', currentFilters.date_from)
      }
      if (currentFilters.date_to) {
        statsQuery = statsQuery.lte('created_at', currentFilters.date_to)
      }

      if (currentFilters.customer_type && currentFilters.customer_type !== 'all') {
        statsQuery = statsQuery.eq('customers.type', currentFilters.customer_type)
      }

      if (currentFilters.payment_method && currentFilters.payment_method !== 'all') {
        statsQuery = statsQuery.eq('payment_method', currentFilters.payment_method)
      }

      if (currentFilters.status && currentFilters.status !== 'all') {
        statsQuery = statsQuery.eq('status', currentFilters.status)
      }

      if (currentFilters.order_source && currentFilters.order_source !== 'all') {
        statsQuery = statsQuery.eq('order_source', currentFilters.order_source)
      }

      if (currentFilters.salesperson_name) {
        statsQuery = statsQuery.ilike('salesperson_name', `%${currentFilters.salesperson_name}%`)
      }

      if (currentFilters.min_total) {
        statsQuery = statsQuery.gte('total', currentFilters.min_total)
      }
      if (currentFilters.max_total) {
        statsQuery = statsQuery.lte('total', currentFilters.max_total)
      }

      const { data: statsData, error: statsError } = await statsQuery

      if (statsError) {
        throw statsError
      }

      // Vendas de hoje
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayIso = today.toISOString()

      const { data: todaySales, error: todayError } = await supabase
        .from('sales')
        .select('total, payment_method, sale_items(quantity, unit_price, products(cost))')
        .gte('created_at', todayIso)
        .eq('status', 'completed')

      if (todayError) {
        throw todayError
      }

      // Calcular estatísticas
      const totalSales = (statsData || []).length
      const totalRevenue = (statsData || []).reduce((sum: number, sale: StatsQueryData) => sum + sale.total, 0)

      let totalProfit = 0;
      (statsData || []).forEach((sale: StatsQueryData) => {
        sale.sale_items?.forEach((item: StatsItemQueryData) => {
          const cost = item.products?.cost || 0
          const itemProfit = (item.unit_price - cost) * item.quantity

          totalProfit += itemProfit
        })
      })

      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

      const salesToday = (todaySales || []).length
      const revenueToday = (todaySales || []).reduce((sum: number, sale: TodaySalesQueryData) => sum + sale.total, 0)

      let profitToday = 0
      ;(todaySales || []).forEach((sale: TodaySalesQueryData) => {
        sale.sale_items?.forEach((item: { quantity: number; unit_price: number; products: { cost: number } }) => {
          const cost = item.products?.cost || 0
          const itemProfit = (item.unit_price - cost) * item.quantity
          profitToday += itemProfit
        })
      })

      const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0

      // Método de pagamento mais usado
      const paymentMethods = (statsData || []).reduce((acc: Record<string, number>, sale: StatsQueryData) => {
        acc[sale.payment_method] = (acc[sale.payment_method] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const topPaymentMethod = Object.entries(paymentMethods)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'cash'

      // Vendas por período (últimos 7 dias)
      const salesByPeriod = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)
        const nextDate = new Date(date)
        nextDate.setDate(nextDate.getDate() + 1)

        const daySales = (statsData || []).filter((sale: StatsQueryData) => {
          const saleDate = new Date(sale.created_at)
          return saleDate >= date && saleDate < nextDate
        })

        const dayRevenue = daySales.reduce((sum: number, sale: StatsQueryData) => sum + sale.total, 0)
        let dayProfit = 0

        daySales.forEach((sale: StatsQueryData) => {
          sale.sale_items?.forEach((item: StatsItemQueryData) => {
            const cost = item.products?.cost || 0
            const itemProfit = (item.unit_price - cost) * item.quantity
            dayProfit += itemProfit
          })
        })

        salesByPeriod.push({
          period: date.toISOString().split('T')[0],
          count: daySales.length,
          revenue: dayRevenue,
          profit: dayProfit
        })
      }

      const newStats: SalesStats = {
        total_sales: totalSales,
        total_revenue: totalRevenue,
        total_profit: totalProfit,
        profit_margin: profitMargin,
        sales_today: salesToday,
        revenue_today: revenueToday,
        profit_today: profitToday,
        avg_ticket: avgTicket,
        top_payment_method: topPaymentMethod,
        sales_by_period: salesByPeriod
      }

      setStats(newStats)

    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [supabase])

  const setFilters = useCallback((newFilters: Partial<SaleFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 }
    setFiltersState(updatedFilters)
  }, [filters])

  const setPage = useCallback((page: number) => {
    const updatedFilters = { ...filters, page }
    setFiltersState(updatedFilters)
  }, [filters])

  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchSales(filters),
      fetchStats(filters)
    ])
  }, [fetchSales, fetchStats, filters])

  const exportSales = useCallback(async (format: 'csv' | 'excel') => {
    try {
      setLoading(true)

      // Buscar todas as vendas sem paginação para exportação
      const exportFilters = { ...filters, page: 1, limit: 10000 }

      let query = supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            quantity,
            unit_price,
            total_price,
            product_name,
            product_sku,
            products (
              cost
            )
          ),
          customers (
            name,
            email,
            phone,
            type,
            cpf_cnpj
          )
        `)

      // Aplicar mesmos filtros
      if (exportFilters.search) {
        query = query.or(`
          customers.name.ilike.%${exportFilters.search}%,
          id.ilike.%${exportFilters.search}%,
          salesperson_name.ilike.%${exportFilters.search}%
        `)
      }

      if (exportFilters.date_from) {
        query = query.gte('created_at', exportFilters.date_from)
      }
      if (exportFilters.date_to) {
        query = query.lte('created_at', exportFilters.date_to)
      }

      if (exportFilters.customer_type && exportFilters.customer_type !== 'all') {
        query = query.eq('customers.type', exportFilters.customer_type)
      }

      if (exportFilters.payment_method && exportFilters.payment_method !== 'all') {
        query = query.eq('payment_method', exportFilters.payment_method)
      }

      if (exportFilters.status && exportFilters.status !== 'all') {
        query = query.eq('status', exportFilters.status)
      }

      if (exportFilters.order_source && exportFilters.order_source !== 'all') {
        query = query.eq('order_source', exportFilters.order_source)
      }

      if (exportFilters.salesperson_name) {
        query = query.ilike('salesperson_name', `%${exportFilters.salesperson_name}%`)
      }

      if (exportFilters.min_total) {
        query = query.gte('total', exportFilters.min_total)
      }
      if (exportFilters.max_total) {
        query = query.lte('total', exportFilters.max_total)
      }

      const sortColumn = exportFilters.sort_by === 'customer_name' ? 'customers.name' : exportFilters.sort_by
      query = query.order(sortColumn || 'created_at', {
        ascending: exportFilters.sort_order === 'asc'
      })

      const { data, error } = await query

      if (error) {
        throw error
      }

      // Preparar dados para exportação
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processedExportData = (data || []).map((sale: any) => {
        const customer = sale.customers
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const totalCost = sale.sale_items?.reduce((sum: number, item: any) => {
          const cost = item.products?.cost || 0
          return sum + (cost * item.quantity)
        }, 0) || 0
        const totalProfit = sale.total - totalCost
        const profitMargin = sale.total > 0 ? (totalProfit / sale.total) * 100 : 0

        return {
          id: sale.id,
          created_at: sale.created_at,
          customer_name: customer?.name || 'N/A',
          customer_type: customer?.type ? CUSTOMER_TYPES[customer.type as keyof typeof CUSTOMER_TYPES] : 'N/A',
          customer_email: customer?.email || 'N/A',
          customer_phone: customer?.phone || 'N/A',
          customer_document: customer?.cpf_cnpj || 'N/A',
          salesperson_name: sale.salesperson_name || 'N/A',
          payment_method: PAYMENT_METHODS[sale.payment_method as keyof typeof PAYMENT_METHODS] || sale.payment_method,
          status: SALE_STATUSES[sale.status as keyof typeof SALE_STATUSES] || sale.status,
          subtotal: sale.subtotal,
          discount_amount: sale.discount_amount || 0,
          total: sale.total,
          total_cost: totalCost,
          total_profit: totalProfit,
          profit_margin: profitMargin,
          items_count: sale.sale_items.length,
          notes: sale.notes || 'N/A'
        }
      })

      // Exportar usando a nova função
      exportData({
        filename: 'vendas',
        sheetName: 'Vendas',
        columns: SALES_EXPORT_COLUMNS,
        data: processedExportData,
        format
      })

      toast({
        title: 'Sucesso',
        description: `Vendas exportadas em ${format.toUpperCase()}`,
        variant: 'success'
      })

    } catch (error) {
      console.error('Error exporting sales:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível exportar as vendas',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [filters, supabase, toast])

  // Funções utilitárias
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }



  // Effects
  useEffect(() => {
    fetchSales(filters)
    fetchStats(filters)
  }, [fetchSales, fetchStats, filters])

  return {
    sales,
    loading,
    error,
    stats,
    filters,
    pagination,
    setFilters,
    setPage,
    refreshData,
    exportSales,
    formatCurrency,
    formatDate
  }
}
