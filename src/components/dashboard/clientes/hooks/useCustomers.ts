import { useState, useEffect, useCallback } from 'react'
import { useSupabaseAdmin } from '@/hooks/useSupabaseAdmin'
import {
  CustomerWithDetails,
  CustomerFilters,
  CustomerPurchaseStats,
  CustomerReviewStats
} from '@/types/customers'

export interface UseCustomersReturn {
  customers: CustomerWithDetails[]
  loading: boolean
  error: string | null
  total: number
  page: number
  hasMore: boolean
  filters: CustomerFilters
  setFilters: (filters: Partial<CustomerFilters>) => void
  refreshData: () => Promise<void>
  loadMore: () => Promise<void>
  resetFilters: () => void
  globalStats: {
    totalCustomers: number
    activeCustomers: number
    inactiveCustomers: number
    businessCustomers: number
    individualCustomers: number
  }
}

const DEFAULT_FILTERS: CustomerFilters = {
  search: '',
  status: 'all',
  type: 'all',
  page: 1,
  limit: 20,
  sort_by: 'name',
  sort_order: 'asc'
}

export function useCustomers(): UseCustomersReturn {
  const supabase = useSupabaseAdmin()
  const [customers, setCustomers] = useState<CustomerWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [filters, setFiltersState] = useState<CustomerFilters>(DEFAULT_FILTERS)
  const [globalStats, setGlobalStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    inactiveCustomers: 0,
    businessCustomers: 0,
    individualCustomers: 0
  })

  const buildQuery = useCallback((currentFilters: CustomerFilters, isLoadMore = false) => {
    let query = supabase
      .from('customers')
      .select(`
        *,
        addresses:customer_addresses(*),
        preferences:customer_preferences(*)
      `)
      .eq('is_anonymous', false) // Excluir clientes anônimos conforme solicitado

    // Aplicar filtros
    if (currentFilters.search) {
      query = query.or(`name.ilike.%${currentFilters.search}%,email.ilike.%${currentFilters.search}%,cpf_cnpj.ilike.%${currentFilters.search}%`)
    }

    if (currentFilters.status && currentFilters.status !== 'all') {
      query = query.eq('status', currentFilters.status)
    }

    if (currentFilters.type && currentFilters.type !== 'all') {
      query = query.eq('type', currentFilters.type)
    }

    if (currentFilters.city) {
      query = query.contains('address', { city: currentFilters.city })
    }

    if (currentFilters.registration_date_from) {
      query = query.gte('created_at', currentFilters.registration_date_from)
    }

    if (currentFilters.registration_date_to) {
      query = query.lte('created_at', currentFilters.registration_date_to)
    }

    if (currentFilters.last_purchase_from && currentFilters.last_purchase_from) {
      query = query.gte('last_purchase', currentFilters.last_purchase_from)
    }

    if (currentFilters.last_purchase_to) {
      query = query.lte('last_purchase', currentFilters.last_purchase_to)
    }

    if (currentFilters.min_spent) {
      query = query.gte('total_spent', currentFilters.min_spent)
    }

    if (currentFilters.max_spent) {
      query = query.lte('total_spent', currentFilters.max_spent)
    }

    // Ordenação
    const sortColumn = currentFilters.sort_by || 'name'
    const sortOrder = currentFilters.sort_order || 'asc'
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' })

    // Paginação
    const currentPage = isLoadMore ? (currentFilters.page || 1) : 1
    const limit = currentFilters.limit || 20
    const start = (currentPage - 1) * limit
    const end = start + limit - 1

    query = query.range(start, end)

    return query
  }, [supabase])

  const loadGlobalStats = useCallback(async () => {
    try {
      // Buscar estatísticas globais (todos os clientes não anônimos)
      const { data: allCustomers } = await supabase
        .from('customers')
        .select('status, type')
        .eq('is_anonymous', false)

      if (allCustomers) {
        const totalCustomers = allCustomers.length
        const activeCustomers = allCustomers.filter(c => c.status === 'active').length
        const inactiveCustomers = allCustomers.filter(c => c.status === 'inactive').length
        const businessCustomers = allCustomers.filter(c => c.type === 'business').length
        const individualCustomers = allCustomers.filter(c => c.type === 'individual').length

        setGlobalStats({
          totalCustomers,
          activeCustomers,
          inactiveCustomers,
          businessCustomers,
          individualCustomers
        })
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas globais:', err)
    }
  }, [supabase])

  const calculateCustomerStats = useCallback(async (customerId: string): Promise<{
    purchaseStats: CustomerPurchaseStats
    reviewStats: CustomerReviewStats
  }> => {
    try {
      // Buscar estatísticas de compras
      const { data: salesData } = await supabase
        .from('sales')
        .select('total, created_at, payment_method')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })

      // Buscar itens mais comprados
      const { data: itemsData } = await supabase
        .from('sale_items')
        .select(`
          product_name,
          product_id,
          quantity,
          sales!inner(customer_id)
        `)
        .eq('sales.customer_id', customerId)

      // Buscar estatísticas de reviews
      const { data: reviewsData } = await supabase
        .from('product_reviews')
        .select('rating, created_at, helpful_count, status')
        .eq('customer_id', customerId)

      // Calcular estatísticas de compra
      const totalOrders = salesData?.length || 0
      const totalSpent = salesData?.reduce((sum, sale) => sum + sale.total, 0) || 0
      const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0
      const lastPurchaseDate = salesData?.[0]?.created_at || null

      // Produto mais comprado
      const productCounts = itemsData?.reduce((acc, item) => {
        acc[item.product_name] = (acc[item.product_name] || 0) + item.quantity
        return acc
      }, {} as Record<string, number>) || {}

      const favoriteProducts = Object.entries(productCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([name]) => name)

      // Calcular estatísticas de reviews
      const totalReviews = reviewsData?.length || 0
      const avgRating = totalReviews > 0
        ? reviewsData!.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0
      const helpfulReviews = reviewsData?.filter(r => (r.helpful_count || 0) > 0).length || 0
      const lastReviewDate = reviewsData?.[0]?.created_at || null

      return {
        purchaseStats: {
          total_orders: totalOrders,
          total_spent: totalSpent,
          avg_order_value: avgOrderValue,
          last_purchase_date: lastPurchaseDate,
          most_purchased_category: null, // TODO: implementar se necessário
          favorite_products: favoriteProducts
        },
        reviewStats: {
          total_reviews: totalReviews,
          avg_rating: avgRating,
          helpful_reviews: helpfulReviews,
          last_review_date: lastReviewDate
        }
      }
    } catch (err) {
      console.error('Erro ao calcular estatísticas do cliente:', err)
      return {
        purchaseStats: {
          total_orders: 0,
          total_spent: 0,
          avg_order_value: 0,
          last_purchase_date: null,
          most_purchased_category: null,
          favorite_products: []
        },
        reviewStats: {
          total_reviews: 0,
          avg_rating: 0,
          helpful_reviews: 0,
          last_review_date: null
        }
      }
    }
  }, [supabase])

  const loadCustomers = useCallback(async (isLoadMore = false) => {
    try {
      setLoading(true)
      setError(null)

      const currentFilters = isLoadMore ? { ...filters, page: page + 1 } : filters
      const query = buildQuery(currentFilters, isLoadMore)

      const { data: customersData, error: customersError, count } = await query

      if (customersError) {
        throw new Error(`Erro ao carregar clientes: ${customersError.message}`)
      }

      if (!customersData) {
        throw new Error('Nenhum dado retornado')
      }

      // Enriquecer com estatísticas (fazer em lote para performance)
      const enrichedCustomers = await Promise.all(
        customersData.map(async (customer) => {
          const stats = await calculateCustomerStats(customer.id)
          return {
            ...customer,
            purchase_stats: stats.purchaseStats,
            review_stats: stats.reviewStats
          } as CustomerWithDetails
        })
      )

      if (isLoadMore) {
        setCustomers(prev => [...prev, ...enrichedCustomers])
        setPage(prev => prev + 1)
      } else {
        setCustomers(enrichedCustomers)
        setPage(1)
      }

      setTotal(count || 0)
      setHasMore((customersData.length === (currentFilters.limit || 20)) && (count || 0) > enrichedCustomers.length)

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar clientes'
      setError(message)
      console.error('Erro ao carregar clientes:', err)
    } finally {
      setLoading(false)
    }
  }, [filters, page, buildQuery, calculateCustomerStats])

  const setFilters = useCallback((newFilters: Partial<CustomerFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters, page: 1 }))
    setPage(1)
  }, [])

  const refreshData = useCallback(async () => {
    await Promise.all([
      loadCustomers(false),
      loadGlobalStats()
    ])
  }, [loadCustomers, loadGlobalStats])

  const loadMore = useCallback(async () => {
    if (!loading && hasMore) {
      await loadCustomers(true)
    }
  }, [loading, hasMore, loadCustomers])

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS)
    setPage(1)
  }, [])

  useEffect(() => {
    loadCustomers(false)
  }, [filters, loadCustomers])

  useEffect(() => {
    loadGlobalStats()
  }, [loadGlobalStats])

  return {
    customers,
    loading,
    error,
    total,
    page,
    hasMore,
    filters,
    setFilters,
    refreshData,
    loadMore,
    resetFilters,
    globalStats
  }
}
