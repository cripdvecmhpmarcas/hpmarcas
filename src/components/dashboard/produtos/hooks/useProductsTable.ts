import { useState, useEffect, useCallback } from 'react'
import { useSupabaseAdmin } from '@/hooks/useSupabaseAdmin'
import { useToast } from '@/hooks/useToast'
import { updateProductStatus as serverUpdateProductStatus, bulkUpdateProductStatus as serverBulkUpdateProductStatus, searchProducts } from '@/lib/product-actions'
import {
  Product,
  ProductFilters,
  ProductStats,
  ProductWithVolumes,
  PRODUCT_CATEGORIES,
  ProductVolume
} from '@/types/products'
import { exportData, PRODUCT_EXPORT_COLUMNS } from '@/lib/export-utils'

export interface UseProductsTableReturn {
  products: ProductWithVolumes[]
  loading: boolean
  error: string | null
  filters: ProductFilters
  stats: ProductStats | null
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  sorting: {
    column: keyof Product | null
    direction: 'asc' | 'desc'
  }
  selectedProducts: string[]
  setFilters: (filters: Partial<ProductFilters>) => void
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  setSorting: (column: keyof Product | null, direction: 'asc' | 'desc') => void
  setSelectedProducts: (ids: string[]) => void
  toggleProductSelection: (id: string) => void
  selectAllProducts: () => void
  clearSelection: () => void
  refreshProducts: () => Promise<void>
  deleteProducts: (ids: string[]) => Promise<void>
  updateProductStatus: (id: string, status: 'active' | 'inactive') => Promise<void>
  bulkUpdateStatus: (ids: string[], status: 'active' | 'inactive') => Promise<void>
  updateProductPrice: (id: string, priceType: 'retail_price' | 'wholesale_price', newPrice: number) => Promise<boolean>
  bulkUpdatePrices: (ids: string[], priceType: 'retail_price' | 'wholesale_price', newPrice: number) => Promise<boolean>
  exportProducts: (format: 'csv' | 'excel') => Promise<void>
}

const DEFAULT_FILTERS: ProductFilters = {
  search: '',
  category: '',
  subcategory_id: '',
  brand: '',
  status: 'all',
  stock_status: 'all'
}

export function useProductsTable(): UseProductsTableReturn {
  // Cliente Supabase
  const supabase = useSupabaseAdmin()

  // Sistema de notificações
  const { toast } = useToast()
  const [products, setProducts] = useState<ProductWithVolumes[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFiltersState] = useState<ProductFilters>(DEFAULT_FILTERS)
  const [stats, setStats] = useState<ProductStats | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0
  })

  const [sorting, setSortingState] = useState<{
    column: keyof Product | null
    direction: 'asc' | 'desc'
  }>({
    column: 'name',
    direction: 'asc'
  })

  const processProductVolumes = useCallback((product: Product): ProductWithVolumes => {
    let volumes: ProductVolume[] | null = null

    if (product.volumes) {
      try {
        volumes = Array.isArray(product.volumes) ? product.volumes : JSON.parse(product.volumes as string)
      } catch (e) {
        console.warn('Error parsing volumes for product', product.id, e)
        volumes = null
      }
    }

    return {
      ...product,
      volumes
    }
  }, [])

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Use server action instead of direct query
      const result = await searchProducts({
        search: filters.search || '',
        category: filters.category || '',
        subcategory_id: filters.subcategory_id || '',
        brand: filters.brand || '',
        status: filters.status || 'all',
        stock_status: filters.stock_status || 'all',
        price_range: filters.price_range,
        page: pagination.page,
        pageSize: pagination.pageSize,
        sortColumn: sorting.column || 'name',
        sortDirection: sorting.direction
      })

      if (!result.success) {
        throw new Error(result.error || 'Erro ao carregar produtos')
      }

      let processedProducts = (result.data || []).map(processProductVolumes)

      // Aplicar filtros de stock que requerem comparação de colunas no lado cliente
      if (result.stockFilters?.stock_status && result.stockFilters.stock_status !== 'all' && result.stockFilters.stock_status !== 'out_of_stock') {
        if (result.stockFilters.stock_status === 'low_stock') {
          processedProducts = processedProducts.filter(product =>
            product.stock > 0 && product.stock <= product.min_stock
          )
        } else if (result.stockFilters.stock_status === 'in_stock') {
          processedProducts = processedProducts.filter(product =>
            product.stock >= product.min_stock
          )
        }
      }

      setProducts(processedProducts)

      setPagination(prev => ({
        ...prev,
        total: result.count || 0,
        totalPages: Math.ceil((result.count || 0) / prev.pageSize)
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar produtos'
      setError(message)
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [filters, pagination.page, pagination.pageSize, sorting.column, sorting.direction, processProductVolumes, toast])

  const loadStats = useCallback(async () => {
    try {
      const { data: products } = await supabase
        .from('products')
        .select('status, stock, min_stock, cost, retail_price, category, brand')

      if (!products) return

      const stats: ProductStats = {
        total_products: products.length,
        active_products: products.filter(p => p.status === 'active').length,
        inactive_products: products.filter(p => p.status === 'inactive').length,
        low_stock_products: products.filter(p => p.stock < p.min_stock && p.stock > 0).length,
        out_of_stock_products: products.filter(p => p.stock === 0).length,
        total_stock_value: products.reduce((sum, p) => sum + (p.stock * p.cost), 0),
        categories: PRODUCT_CATEGORIES.map(cat => ({
          name: cat,
          count: products.filter(p => p.category === cat).length
        })).filter(c => c.count > 0),
        brands: Object.entries(
          products.reduce((acc, p) => {
            acc[p.brand] = (acc[p.brand] || 0) + 1
            return acc
          }, {} as Record<string, number>)
        ).map(([name, count]) => ({ name, count }))
      }

      setStats(stats)
    } catch (err) {
      console.error('Error loading stats:', err)
    }
  }, [supabase])

  const refreshProducts = useCallback(async () => {
    await Promise.all([loadProducts(), loadStats()])
  }, [loadProducts, loadStats])

  const setFilters = useCallback((newFilters: Partial<ProductFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }, [])

  const setPageSize = useCallback((pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize, page: 1 }))
  }, [])

  const setSorting = useCallback((column: keyof Product | null, direction: 'asc' | 'desc') => {
    setSortingState({ column, direction })
  }, [])

  const toggleProductSelection = useCallback((id: string) => {
    setSelectedProducts(prev =>
      prev.includes(id)
        ? prev.filter(pid => pid !== id)
        : [...prev, id]
    )
  }, [])

  const selectAllProducts = useCallback(() => {
    setSelectedProducts(products.map(p => p.id))
  }, [products])

  const clearSelection = useCallback(() => {
    setSelectedProducts([])
  }, [])

  const deleteProducts = useCallback(async (ids: string[]) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', ids)

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: `${ids.length} produto(s) exclu�do(s) com sucesso`
      })

      await refreshProducts()
      clearSelection()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir produtos'
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive'
      })
    }
  }, [supabase, toast, refreshProducts, clearSelection])

  const updateProductStatus = useCallback(async (id: string, status: 'active' | 'inactive') => {
    try {
      const result = await serverUpdateProductStatus(id, status)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: 'Sucesso',
        description: 'Status do produto atualizado com sucesso'
      })

      await refreshProducts()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar produto'
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive'
      })
    }
  }, [toast, refreshProducts])

  const bulkUpdateStatus = useCallback(async (ids: string[], status: 'active' | 'inactive') => {
    try {
      const result = await serverBulkUpdateProductStatus(ids, status)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: 'Sucesso',
        description: `${result.count || ids.length} produto(s) atualizado(s) com sucesso`
      })

      await refreshProducts()
      clearSelection()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar produtos'
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive'
      })
    }
  }, [toast, refreshProducts, clearSelection])

  const exportProducts = useCallback(async (format: 'csv' | 'excel') => {
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .order('name')

      if (!data) return

      const processedExportData = data.map(product => ({
        id: product.id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        sku: product.sku,
        barcode: product.barcode || '',
        cost: product.cost,
        wholesale_price: product.wholesale_price,
        retail_price: product.retail_price,
        stock: product.stock,
        min_stock: product.min_stock,
        stock_status: product.stock === 0 ? 'Sem Estoque' :
                    product.stock < product.min_stock ? 'Estoque Baixo' : 'Em Estoque',
        margin_percentage: product.cost > 0 ? ((product.retail_price - product.cost) / product.cost * 100) : 0,
        stock_value: product.stock * product.cost,
        status: product.status === 'active' ? 'Ativo' : 'Inativo',
        created_at: product.created_at,
        description: product.description || '',
        volumes: product.volumes ? JSON.stringify(product.volumes) : ''
      }))

      exportData({
        filename: 'produtos',
        sheetName: 'Produtos',
        columns: PRODUCT_EXPORT_COLUMNS,
        data: processedExportData,
        format
      })

      toast({
        title: 'Sucesso',
        description: `Produtos exportados em ${format.toUpperCase()}`,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao exportar produtos'
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive'
      })
    }
  }, [supabase, toast])

  // Função para atualizar preço individual
  const updateProductPrice = useCallback(async (id: string, priceType: 'retail_price' | 'wholesale_price', newPrice: number) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ [priceType]: newPrice })
        .eq('id', id)

      if (error) throw error

      // Atualizar produto no estado local
      setProducts(prev => prev.map(product =>
        product.id === id
          ? { ...product, [priceType]: newPrice }
          : product
      ))

      toast({
        title: 'Sucesso',
        description: 'Preço atualizado com sucesso'
      })

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar preço'
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive'
      })
      return false
    }
  }, [supabase, toast])

  // Função para atualizar preços em massa
  const bulkUpdatePrices = useCallback(async (ids: string[], priceType: 'retail_price' | 'wholesale_price', newPrice: number) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ [priceType]: newPrice })
        .in('id', ids)

      if (error) throw error

      // Atualizar produtos no estado local
      setProducts(prev => prev.map(product =>
        ids.includes(product.id)
          ? { ...product, [priceType]: newPrice }
          : product
      ))

      toast({
        title: 'Sucesso',
        description: `${ids.length} produto(s) atualizado(s) com sucesso`
      })

      clearSelection()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar preços'
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive'
      })
      return false
    }
  }, [supabase, toast, clearSelection])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  return {
    products,
    loading,
    error,
    filters,
    stats,
    pagination,
    sorting,
    selectedProducts,
    setFilters,
    setPage,
    setPageSize,
    setSorting,
    setSelectedProducts,
    toggleProductSelection,
    selectAllProducts,
    clearSelection,
    refreshProducts,
    deleteProducts,
    updateProductStatus,
    bulkUpdateStatus,
    exportProducts,
    updateProductPrice,
    bulkUpdatePrices
  }
}
