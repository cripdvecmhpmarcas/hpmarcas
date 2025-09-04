import type { Tables } from './database'

// Re-exportar tipos básicos do banco
export type Sale = Tables<'sales'>
export type SaleItem = Tables<'sale_items'>
export type Customer = Tables<'customers'>
export type Product = Tables<'products'>

// Interfaces para vendas com dados relacionados
export interface SaleItemWithProduct extends SaleItem {
  product?: Product
  profit_per_unit?: number
  total_profit?: number
}

export interface SaleWithDetails extends Sale {
  sale_items: SaleItemWithProduct[]
  customer?: Customer
  total_profit?: number
  profit_margin?: number
  items_count?: number
}

// Filtros para busca de vendas
export interface SaleFilters {
  search?: string
  customer_id?: string
  customer_type?: 'retail' | 'wholesale' | 'all'
  payment_method?: string | 'all'
  status?: string | 'all'
  order_source?: 'pos' | 'ecommerce' | 'all'
  salesperson_name?: string
  date_from?: string
  date_to?: string
  min_total?: number
  max_total?: number
  sort_by?: 'created_at' | 'total' | 'profit' | 'customer_name'
  sort_order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// Análise de lucro
export interface SaleProfitAnalysis {
  sale_id: string
  sale_date: string
  customer_name: string
  total_sale: number
  total_cost: number
  total_profit: number
  profit_margin: number
  items_count: number
  payment_method: string
  salesperson_name?: string
}

// Resumo de lucro por período
export interface ProfitSummary {
  period: string
  total_sales: number
  total_revenue: number
  total_cost: number
  total_profit: number
  profit_margin: number
  sales_count: number
  avg_ticket: number
}

// Top vendedores
export interface TopSeller {
  salesperson_name: string
  position: number
  total_sales: number
  total_revenue: number
  total_profit: number
  sales_count: number
  avg_ticket: number
  profit_margin: number
  best_sale_date: string
  best_sale_value: number
  growth_vs_previous: {
    revenue: number
    profit: number
    sales: number
    margin: number
  }
  performance_breakdown: {
    by_customer_type: {
      retail: { sales: number; revenue: number; profit: number }
      wholesale: { sales: number; revenue: number; profit: number }
    }
    by_payment_method: Array<{
      method: string
      count: number
      revenue: number
      profit: number
    }>
    top_products: Array<{
      name: string
      category: string
      sales: number
      revenue: number
      profit: number
    }>
    time_analysis: {
      best_day_of_week: string
      best_hour: string
      peak_performance_day: string
    }
  }
  revenue_share: number
  profit_share: number
}

// Dados para cupom fiscal
export interface SaleReceipt {
  sale: SaleWithDetails
  company: {
    name: string
    cnpj: string
    address: string
    phone: string
    email: string
  }
  qr_code?: string
  receipt_number: string
  tax_info?: {
    icms_rate: number
    pis_rate: number
    cofins_rate: number
  }
}

// Estatísticas de vendas
export interface SalesStats {
  total_sales: number
  total_revenue: number
  total_profit: number
  profit_margin: number
  sales_today: number
  revenue_today: number
  profit_today: number
  avg_ticket: number
  top_payment_method: string
  sales_by_period: {
    period: string
    count: number
    revenue: number
    profit: number
  }[]
}

// Return types para hooks
export interface UseSalesReturn {
  sales: SaleWithDetails[]
  loading: boolean
  error: string | null
  stats: SalesStats | null
  filters: SaleFilters
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  setFilters: (filters: Partial<SaleFilters>) => void
  setPage: (page: number) => void
  refreshData: () => Promise<void>
  exportSales: (format: 'csv' | 'excel') => Promise<void>
  formatCurrency: (value: number) => string
  formatDate: (dateString: string) => string
}

// Interfaces para análise de lucro avançada
export interface ProfitComparison {
  current: ProfitSummary
  previous: ProfitSummary
  growth: {
    revenue: number
    profit: number
    margin: number
    sales: number
    avg_ticket: number
  }
}

export interface ProfitBreakdown {
  by_category: Array<{ category: string; profit: number; margin: number; sales: number }>
  by_customer_type: Array<{ type: string; profit: number; margin: number; sales: number }>
  by_salesperson: Array<{ name: string; profit: number; margin: number; sales: number }>
  by_payment_method: Array<{ method: string; profit: number; margin: number; sales: number }>
  by_product: Array<{ name: string; profit: number; margin: number; sales: number }>
}

export interface TopPerformers {
  topCategory: { category: string; profit: number; margin: number; sales: number } | null
  topSalesperson: { name: string; profit: number; margin: number; sales: number } | null
  topProduct: { name: string; profit: number; margin: number; sales: number } | null
  topCustomerType: { type: string; profit: number; margin: number; sales: number } | null
  topPaymentMethod: { method: string; profit: number; margin: number; sales: number } | null
}

export interface TrendAnalysis {
  revenue: 'up' | 'down' | 'stable'
  profit: 'up' | 'down' | 'stable'
  margin: 'up' | 'down' | 'stable'
  sales: 'up' | 'down' | 'stable'
  avg_ticket: 'up' | 'down' | 'stable'
}

export interface UseSaleProfitReturn {
  profitAnalysis: SaleProfitAnalysis[]
  profitSummary: ProfitSummary[]
  loading: boolean
  error: string | null
  selectedPeriod: string
  setPeriod: (period: string) => void
  calculateProfitByPeriod: (period: number) => Promise<ProfitSummary>
  calculateSaleProfit: (saleId: string) => Promise<SaleProfitAnalysis>
  refreshData: () => Promise<void>
  profitComparison: ProfitComparison | null
  profitBreakdown: ProfitBreakdown | null
  calculateMultiplePeriods: () => Promise<void>
  formatCurrency: (value: number) => string
  formatPercentage: (value: number) => string
  getTopPerformers: (breakdown: ProfitBreakdown) => TopPerformers
  getTrendAnalysis: (comparison: ProfitComparison) => TrendAnalysis
}

export interface UseTopSellersReturn {
  topSellers: TopSeller[]
  loading: boolean
  error: string | null
  period: string
  sortBy: 'revenue' | 'profit' | 'sales_count' | 'avg_ticket' | 'profit_margin'
  setPeriod: (period: string) => void
  setSortBy: (sort: 'revenue' | 'profit' | 'sales_count' | 'avg_ticket' | 'profit_margin') => void
  refreshData: () => Promise<void>
  totalPeriodStats: {
    total_revenue: number
    total_profit: number
    total_sales: number
    active_sellers: number
  }
}

// Interface para histórico de impressões
export interface PrintHistoryEntry {
  id: string
  sale_id: string
  receipt_number: string
  printed_at: string
  print_type: 'original' | 'reprint'
  print_method: 'screen' | 'printer' | 'pdf'
  user_id: string
  user_name: string
}

export interface UseSaleReceiptReturn {
  receiptData: SaleReceipt | null
  loading: boolean
  error: string | null
  previewMode: boolean
  printHistory: PrintHistoryEntry[]
  generateReceipt: (saleId: string) => Promise<void>
  printReceipt: () => Promise<void>
  downloadPDF: () => Promise<void>
  togglePreview: () => void
  getPrintHistory: () => Promise<PrintHistoryEntry[]>
  markAsReprinted: () => Promise<void>
}

// Constantes
export const SALE_STATUSES = {
  'pending': 'Pendente',
  'confirmed': 'Confirmado',
  'processing': 'Processando',
  'shipped': 'Enviado',
  'delivered': 'Entregue',
  'completed': 'Concluída',
  'cancelled': 'Cancelado',
  'refunded': 'Estornado'
} as const

export const PAYMENT_METHODS = {
  'cash': 'Dinheiro',
  'card': 'Cartão',
  'pix': 'PIX',
  'bank_transfer': 'Transferência',
  'other': 'Outro'
} as const

export const CUSTOMER_TYPES = {
  'retail': 'Varejo',
  'wholesale': 'Atacado'
} as const

export const ORDER_SOURCES = {
  'pos': 'PDV',
  'ecommerce': 'E-commerce'
} as const

export const PERIOD_OPTIONS = [
  { value: '1', label: '1 dia' },
  { value: '7', label: '7 dias' },
  { value: '15', label: '15 dias' },
  { value: '30', label: '30 dias' },
  { value: '60', label: '60 dias' },
  { value: '90', label: '90 dias' },
  { value: 'custom', label: 'Período personalizado' }
] as const
