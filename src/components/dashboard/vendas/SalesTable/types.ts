import { SaleWithDetails } from '@/types/sales'

// Table column configuration
export interface TableColumn {
  id: keyof SaleWithDetails | 'actions'
  label: string
  sortable: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  className?: string
  hideOnMobile?: boolean
  hideOnTablet?: boolean
}

// Table view modes
export type TableViewMode = 'desktop' | 'tablet' | 'mobile'

// Responsive column configuration
export interface ResponsiveColumns {
  desktop: TableColumn[]
  tablet: TableColumn[]
  mobile: TableColumn[]
}

// Table statistics for header
export interface TableStats {
  totalSales: number
  totalRevenue: number
  totalProfit: number
  avgTicket: number
  avgMargin: number
}

// Performance optimization options
export interface TablePerformanceOptions {
  enableVirtualization: boolean
  pageSize: number
  enableLazyLoading: boolean
  debounceSearchMs: number
}

// Default column configurations
export const DEFAULT_COLUMNS: TableColumn[] = [
  { id: 'id', label: 'ID', sortable: true, width: '80px', className: 'font-mono text-xs', hideOnMobile: true },
  { id: 'created_at', label: 'Data/Hora', sortable: true, width: '140px', hideOnMobile: true },
  { id: 'customer_name', label: 'Cliente', sortable: true, width: '200px' },
  { id: 'salesperson_name', label: 'Vendedor', sortable: true, width: '140px', hideOnTablet: true },
  { id: 'items_count', label: 'Itens', sortable: true, width: '80px', align: 'center', hideOnMobile: true },
  { id: 'subtotal', label: 'Subtotal', sortable: true, width: '120px', align: 'right', hideOnMobile: true, hideOnTablet: true },
  { id: 'discount_amount', label: 'Desconto', sortable: true, width: '120px', align: 'right', hideOnMobile: true, hideOnTablet: true },
  { id: 'total', label: 'Total', sortable: true, width: '120px', align: 'right' },
  { id: 'total_profit', label: 'Lucro', sortable: true, width: '120px', align: 'right', hideOnMobile: true },
  { id: 'profit_margin', label: 'Margem', sortable: true, width: '90px', align: 'right', hideOnMobile: true, hideOnTablet: true },
  { id: 'payment_method', label: 'Pagamento', sortable: true, width: '130px', hideOnMobile: true, hideOnTablet: true },
  { id: 'status', label: 'Status', sortable: true, width: '100px', align: 'center' },
  { id: 'actions', label: 'Ações', sortable: false, width: '120px', align: 'center' }
]

// Responsive column sets
export const RESPONSIVE_COLUMNS: ResponsiveColumns = {
  desktop: DEFAULT_COLUMNS,
  tablet: DEFAULT_COLUMNS.filter(col => !col.hideOnTablet),
  mobile: DEFAULT_COLUMNS.filter(col => !col.hideOnMobile)
}

// Default performance settings
export const DEFAULT_PERFORMANCE_OPTIONS: TablePerformanceOptions = {
  enableVirtualization: true,
  pageSize: 25,
  enableLazyLoading: true,
  debounceSearchMs: 500
}
