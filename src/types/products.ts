import { Tables, TablesInsert, TablesUpdate } from './database'

export type Product = Tables<'products'>
export type ProductInsert = TablesInsert<'products'>
export type ProductUpdate = TablesUpdate<'products'>

export interface ProductVolume {
  size: string
  unit: string
  barcode?: string
  price_adjustment?: number
}

export interface ProductWithVolumes extends Omit<Product, 'volumes'> {
  volumes: ProductVolume[] | null
}

export interface ProductShippingData {
  weight: number        // Weight in grams
  length: number        // Length in cm
  width: number         // Width in cm
  height: number        // Height in cm
}

export interface ProductFormData {
  name: string
  description: string
  brand: string
  category: string
  subcategory_id?: string
  sku: string
  barcode: string
  cost: number
  wholesale_price: number
  retail_price: number
  stock: number
  min_stock: number
  status: 'active' | 'inactive'
  images: string[]
  volumes: ProductVolume[]
  shipping_data?: ProductShippingData
}

export interface ProductFilters {
  search?: string
  category?: string
  subcategory_id?: string
  brand?: string
  status?: 'active' | 'inactive' | 'all'
  stock_status?: 'all' | 'low_stock' | 'out_of_stock' | 'in_stock'
  price_range?: {
    min: number
    max: number
  }
}

export interface ProductTableColumn {
  key: keyof Product | 'actions'
  label: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

export interface ProductStats {
  total_products: number
  active_products: number
  inactive_products: number
  low_stock_products: number
  out_of_stock_products: number
  total_stock_value: number
  categories: Array<{
    name: string
    count: number
  }>
  brands: Array<{
    name: string
    count: number
  }>
}

export interface ProductImportData {
  name: string
  description: string
  brand: string
  category: string
  sku: string
  barcode: string
  cost: number
  wholesale_price: number
  retail_price: number
  stock: number
  min_stock: number
  status: string
  volumes?: string
  shipping_data?: ProductShippingData
}

export interface ProductExportData extends Product {
  stock_status: string
  margin_percentage: number
  stock_value: number
}

// Default shipping dimensions for perfume products
export const DEFAULT_SHIPPING_DIMENSIONS = {
  weight: 500,    // 500g default
  length: 20,     // 20cm default
  width: 15,      // 15cm default
  height: 5       // 5cm default
} as const

// Category and subcategory types
export interface Category {
  id: string
  name: string
  slug: string
  parent_id: string | null
  description: string | null
  image_url: string | null
  sort_order: number | null
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
}

export interface CategoryHierarchy extends Category {
  parent_name?: string
  parent_slug?: string
  full_path: string
  level: number
  subcategories?: CategoryHierarchy[]
}

export interface CategoryOption {
  value: string
  label: string
  parent?: string
}

// Legacy constant for backward compatibility
export const PRODUCT_CATEGORIES = [
  'Perfumes Masculinos',
  'Perfumes Femininos',
  'Perfumes Infantis',
  'Perfumes Unissex',
  'Cremes e Loções',
  'Sabonetes',
  'Desodorantes',
  'Kits e Presentes',
  'Acessórios',
  'Outros'
] as const

export const PRODUCT_STATUSES = {
  active: 'Ativo',
  inactive: 'Inativo'
} as const

export const STOCK_STATUSES = {
  in_stock: 'Em Estoque',
  low_stock: 'Estoque Baixo',
  out_of_stock: 'Sem Estoque'
} as const

export const VOLUME_UNITS = [
  'ml',
  'L',
  'g',
  'kg',
  'un'
] as const

export type ProductCategory = typeof PRODUCT_CATEGORIES[number]
export type ProductStatus = keyof typeof PRODUCT_STATUSES
export type StockStatus = keyof typeof STOCK_STATUSES
export type VolumeUnit = typeof VOLUME_UNITS[number]
