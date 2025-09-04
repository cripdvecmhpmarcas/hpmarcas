import { useState, useEffect, useCallback } from 'react'
import { useSupabaseAdmin } from '@/hooks/useSupabaseAdmin'
import { CustomerWithDetails } from '@/types/customers'

export interface UseCustomerDetailsReturn {
  customer: CustomerWithDetails | null
  loading: boolean
  error: string | null
  refreshData: () => Promise<void>
}

export function useCustomerDetails(customerId: string | null): UseCustomerDetailsReturn {
  const supabase = useSupabaseAdmin()
  const [customer, setCustomer] = useState<CustomerWithDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCustomerDetails = useCallback(async () => {
    if (!customerId) {
      setCustomer(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Buscar dados básicos do cliente
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select(`
          *,
          addresses:customer_addresses(*),
          preferences:customer_preferences(*)
        `)
        .eq('id', customerId)
        .eq('is_anonymous', false)
        .single()

      if (customerError) {
        throw new Error(`Erro ao carregar cliente: ${customerError.message}`)
      }

      if (!customerData) {
        throw new Error('Cliente não encontrado')
      }

      // Buscar estatísticas de compras
      const { data: salesData } = await supabase
        .from('sales')
        .select('id, total, created_at, payment_method, status')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })

      // Buscar itens comprados para estatísticas
      const { data: itemsData } = await supabase
        .from('sale_items')
        .select(`
          product_name,
          product_id,
          quantity,
          sales!inner(customer_id, created_at)
        `)
        .eq('sales.customer_id', customerId)

      // Buscar reviews do cliente
      const { data: reviewsData } = await supabase
        .from('product_reviews')
        .select('id, rating, created_at, helpful_count, status')
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
        .slice(0, 5)
        .map(([name]) => name)

      // Calcular estatísticas de reviews
      const totalReviews = reviewsData?.length || 0
      const avgRating = totalReviews > 0
        ? reviewsData!.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0
      const helpfulReviews = reviewsData?.filter(r => (r.helpful_count || 0) > 0).length || 0
      const lastReviewDate = reviewsData?.[0]?.created_at || null

      // Montar objeto completo
      const enrichedCustomer: CustomerWithDetails = {
        ...customerData,
        preferences: customerData.preferences || undefined,
        purchase_stats: {
          total_orders: totalOrders,
          total_spent: totalSpent,
          avg_order_value: avgOrderValue,
          last_purchase_date: lastPurchaseDate,
          most_purchased_category: null,
          favorite_products: favoriteProducts
        },
        review_stats: {
          total_reviews: totalReviews,
          avg_rating: avgRating,
          helpful_reviews: helpfulReviews,
          last_review_date: lastReviewDate
        }
      }

      setCustomer(enrichedCustomer)

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar detalhes do cliente'
      setError(message)
      console.error('Erro ao carregar detalhes do cliente:', err)
    } finally {
      setLoading(false)
    }
  }, [customerId, supabase])

  const refreshData = useCallback(async () => {
    await loadCustomerDetails()
  }, [loadCustomerDetails])

  useEffect(() => {
    loadCustomerDetails()
  }, [loadCustomerDetails])

  return {
    customer,
    loading,
    error,
    refreshData
  }
}
