import { Tables, TablesInsert, TablesUpdate } from './database'

// Tipos básicos do database
export type Customer = Tables<'customers'>
export type CustomerInsert = TablesInsert<'customers'>
export type CustomerUpdate = TablesUpdate<'customers'>

export type CustomerAddress = Tables<'customer_addresses'>
export type CustomerAddressInsert = TablesInsert<'customer_addresses'>
export type CustomerAddressUpdate = TablesUpdate<'customer_addresses'>

export type CustomerPreferences = Tables<'customer_preferences'>
export type CustomerPreferencesInsert = TablesInsert<'customer_preferences'>
export type CustomerPreferencesUpdate = TablesUpdate<'customer_preferences'>

// Tipos estendidos para visualização
export interface CustomerWithDetails extends Customer {
  addresses?: CustomerAddress[]
  preferences?: CustomerPreferences
  purchase_stats?: CustomerPurchaseStats
  review_stats?: CustomerReviewStats
}

export interface CustomerPurchaseStats {
  total_orders: number
  total_spent: number
  avg_order_value: number
  last_purchase_date: string | null
  most_purchased_category: string | null
  favorite_products: string[]
}

export interface CustomerReviewStats {
  total_reviews: number
  avg_rating: number
  helpful_reviews: number
  last_review_date: string | null
}

// Tipos para compras do cliente
export interface CustomerPurchase {
  id: string
  sale_date: string
  total: number
  status: string
  payment_method: string
  items_count: number
  items: CustomerPurchaseItem[]
}

export interface CustomerPurchaseItem {
  id: string
  product_id: string
  product_name: string
  product_sku: string
  quantity: number
  unit_price: number
  total_price: number
}

// Tipos para reviews do cliente
export interface CustomerReview {
  id: string
  product_id: string
  product_name: string
  product_brand: string
  rating: number
  title: string | null
  comment: string | null
  pros: string | null
  cons: string | null
  recommend: boolean | null
  created_at: string
  status: string
  verified_purchase: boolean | null
}

// Filtros e busca
export interface CustomerFilters {
  search?: string
  status?: 'active' | 'inactive' | 'all'
  type?: 'individual' | 'business' | 'all'
  city?: string
  state?: string
  has_purchases?: boolean
  registration_date_from?: string
  registration_date_to?: string
  last_purchase_from?: string
  last_purchase_to?: string
  min_spent?: number
  max_spent?: number
  page?: number
  limit?: number
  sort_by?: 'name' | 'created_at' | 'last_purchase' | 'total_spent'
  sort_order?: 'asc' | 'desc'
}

export interface CustomerListResponse {
  customers: CustomerWithDetails[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

// Constantes
export const CUSTOMER_STATUSES = {
  active: 'Ativo',
  inactive: 'Inativo',
  blocked: 'Bloqueado'
} as const

export const CUSTOMER_TYPES = {
  individual: 'Pessoa Física',
  business: 'Pessoa Jurídica'
} as const

export type CustomerStatus = keyof typeof CUSTOMER_STATUSES
export type CustomerType = keyof typeof CUSTOMER_TYPES

// Utilidades
export const getCustomerStatusColor = (status: string): string => {
  const colors = {
    active: 'text-green-600 bg-green-100',
    inactive: 'text-gray-600 bg-gray-100',
    blocked: 'text-red-600 bg-red-100'
  }
  return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100'
}

export const getCustomerTypeLabel = (type: string): string => {
  return CUSTOMER_TYPES[type as keyof typeof CUSTOMER_TYPES] || type
}

export const getCustomerStatusLabel = (status: string): string => {
  return CUSTOMER_STATUSES[status as keyof typeof CUSTOMER_STATUSES] || status
}

export const formatCustomerDocument = (document: string | null, type: string): string => {
  if (!document) return 'Não informado'
  
  if (type === 'individual' && document.length === 11) {
    return document.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  
  if (type === 'business' && document.length === 14) {
    return document.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  
  return document
}

export const formatCustomerPhone = (phone: string | null): string => {
  if (!phone) return 'Não informado'
  
  if (phone.length === 11) {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  
  if (phone.length === 10) {
    return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  
  return phone
}