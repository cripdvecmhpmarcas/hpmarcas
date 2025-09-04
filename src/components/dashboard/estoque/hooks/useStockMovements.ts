import { useState, useEffect, useCallback } from 'react'
import { useSupabaseAdmin } from '@/hooks/useSupabaseAdmin'
import { useToast } from '@/hooks/useToast'
import {
  StockMovementWithProduct,
  StockMovementFilters,
  StockMovementFormData,
  StockAdjustmentData
} from '@/types/stock'

export interface UseStockMovementsReturn {
  movements: StockMovementWithProduct[]
  loading: boolean
  error: string | null
  filters: StockMovementFilters
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  setFilters: (filters: Partial<StockMovementFilters>) => void
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  refreshMovements: () => Promise<void>
  createMovement: (data: StockMovementFormData) => Promise<void>
  adjustStock: (data: StockAdjustmentData) => Promise<void>
}

const DEFAULT_FILTERS: StockMovementFilters = {
  search: '',
  type: 'all',
  reason: 'all',
  date_from: '',
  date_to: ''
}

export function useStockMovements(): UseStockMovementsReturn {
  const supabase = useSupabaseAdmin()
  const { toast } = useToast()
  const [movements, setMovements] = useState<StockMovementWithProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFiltersState] = useState<StockMovementFilters>(DEFAULT_FILTERS)

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  })


  const buildQuery = useCallback(() => {
    let query = supabase
      .from('stock_movements')
      .select(`
        *,
        product:products!stock_movements_product_id_fkey (
          id,
          name,
          sku,
          brand,
          category,
          images
        )
      `, { count: 'exact' })

    // Aplicar filtros
    if (filters.product_id) {
      query = query.eq('product_id', filters.product_id)
    }

    if (filters.type && filters.type !== 'all') {
      query = query.eq('type', filters.type)
    }

    if (filters.reason && filters.reason !== 'all') {
      query = query.eq('reason', filters.reason)
    }

    if (filters.date_from) {
      query = query.gte('created_at', `${filters.date_from}T00:00:00.000Z`)
    }

    if (filters.date_to) {
      query = query.lte('created_at', `${filters.date_to}T23:59:59.999Z`)
    }

    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id)
    }

    query = query.order('created_at', { ascending: false })

    const from = (pagination.page - 1) * pagination.pageSize
    const to = from + pagination.pageSize - 1
    query = query.range(from, to)

    return query
  }, [filters.date_from, filters.date_to, filters.product_id, filters.reason, filters.type, filters.user_id, pagination.page, pagination.pageSize, supabase])

  const loadMovements = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error, count } = await buildQuery()

      if (error) throw error

      let processedMovements = (data || []).map(movement => ({
        ...movement,
        product: movement.product as {
          id: string
          name: string
          sku: string
          brand: string
          category: string
          images: string[] | null
        }
      }))

      // Apply search filter on client side since we have the joined product data
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        processedMovements = processedMovements.filter(movement =>
          movement.product?.name?.toLowerCase().includes(searchTerm) ||
          movement.product?.sku?.toLowerCase().includes(searchTerm) ||
          movement.product?.brand?.toLowerCase().includes(searchTerm)
        )
      }

      setMovements(processedMovements)

      setPagination(prev => ({
        ...prev,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / prev.pageSize)
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar movimentações'
      setError(message)
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [buildQuery, filters.search, toast])

  const createMovement = useCallback(async (data: StockMovementFormData) => {
    try {
      // Buscar dados do produto
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', data.product_id)
        .single()

      if (productError || !product) {
        throw new Error('Produto não encontrado')
      }

      // Buscar usuário atual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single()

      // Calcular nova quantidade
      let newQuantity = product.stock
      if (data.type === 'entry') {
        newQuantity += data.quantity
      } else if (data.type === 'exit') {
        newQuantity -= data.quantity
        if (newQuantity < 0) {
          throw new Error('Quantidade insuficiente em estoque')
        }
      } else if (data.type === 'adjustment') {
        newQuantity = data.quantity
      }

      // Criar movimentação
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: data.product_id,
          product_name: product.name,
          product_sku: product.sku,
          type: data.type,
          quantity: data.quantity,
          previous_quantity: product.stock,
          new_quantity: newQuantity,
          reason: data.reason,
          notes: data.notes,
          cost: data.cost,
          supplier: data.supplier,
          user_id: user.id,
          user_name: profile?.name || user.email || 'Usuário'
        })

      if (movementError) {
        console.error('Erro ao criar movimentação:', movementError)
        throw new Error('Erro ao criar movimentação: ' + movementError.message)
      }

      // Atualizar estoque do produto
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock: newQuantity })
        .eq('id', data.product_id)

      if (updateError) {
        console.error('Erro ao atualizar estoque:', updateError)
        throw new Error('Erro ao atualizar estoque: ' + updateError.message)
      }

      toast({
        title: 'Sucesso',
        description: 'Movimentação de estoque criada com sucesso',
        variant: 'default'
      })

      // Recarregar movimentações
      await loadMovements()
    } catch (err) {
      console.error('Erro ao criar movimentação:', err)
      const message = err instanceof Error ? err.message : 'Erro ao criar movimentação'
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive'
      })
      throw err
    }
  }, [supabase, toast, loadMovements])

  const adjustStock = useCallback(async (data: StockAdjustmentData) => {
    try {
      const adjustmentData: StockMovementFormData = {
        product_id: data.product_id,
        type: 'adjustment',
        quantity: data.new_quantity,
        reason: data.reason,
        notes: data.notes
      }

      await createMovement(adjustmentData)
    } catch (err) {
      throw err
    }
  }, [createMovement])


  const setFilters = useCallback((newFilters: Partial<StockMovementFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }, [])

  const setPageSize = useCallback((pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize, page: 1 }))
  }, [])

  const refreshMovements = useCallback(async () => {
    await loadMovements()
  }, [loadMovements])

  useEffect(() => {
    loadMovements()
  }, [loadMovements])

  return {
    movements,
    loading,
    error,
    filters,
    pagination,
    setFilters,
    setPage,
    setPageSize,
    refreshMovements,
    createMovement,
    adjustStock
  }
}
