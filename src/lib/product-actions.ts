'use server'

import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas para server actions')
}

// Cliente com service role para server actions
const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function updateProductStatus(productId: string, status: 'active' | 'inactive') {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .update({ status })
      .eq('id', productId)
      .select()
      .single()

    if (error) {
      console.error('Error updating product status:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Server action error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

export async function bulkUpdateProductStatus(productIds: string[], status: 'active' | 'inactive') {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .update({ status })
      .in('id', productIds)
      .select()

    if (error) {
      console.error('Error bulk updating products:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data, count: data?.length || 0 }
  } catch (error) {
    console.error('Server action error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

export async function searchProducts(filters: {
  search?: string
  category?: string
  subcategory_id?: string
  brand?: string
  status?: 'active' | 'inactive' | 'all'
  stock_status?: 'all' | 'low_stock' | 'out_of_stock' | 'in_stock'
  price_range?: { min: number; max: number }
  page?: number
  pageSize?: number
  sortColumn?: string
  sortDirection?: 'asc' | 'desc'
}) {
  try {
    const {
      search = '',
      category = '',
      subcategory_id = '',
      brand = '',
      status = 'all',
      stock_status = 'all',
      price_range,
      page = 1,
      pageSize = 50,
      sortColumn = 'name',
      sortDirection = 'asc'
    } = filters

    // Construir query base
    let query = supabaseAdmin
      .from('products')
      .select('*', { count: 'exact' })

    // Aplicar filtros
    if (search && search.trim() !== '') {
      query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%`)
    }

    if (category && category !== '') {
      query = query.eq('category', category)
    }

    if (subcategory_id && subcategory_id !== '') {
      query = query.eq('subcategory_id', subcategory_id)
    }

    if (brand && brand !== '') {
      query = query.eq('brand', brand)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (stock_status && stock_status !== 'all') {
      switch (stock_status) {
        case 'out_of_stock':
          query = query.eq('stock', 0)
          break
        case 'low_stock':
          query = query.gt('stock', 0)
          break
        case 'in_stock':
          query = query.gt('stock', 0)
          break
      }
    }

    if (price_range) {
      if (price_range.min > 0) {
        query = query.gte('retail_price', price_range.min)
      }
      if (price_range.max > 0) {
        query = query.lte('retail_price', price_range.max)
      }
    }

    // Aplicar ordenação
    if (sortColumn) {
      query = query.order(sortColumn, { ascending: sortDirection === 'asc' })
    }

    // Aplicar paginação
    const offset = (page - 1) * pageSize
    query = query.range(offset, offset + pageSize - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error searching products:', error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data: data || [],
      count: count || 0,
      stockFilters: { stock_status } // Para processamento no cliente
    }
  } catch (error) {
    console.error('Server action error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

/**
 * Reset all product weights to zero
 * This is a server action that can be called from the admin dashboard
 */
export async function resetAllProductWeights() {
  try {
    const { error } = await supabaseAdmin
      .from('products')
      .update({ weight: 0 })
      .neq('id', '00000000-0000-0000-0000-000000000000') // Update all products

    if (error) {
      console.error('Error resetting product weights:', error)
      return {
        success: false,
        error: `Erro ao resetar pesos: ${error.message}`
      }
    }

    return {
      success: true,
      message: 'Pesos de todos os produtos foram zerados com sucesso!'
    }
  } catch (err) {
    console.error('Error in resetAllProductWeights:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro interno do servidor'
    }
  }
}

/**
 * Update shipping dimensions for a single product using ShippingData structure
 */
export async function updateProductShippingDimensions(
  productId: string,
  shippingData: {
    weight?: number | null
    length?: number | null
    width?: number | null
    height?: number | null
  }
) {
  try {
    const { error } = await supabaseAdmin
      .from('products')
      .update({
        weight: shippingData.weight,
        length: shippingData.length,
        width: shippingData.width,
        height: shippingData.height
      })
      .eq('id', productId)

    if (error) {
      console.error('Error updating product dimensions:', error)
      return {
        success: false,
        error: `Erro ao atualizar dimensões: ${error.message}`
      }
    }

    return {
      success: true,
      message: 'Dimensões do produto atualizadas com sucesso!'
    }
  } catch (err) {
    console.error('Error in updateProductShippingDimensions:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro interno do servidor'
    }
  }
}

/**
 * Set default dimensions for products that don't have them
 */
export async function setDefaultDimensionsForProducts() {
  try {
    const { error } = await supabaseAdmin
      .from('products')
      .update({
        weight: 500,    // 500g default
        length: 20,     // 20cm default
        width: 15,      // 15cm default
        height: 5       // 5cm default
      })
      .or('weight.is.null,length.is.null,width.is.null,height.is.null')

    if (error) {
      console.error('Error setting default dimensions:', error)
      return {
        success: false,
        error: `Erro ao definir dimensões padrão: ${error.message}`
      }
    }

    return {
      success: true,
      message: 'Dimensões padrão definidas para produtos sem dimensões!'
    }
  } catch (err) {
    console.error('Error in setDefaultDimensionsForProducts:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro interno do servidor'
    }
  }
}
