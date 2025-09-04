import type { Database } from './database'

// Database table types
export type Sale = Database['public']['Tables']['sales']['Row']
export type Customer = Database['public']['Tables']['customers']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type SaleItem = Database['public']['Tables']['sale_items']['Row']
export type StockMovement = Database['public']['Tables']['stock_movements']['Row']

// Database view types
export type DailySalesSummary = Database['public']['Views']['daily_sales_summary']['Row']
export type LowStockProduct = Database['public']['Views']['low_stock_products']['Row']
export type TopSellingProduct = Database['public']['Views']['top_selling_products']['Row']

// Dashboard-specific types
export interface DashboardMetrics {
  todayRevenue: number
  yesterdayRevenue: number
  todaySales: number
  yesterdaySales: number
  todayCustomers: number
  yesterdayCustomers: number
  lowStockCount: number
  totalProducts: number
  totalCustomers: number
}

export interface MetricCardData {
  title: string
  value: string
  change: string
  trend: 'up' | 'down' | 'neutral'
  icon: React.ComponentType<{ className?: string }>
  description: string
}

export interface SalesChartData {
  date: string
  revenue: number
  sales: number
  customers: number
}

export interface TopProductData {
  id: string
  name: string
  brand: string
  category: string
  totalSold: number
  revenue: number
  timesSold: number
}

export interface RecentSaleData {
  id: string
  customerName: string
  total: number
  paymentMethod: string
  itemCount: number
  createdAt: string
  status: string
}

export interface PaymentDistributionData {
  method: string
  count: number
  total: number
  percentage: number
}

export interface StockAlertData {
  id: string
  name: string
  brand: string
  sku: string
  currentStock: number
  minStock: number
  unitsNeeded: number
  category: string
}

// Dashboard filter types
export interface DashboardFilters {
  dateRange: {
    from: Date
    to: Date
  }
  customerType?: 'retail' | 'wholesale' | 'all'
  paymentMethod?: string
  category?: string
  brand?: string
}

// Dashboard state types
export interface DashboardState {
  metrics: DashboardMetrics | null
  salesChart: SalesChartData[]
  topProducts: TopProductData[]
  recentSales: RecentSaleData[]
  paymentDistribution: PaymentDistributionData[]
  stockAlerts: StockAlertData[]
  filters: DashboardFilters
  loading: boolean
  error: string | null
}

// Chart configuration types
export interface ChartConfig {
  [key: string]: {
    label: string
    color: string
  }
}

export interface ChartDataPoint {
  [key: string]: string | number
}

// Time period types for filtering
export type TimePeriod = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom'

export interface TimePeriodOption {
  value: TimePeriod
  label: string
  days?: number
}

// Export utilities
export const TIME_PERIODS: TimePeriodOption[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'last7days', label: 'Últimos 7 dias', days: 7 },
  { value: 'last30days', label: 'Últimos 30 dias', days: 30 },
  { value: 'thisMonth', label: 'Este mês' },
  { value: 'lastMonth', label: 'Mês passado' },
  { value: 'thisYear', label: 'Este ano' },
  { value: 'custom', label: 'Personalizado' }
]

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Dinheiro' },
  { value: 'card', label: 'Cartão' },
  { value: 'pix', label: 'PIX' },
  { value: 'transfer', label: 'Transferência' },
  { value: 'check', label: 'Cheque' }
]

export const CUSTOMER_TYPES = [
  { value: 'all', label: 'Todos' },
  { value: 'retail', label: 'Varejo' },
  { value: 'wholesale', label: 'Atacado' }
]
