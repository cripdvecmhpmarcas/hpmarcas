import { Tables, TablesInsert, TablesUpdate } from './database'

export type StockMovement = Tables<'stock_movements'>
export type StockMovementInsert = TablesInsert<'stock_movements'>
export type StockMovementUpdate = TablesUpdate<'stock_movements'>

export interface StockStats {
  total_products: number
  products_in_stock: number
  products_low_stock: number
  products_out_of_stock: number
  total_stock_value: number
  total_stock_quantity: number
  movements_today: number
  low_stock_threshold: number
  total_revenue_potential: number
  total_profit_potential: number
}

export interface StockOverviewData {
  stats: StockStats
  recent_movements: StockMovementWithProduct[]
  low_stock_products: LowStockProduct[]
  categories_stock: CategoryStockData[]
  profit_forecast: ProfitForecast[]
}

export interface ProfitForecast {
  product_id: string
  product_name: string
  product_sku: string
  current_stock: number
  cost_per_unit: number
  retail_price: number
  wholesale_price: number
  revenue_potential_retail: number
  revenue_potential_wholesale: number
  profit_potential_retail: number
  profit_potential_wholesale: number
  margin_retail: number
  margin_wholesale: number
}

export interface StockMovementWithProduct extends StockMovement {
  product: {
    id: string
    name: string
    sku: string
    brand: string
    category: string
    images: string[] | null
  }
}

export interface LowStockProduct {
  id: string
  name: string
  sku: string
  brand: string
  category: string
  current_stock: number
  min_stock: number
  units_needed: number
  stock_status: StockStatus
  cost: number
  retail_price: number
  images: string[] | null
}

export interface CategoryStockData {
  category: string
  total_products: number
  products_in_stock: number
  products_low_stock: number
  products_out_of_stock: number
  stock_value: number
}

export interface StockMovementFilters {
  search?: string
  product_id?: string
  type?: 'entry' | 'exit' | 'adjustment' | 'all'
  reason?: string | 'all'
  date_from?: string
  date_to?: string
  user_id?: string
}

export interface StockMovementFormData {
  product_id: string
  type: 'entry' | 'exit' | 'adjustment'
  quantity: number
  reason: string
  notes?: string
  cost?: number
  supplier?: string
}

export interface StockAdjustmentData {
  product_id: string
  current_quantity: number
  new_quantity: number
  reason: string
  notes?: string
}

export interface StockMovementTableColumn {
  key: keyof StockMovementWithProduct | 'actions'
  label: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

export const STOCK_MOVEMENT_TYPES = {
  entry: 'Entrada',
  exit: 'Saída',
  adjustment: 'Ajuste'
} as const

export const STOCK_MOVEMENT_REASONS = {
  purchase: 'Compra',
  sale: 'Venda',
  'Venda PDV': 'Venda PDV',
  return: 'Devolução',
  damage: 'Avaria',
  loss: 'Perda',
  theft: 'Furto',
  transfer: 'Transferência',
  adjustment: 'Ajuste de Inventário',
  promotion: 'Promoção',
  expired: 'Vencimento',
  other: 'Outros'
} as const

export const STOCK_STATUSES = {
  in_stock: 'Em Estoque',
  low_stock: 'Estoque Baixo',
  out_of_stock: 'Sem Estoque',
  critical_stock: 'Estoque Crítico'
} as const

export type StockMovementType = keyof typeof STOCK_MOVEMENT_TYPES
export type StockMovementReason = keyof typeof STOCK_MOVEMENT_REASONS
export type StockStatus = keyof typeof STOCK_STATUSES

export const getStockStatus = (current: number, min: number): StockStatus => {
  if (current === 0) return 'out_of_stock'
  if (current <= min * 0.5) return 'critical_stock'
  if (current <= min) return 'low_stock'
  return 'in_stock'
}

export const getStockStatusWithSettings = (
  current: number, 
  min: number, 
  settings?: { lowStockLimit?: number; criticalStockLimit?: number }
): StockStatus => {
  const lowStockLimit = settings?.lowStockLimit ?? 10
  const criticalStockLimit = settings?.criticalStockLimit ?? 3
  
  if (current === 0) return 'out_of_stock'
  if (current <= criticalStockLimit) return 'critical_stock'
  
  // Um produto tem estoque baixo se:
  // 1. Está abaixo do limite configurado para estoque baixo OU
  // 2. Está abaixo do estoque mínimo específico do produto
  if (current <= lowStockLimit || current <= min) return 'low_stock'
  
  return 'in_stock'
}

export const getStockStatusColor = (status: StockStatus): string => {
  const colors = {
    in_stock: 'text-green-600 bg-green-100',
    low_stock: 'text-yellow-600 bg-yellow-100',
    out_of_stock: 'text-red-600 bg-red-100',
    critical_stock: 'text-red-700 bg-red-200'
  }
  return colors[status] || 'text-gray-600 bg-gray-100'
}

export const getMovementTypeColor = (type: StockMovementType): string => {
  const colors = {
    entry: 'text-green-600 bg-green-100',
    exit: 'text-red-600 bg-red-100',
    adjustment: 'text-blue-600 bg-blue-100'
  }
  return colors[type] || 'text-gray-600 bg-gray-100'
}
