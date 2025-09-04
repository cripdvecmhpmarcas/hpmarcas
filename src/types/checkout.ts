import { Tables, TablesInsert, TablesUpdate, Json } from './database'

// Base types from database
export type Order = Tables<'sales'>
export type OrderInsert = TablesInsert<'sales'>
export type OrderUpdate = TablesUpdate<'sales'>
export type CustomerAddress = Tables<'customer_addresses'>
export type Coupon = Tables<'coupons'>

// E-commerce specific order types
export interface EcommerceOrderItem {
  id: string
  product?: {
    name: string
  }
  quantity: number
  unit_price: number
  total_price: number
}

export interface EcommerceOrder {
  id: string
  created_at: string
  updated_at: string
  customer_id: string
  customer_name: string
  customer_type: string
  status: string
  order_source: string | null
  total_amount: number
  discount_amount: number | null
  subtotal_amount: number
  user_name: string | null
  shipping_address_id: string | null
  shipping_method: string | null
  shipping_cost: number
  estimated_delivery: string | null
  tracking_number: string | null
  payment_external_id: string | null
  payment_status: string | null
  payment_method_detail: Json | null
  coupon_discount: number
  // Campos da view ecommerce_orders
  street?: string | null
  number?: string | null
  complement?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  shipping_name?: string | null
  // Campos adicionais
  address?: CustomerAddress
  items?: EcommerceOrderItem[]
  // Aliases para compatibilidade
  order_status?: string
  payment_method?: string
}

export type PaymentStatus = 'pending' | 'processing' | 'approved' | 'rejected' | 'cancelled' | 'refunded' | 'paid'
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
export type ShippingMethod = 'standard' | 'express' | 'pickup' | string

// Shipping calculation types
export interface ShippingCalculationRequest {
  origin_zip_code: string
  destination_zip_code: string
  items: Array<{
    weight: number
    length: number
    width: number
    height: number
    value: number
  }>
}

export interface ShippingOption {
  method: ShippingMethod
  name: string
  price: number
  delivery_time_days: number
  delivery_time_description: string
  carrier?: string
}

export interface ShippingCalculationResponse {
  success: boolean
  options: ShippingOption[]
  error?: string
}

// Checkout step types
export type CheckoutStep = 'address' | 'shipping' | 'payer-data' | 'payment' | 'review' | 'confirmation'

export interface CheckoutData {
  step: CheckoutStep
  customer_id: string
  customer_name: string
  email: string

  // Address data
  shipping_address?: CustomerAddress
  billing_address?: CustomerAddress
  use_same_address?: boolean

  // Shipping data
  shipping_method?: ShippingMethod
  shipping_option?: ShippingOption
  shipping_cost: number

  // Payment data
  payment_method: 'pix'
  payment_external_id?: string

  // Coupon data
  coupon_code?: string
  coupon_discount?: number

  // Order summary
  subtotal: number
  total: number
  items_count: number
}

// Checkout validation
export interface CheckoutValidation {
  valid: boolean
  errors: Record<string, string[]>
  warnings: Record<string, string[]>
}

// Order creation request
export interface CreateOrderRequest {
  customer_id: string
  shipping_address_id: string
  shipping_method?: string
  shipping_cost: number
  coupon_code?: string
  items: Array<{
    product_id: string
    quantity: number
    unit_price: number
    volume?: {
      size: string
      unit: string
      barcode?: string
      price_adjustment?: number
    }
  }>
}

// Order creation response
export interface CreateOrderResponse {
  success: boolean
  order?: EcommerceOrder
  payment_preference_id?: string // Mercado Pago preference ID
  error?: string
  validation_errors?: Record<string, string[]>
}

// Order summary for display
export interface OrderSummary {
  subtotal: number
  shipping_cost: number
  coupon_discount: number
  total: number
  items_count: number
  estimated_delivery?: string
}

// Address form data
export interface AddressFormData {
  name: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zip_code: string
  label: string
  is_default: boolean
}

// Coupon validation
export interface CouponValidationRequest {
  code: string
  customer_id: string
  order_total: number
}

export interface CouponValidationResponse {
  valid: boolean
  coupon?: Coupon
  discount_amount?: number
  error?: string
}

// Mercado Pago types
export interface MercadoPagoPreference {
  id: string
  items: Array<{
    id: string
    title: string
    description: string
    quantity: number
    currency_id: string
    unit_price: number
  }>
  payer: {
    name: string
    email: string
  }
  payment_methods: {
    excluded_payment_methods: Array<{ id: string }>
    excluded_payment_types: Array<{ id: string }>
    installments: number
  }
  back_urls: {
    success: string
    failure: string
    pending: string
  }
  notification_url: string
  external_reference: string
}

export interface MercadoPagoWebhookData {
  action: string
  api_version: string
  data: {
    id: string
  }
  date_created: string
  id: number
  live_mode: boolean
  type: string
  user_id: string
}

// Error types
export class CheckoutError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'CheckoutError'
  }
}

export class PaymentError extends Error {
  constructor(
    message: string,
    public code: string,
    public payment_id?: string
  ) {
    super(message)
    this.name = 'PaymentError'
  }
}

export class StockError extends Error {
  constructor(
    message: string,
    public product_id: string,
    public requested_quantity: number,
    public available_quantity: number
  ) {
    super(message)
    this.name = 'StockError'
  }
}

// Cart item types for display - unified with existing cart system
export interface CartDisplayItem {
  productId: string
  quantity: number
  // Dados do produto buscados em tempo real:
  name: string
  sku: string
  images: string[] | null
  brand: string
  description: string
  stock: number
  // Dados de envio (peso e dimensões):
  weight?: number | null
  length?: number | null
  width?: number | null
  height?: number | null
  // Preços calculados baseado no tipo de cliente:
  currentPrice: number
  originalPrice: number
  isWholesale: boolean
  hasDiscount: boolean
  discountPercent: number
  // Status do produto:
  stockStatus: "in_stock" | "low_stock" | "out_of_stock"
  isAvailable: boolean
  // Volume do produto (se aplicável):
  volume?: {
    size: string
    unit: string
    barcode?: string
    price_adjustment?: number
    displayName?: string // Ex: "100ml", "50ml"
  }
  // Campos adicionais para compatibilidade:
  id: string // alias para productId
  price: number // alias para currentPrice
  total: number // calculated field
  stock_quantity: number // alias para stock
  is_wholesale?: boolean // alias para isWholesale
}
