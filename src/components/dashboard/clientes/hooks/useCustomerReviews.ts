import { useState, useEffect, useCallback } from 'react'
import { useSupabaseAdmin } from '@/hooks/useSupabaseAdmin'
import { CustomerReview } from '@/types/customers'

export interface UseCustomerReviewsReturn {
  reviews: CustomerReview[]
  loading: boolean
  error: string | null
  refreshData: () => Promise<void>
  totalReviews: number
  averageRating: number
  loadMore: () => Promise<void>
  hasMore: boolean
  reviewStats: {
    total: number
    approved: number
    pending: number
    rejected: number
    helpful: number
    avgRating: number
  }
}

export function useCustomerReviews(customerId: string | null, limit = 10): UseCustomerReviewsReturn {
  const supabase = useSupabaseAdmin()
  const [reviews, setReviews] = useState<CustomerReview[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [totalReviews, setTotalReviews] = useState(0)
  const [averageRating, setAverageRating] = useState(0)
  const [reviewStats, setReviewStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    helpful: 0,
    avgRating: 0
  })

  const loadReviews = useCallback(async (isLoadMore = false) => {
    if (!customerId) {
      setReviews([])
      setTotalReviews(0)
      setAverageRating(0)
      setReviewStats({
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        helpful: 0,
        avgRating: 0
      })
      return
    }

    try {
      setLoading(true)
      setError(null)

      const currentPage = isLoadMore ? page + 1 : 1
      const start = (currentPage - 1) * limit
      const end = start + limit - 1

      // Buscar reviews do cliente com informações do produto
      const { data: reviewsData, error: reviewsError, count } = await supabase
        .from('product_reviews')
        .select(`
          id,
          product_id,
          rating,
          title,
          comment,
          pros,
          cons,
          recommend,
          created_at,
          status,
          verified_purchase,
          helpful_count,
          products!inner(name, brand)
        `, { count: 'exact' })
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .range(start, end)

      if (reviewsError) {
        throw new Error(`Erro ao carregar reviews: ${reviewsError.message}`)
      }

      // Processar reviews
      const processedReviews: CustomerReview[] = reviewsData?.map(review => ({
        id: review.id,
        product_id: review.product_id,
        product_name: (review.products as { name?: string })?.name || 'Produto não encontrado',
        product_brand: (review.products as { brand?: string })?.brand || '',
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        pros: review.pros,
        cons: review.cons,
        recommend: review.recommend,
        created_at: review.created_at,
        status: review.status,
        verified_purchase: review.verified_purchase
      })) || []

      if (isLoadMore) {
        setReviews(prev => [...prev, ...processedReviews])
        setPage(currentPage)
      } else {
        setReviews(processedReviews)
        setPage(1)
      }

      setTotalReviews(count || 0)
      setHasMore((processedReviews.length === limit) && (count || 0) > (currentPage * limit))

      // Calcular estatísticas (apenas se for primeira página)
      if (!isLoadMore) {
        const { data: allReviewsData } = await supabase
          .from('product_reviews')
          .select('rating, status, helpful_count')
          .eq('customer_id', customerId)

        if (allReviewsData) {
          const total = allReviewsData.length
          const approved = allReviewsData.filter(r => r.status === 'approved').length
          const pending = allReviewsData.filter(r => r.status === 'pending').length
          const rejected = allReviewsData.filter(r => r.status === 'rejected').length
          const helpful = allReviewsData.filter(r => (r.helpful_count || 0) > 0).length
          const avgRating = total > 0
            ? allReviewsData.reduce((sum, r) => sum + r.rating, 0) / total
            : 0

          setAverageRating(avgRating)
          setReviewStats({
            total,
            approved,
            pending,
            rejected,
            helpful,
            avgRating
          })
        }
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar reviews'
      setError(message)
      console.error('Erro ao carregar reviews:', err)
    } finally {
      setLoading(false)
    }
  }, [customerId, page, limit, supabase])

  const refreshData = useCallback(async () => {
    setPage(1)
    await loadReviews(false)
  }, [loadReviews])

  const loadMore = useCallback(async () => {
    if (!loading && hasMore) {
      await loadReviews(true)
    }
  }, [loading, hasMore, loadReviews])

  useEffect(() => {
    if (customerId) {
      loadReviews(false)
    }
  }, [customerId, loadReviews])

  return {
    reviews,
    loading,
    error,
    refreshData,
    totalReviews,
    averageRating,
    loadMore,
    hasMore,
    reviewStats
  }
}
