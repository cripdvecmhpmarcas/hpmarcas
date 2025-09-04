import { useEffect, useState } from 'react'
import { useSupabaseAdmin } from '@/hooks/useSupabaseAdmin'
import type { StockAlertData } from '@/types/dashboard'

export function useLowStockAlert() {
  const [stockAlerts, setStockAlerts] = useState<StockAlertData[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useSupabaseAdmin()

  useEffect(() => {
    const fetchLowStockProducts = async () => {
      try {
        const { data: lowStockData } = await supabase
          .from('low_stock_products')
          .select('*')
          .eq('is_low_stock', true)
          .order('units_needed', { ascending: false })
          .limit(10)

        if (lowStockData) {
          const alerts: StockAlertData[] = lowStockData.map(product => ({
            id: product.id || '',
            name: product.name || '',
            brand: product.brand || '',
            sku: product.sku || '',
            currentStock: product.stock || 0,
            minStock: product.min_stock || 0,
            unitsNeeded: product.units_needed || 0,
            category: product.category || ''
          }))

          setStockAlerts(alerts)
        }
      } catch (error) {
        console.error('Error fetching low stock products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLowStockProducts()
  }, [supabase])

  const getStockLevel = (currentStock: number, minStock: number) => {
    const ratio = currentStock / minStock
    if (ratio <= 0.1) return 'critical'
    if (ratio <= 0.3) return 'low'
    if (ratio <= 0.5) return 'medium'
    return 'good'
  }

  const getStockBadgeVariant = (level: string) => {
    switch (level) {
      case 'critical':
        return 'destructive'
      case 'low':
        return 'destructive'
      case 'medium':
        return 'secondary'
      default:
        return 'default'
    }
  }

  const getStockBadgeText = (level: string) => {
    switch (level) {
      case 'critical':
        return 'Crítico'
      case 'low':
        return 'Baixo'
      case 'medium':
        return 'Médio'
      default:
        return 'Bom'
    }
  }

  return {
    stockAlerts,
    loading,
    getStockLevel,
    getStockBadgeVariant,
    getStockBadgeText
  }
}
