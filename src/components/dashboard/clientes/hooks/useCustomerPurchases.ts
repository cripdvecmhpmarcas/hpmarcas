import { useState, useEffect, useCallback } from 'react'
import { useSupabaseAdmin } from '@/hooks/useSupabaseAdmin'
import { CustomerPurchase, CustomerPurchaseItem } from '@/types/customers'

export interface UseCustomerPurchasesReturn {
  purchases: CustomerPurchase[]
  loading: boolean
  error: string | null
  refreshData: () => Promise<void>
  totalPurchases: number
  totalSpent: number
  loadMore: () => Promise<void>
  hasMore: boolean
}

export function useCustomerPurchases(customerId: string | null, limit = 10): UseCustomerPurchasesReturn {
  const supabase = useSupabaseAdmin()
  const [purchases, setPurchases] = useState<CustomerPurchase[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [totalPurchases, setTotalPurchases] = useState(0)
  const [totalSpent, setTotalSpent] = useState(0)

  const loadPurchases = useCallback(async (isLoadMore = false) => {
    if (!customerId) {
      setPurchases([])
      setTotalPurchases(0)
      setTotalSpent(0)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const currentPage = isLoadMore ? page + 1 : 1
      const start = (currentPage - 1) * limit
      const end = start + limit - 1

      // Buscar vendas do cliente
      const { data: salesData, error: salesError, count } = await supabase
        .from('sales')
        .select(`
          id,
          created_at,
          total,
          status,
          payment_method,
          notes
        `, { count: 'exact' })
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .range(start, end)

      if (salesError) {
        throw new Error(`Erro ao carregar compras: ${salesError.message}`)
      }

      const salesIds = salesData?.map(sale => sale.id) || []

      // Buscar itens das vendas
      const { data: itemsData, error: itemsError } = await supabase
        .from('sale_items')
        .select('*')
        .in('sale_id', salesIds)

      if (itemsError) {
        throw new Error(`Erro ao carregar itens das compras: ${itemsError.message}`)
      }

      // Agrupar itens por venda
      const itemsBySale = itemsData?.reduce((acc, item) => {
        if (!acc[item.sale_id]) {
          acc[item.sale_id] = []
        }
        acc[item.sale_id].push({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_sku: item.product_sku,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        } as CustomerPurchaseItem)
        return acc
      }, {} as Record<string, CustomerPurchaseItem[]>) || {}

      // Montar array de compras
      const processedPurchases: CustomerPurchase[] = salesData?.map(sale => ({
        id: sale.id,
        sale_date: sale.created_at,
        total: sale.total,
        status: sale.status,
        payment_method: sale.payment_method,
        items_count: itemsBySale[sale.id]?.length || 0,
        items: itemsBySale[sale.id] || []
      })) || []

      if (isLoadMore) {
        setPurchases(prev => [...prev, ...processedPurchases])
        setPage(currentPage)
      } else {
        setPurchases(processedPurchases)
        setPage(1)
      }

      setTotalPurchases(count || 0)
      setHasMore((processedPurchases.length === limit) && (count || 0) > (currentPage * limit))

      // Calcular total gasto (apenas se for primeira página)
      if (!isLoadMore) {
        const { data: totalData } = await supabase
          .from('sales')
          .select('total')
          .eq('customer_id', customerId)

        const calculatedTotal = totalData?.reduce((sum, sale) => sum + sale.total, 0) || 0
        setTotalSpent(calculatedTotal)
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar compras'
      setError(message)
      console.error('Erro ao carregar compras:', err)
    } finally {
      setLoading(false)
    }
  }, [customerId, page, limit, supabase])

  const refreshData = useCallback(async () => {
    setPage(1)
    await loadPurchases(false)
  }, [loadPurchases])

  const loadMore = useCallback(async () => {
    if (!loading && hasMore) {
      await loadPurchases(true)
    }
  }, [loading, hasMore, loadPurchases])

  useEffect(() => {
    if (customerId) {
      loadPurchases(false)
    }
  }, [customerId, loadPurchases])

  return {
    purchases,
    loading,
    error,
    refreshData,
    totalPurchases,
    totalSpent,
    loadMore,
    hasMore
  }
}
