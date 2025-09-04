import { useState, useEffect, useCallback } from 'react'
import { useSupabaseAdmin } from '@/hooks/useSupabaseAdmin'
import { LowStockProduct, getStockStatusWithSettings } from '@/types/stock'
import { useStockSettings } from './useStockSettings'

export interface UseLowStockAlertReturn {
  lowStockProducts: LowStockProduct[]
  criticalStockProducts: LowStockProduct[]
  outOfStockProducts: LowStockProduct[]
  loading: boolean
  error: string | null
  totalAlert: number
  refreshData: () => Promise<void>
  dismissAlert: (productId: string) => void
  dismissedAlerts: string[]
  // Produtos para notificações (sem dismissed)
  notificationProducts: {
    lowStock: LowStockProduct[]
    critical: LowStockProduct[]
    outOfStock: LowStockProduct[]
  }
  dismissNotification: (productId: string) => void
  dismissedNotifications: string[]
  clearAllDismissed: () => void
}

export function useLowStockAlert(): UseLowStockAlertReturn {
  const supabase = useSupabaseAdmin()
  const { settings, isLoaded } = useStockSettings()
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([])
  const [criticalStockProducts, setCriticalStockProducts] = useState<LowStockProduct[]>([])
  const [outOfStockProducts, setOutOfStockProducts] = useState<LowStockProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([])
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([])

  // Produtos para notificações (sem os dismissados de notificações)
  const [notificationProducts, setNotificationProducts] = useState<{
    lowStock: LowStockProduct[]
    critical: LowStockProduct[]
    outOfStock: LowStockProduct[]
  }>({
    lowStock: [],
    critical: [],
    outOfStock: []
  })

  // Carregar alertas dismissados do localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('dismissed_stock_alerts')
    if (dismissed) {
      try {
        setDismissedAlerts(JSON.parse(dismissed))
      } catch (e) {
        console.error('Erro ao carregar alertas dismissados:', e)
      }
    }
  }, [])

  // Carregar notificações dismissadas do localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('dismissed_stock_notifications')
    if (dismissed) {
      try {
        setDismissedNotifications(JSON.parse(dismissed))
      } catch (e) {
        console.error('Erro ao carregar notificações dismissadas:', e)
      }
    }
  }, [])

  const loadStockAlerts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Buscar todos os produtos ativos para verificar quais não têm mais problemas de estoque
      const { data: allActiveProducts } = await supabase
        .from('products')
        .select('id, stock, min_stock, status')
        .eq('status', 'active')

      // Obter listas atualizadas do localStorage
      const currentDismissedAlerts = JSON.parse(localStorage.getItem('dismissed_stock_alerts') || '[]')
      const currentDismissedNotifications = JSON.parse(localStorage.getItem('dismissed_stock_notifications') || '[]')

      // Verificar produtos dismissed que não têm mais problemas de estoque
      if (allActiveProducts) {
        const productsWithGoodStock = allActiveProducts.filter(p => {
          const status = getStockStatusWithSettings(p.stock!, p.min_stock!, settings)
          return status === 'in_stock' // Produtos com estoque adequado
        })

        // Remover da lista de dismissed produtos que agora têm estoque adequado
        const goodStockIds = productsWithGoodStock.map(p => p.id!)
        const updatedDismissedAlerts = currentDismissedAlerts.filter((id: string) => !goodStockIds.includes(id))
        const updatedDismissedNotifications = currentDismissedNotifications.filter((id: string) => !goodStockIds.includes(id))

        // Atualizar localStorage e state se houve mudanças
        if (updatedDismissedAlerts.length !== currentDismissedAlerts.length) {
          setDismissedAlerts(updatedDismissedAlerts)
          localStorage.setItem('dismissed_stock_alerts', JSON.stringify(updatedDismissedAlerts))
        }

        if (updatedDismissedNotifications.length !== currentDismissedNotifications.length) {
          setDismissedNotifications(updatedDismissedNotifications)
          localStorage.setItem('dismissed_stock_notifications', JSON.stringify(updatedDismissedNotifications))
        }
      }

      const { data: products } = await supabase
        .from('low_stock_products')
        .select('*')
        .eq('status', 'active')
        .order('units_needed', { ascending: false })

      if (!products) {
        throw new Error('Erro ao carregar produtos')
      }

      const allProcessedProducts = products
        .map(product => {
          const status = getStockStatusWithSettings(product.stock!, product.min_stock!, settings)
          return {
            id: product.id!,
            name: product.name!,
            sku: product.sku!,
            brand: product.brand!,
            category: product.category!,
            current_stock: product.stock!,
            min_stock: product.min_stock!,
            units_needed: product.units_needed!,
            stock_status: status,
            cost: product.cost!,
            retail_price: product.retail_price!,
            images: product.images
          }
        })

      // Obter as listas mais atualizadas após a limpeza automática
      const finalDismissedAlerts = JSON.parse(localStorage.getItem('dismissed_stock_alerts') || '[]')
      const finalDismissedNotifications = JSON.parse(localStorage.getItem('dismissed_stock_notifications') || '[]')

      // Produtos para alertas (tab) - filtrados por dismissedAlerts
      const alertProducts = allProcessedProducts.filter(product => !finalDismissedAlerts.includes(product.id))

      // Produtos para notificações (header) - filtrados por dismissedNotifications
      const notificationProductsFiltered = allProcessedProducts.filter(product => !finalDismissedNotifications.includes(product.id))

      // Separar produtos por categoria de alerta (para tabs)
      const lowStock = alertProducts.filter(p => p.stock_status === 'low_stock')
      const criticalStock = alertProducts.filter(p => p.stock_status === 'critical_stock')
      const outOfStock = alertProducts.filter(p => p.stock_status === 'out_of_stock')

      setLowStockProducts(lowStock)
      setCriticalStockProducts(criticalStock)
      setOutOfStockProducts(outOfStock)

      // Separar produtos por categoria de notificação (para header)
      const notificationLowStock = notificationProductsFiltered.filter(p => p.stock_status === 'low_stock')
      const notificationCriticalStock = notificationProductsFiltered.filter(p => p.stock_status === 'critical_stock')
      const notificationOutOfStock = notificationProductsFiltered.filter(p => p.stock_status === 'out_of_stock')

      setNotificationProducts({
        lowStock: notificationLowStock,
        critical: notificationCriticalStock,
        outOfStock: notificationOutOfStock
      })

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar alertas de estoque'
      setError(message)
      console.error('Erro ao carregar alertas de estoque:', err)
    } finally {
      setLoading(false)
    }
  }, [settings, supabase])

  const dismissAlert = useCallback((productId: string) => {
    const newDismissed = [...dismissedAlerts, productId]
    setDismissedAlerts(newDismissed)
    localStorage.setItem('dismissed_stock_alerts', JSON.stringify(newDismissed))

    // Remover o produto das listas de alertas
    setLowStockProducts(prev => prev.filter(p => p.id !== productId))
    setCriticalStockProducts(prev => prev.filter(p => p.id !== productId))
    setOutOfStockProducts(prev => prev.filter(p => p.id !== productId))
  }, [dismissedAlerts])

  const dismissNotification = useCallback((productId: string) => {
    const newDismissed = [...dismissedNotifications, productId]
    setDismissedNotifications(newDismissed)
    localStorage.setItem('dismissed_stock_notifications', JSON.stringify(newDismissed))

    // Remover o produto das listas de notificações
    setNotificationProducts(prev => ({
      lowStock: prev.lowStock.filter(p => p.id !== productId),
      critical: prev.critical.filter(p => p.id !== productId),
      outOfStock: prev.outOfStock.filter(p => p.id !== productId)
    }))
  }, [dismissedNotifications])

  const refreshData = useCallback(async () => {
    await loadStockAlerts()
  }, [loadStockAlerts])

  const clearAllDismissed = useCallback(() => {
    setDismissedAlerts([])
    setDismissedNotifications([])
    localStorage.removeItem('dismissed_stock_alerts')
    localStorage.removeItem('dismissed_stock_notifications')
    // Recarregar dados para mostrar todos os alertas novamente
    loadStockAlerts()
  }, [loadStockAlerts])

  const totalAlert = lowStockProducts.length + criticalStockProducts.length + outOfStockProducts.length

  useEffect(() => {
    if (isLoaded) {
      loadStockAlerts()
    }
  }, [loadStockAlerts, isLoaded])

  return {
    lowStockProducts,
    criticalStockProducts,
    outOfStockProducts,
    loading,
    error,
    totalAlert,
    refreshData,
    dismissAlert,
    dismissedAlerts,
    notificationProducts,
    dismissNotification,
    dismissedNotifications,
    clearAllDismissed
  }
}
