import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import type { CouponValidationRequest, CouponValidationResponse } from '@/types/checkout'

export async function POST(request: NextRequest) {
  try {
    const body: CouponValidationRequest = await request.json()
    const { code, customer_id, order_total } = body

    if (!code || !customer_id || typeof order_total !== 'number') {
      return NextResponse.json({
        valid: false,
        error: 'Dados obrigatorios ausentes'
      } as CouponValidationResponse)
    }

    const supabase = createServiceRoleClient()

    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('is_active', true)
      .single()

    if (couponError || !coupon) {
      return NextResponse.json({
        valid: false,
        error: 'Cupom nao encontrado ou inativo'
      } as CouponValidationResponse)
    }

    const now = new Date()
    const startDate = new Date(coupon.start_date)
    const endDate = coupon.end_date ? new Date(coupon.end_date) : null

    if (now < startDate) {
      return NextResponse.json({
        valid: false,
        error: 'Cupom ainda nao esta ativo'
      } as CouponValidationResponse)
    }

    if (endDate && now > endDate) {
      return NextResponse.json({
        valid: false,
        error: 'Cupom expirado'
      } as CouponValidationResponse)
    }

    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return NextResponse.json({
        valid: false,
        error: 'Cupom atingiu o limite de uso'
      } as CouponValidationResponse)
    }

    if (coupon.min_order_value && order_total < coupon.min_order_value) {
      return NextResponse.json({
        valid: false,
        error: `Pedido minimo de R$ ${coupon.min_order_value.toFixed(2)} para este cupom`
      } as CouponValidationResponse)
    }

    const { data: usage, error: usageError } = await supabase
      .from('coupon_usage')
      .select('id')
      .eq('coupon_id', coupon.id)
      .eq('customer_id', customer_id)

    if (usageError) {
      console.error('Error checking coupon usage:', usageError)
      return NextResponse.json({
        valid: false,
        error: 'Erro ao validar cupom'
      } as CouponValidationResponse)
    }

    if (usage && usage.length > 0) {
      return NextResponse.json({
        valid: false,
        error: 'Cupom ja foi utilizado por este cliente'
      } as CouponValidationResponse)
    }

    let discount_amount = 0

    if (coupon.type === 'percentage') {
      discount_amount = (order_total * coupon.value) / 100
      if (coupon.max_discount && discount_amount > coupon.max_discount) {
        discount_amount = coupon.max_discount
      }
    } else if (coupon.type === 'fixed') {
      discount_amount = Math.min(coupon.value, order_total)
    } else {
      return NextResponse.json({
        valid: false,
        error: 'Tipo de cupom invalido'
      } as CouponValidationResponse)
    }

    discount_amount = Math.round(discount_amount * 100) / 100

    return NextResponse.json({
      valid: true,
      coupon,
      discount_amount
    } as CouponValidationResponse)

  } catch (error) {
    console.error('Coupon validation error:', error)
    return NextResponse.json({
      valid: false,
      error: 'Erro interno do servidor'
    } as CouponValidationResponse)
  }
}

// GET para listar cupons disponíveis para um cliente (opcional)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customer_id = searchParams.get('customer_id')

    if (!customer_id) {
      return NextResponse.json({
        success: false,
        error: 'Customer ID requerido'
      })
    }

    const supabase = createServiceRoleClient()
    const now = new Date().toISOString()

    // pega cupons ativos que o cliente não usou
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select(`
        *,
        coupon_usage!left(customer_id)
      `)
      .eq('is_active', true)
      .lte('start_date', now)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .or(`usage_limit.is.null,used_count.lt.usage_limit`)

    if (error) {
      console.error('Error fetching coupons:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar cupons'
      })
    }

    // filtra cupons já usados por este cliente
    const availableCoupons = (coupons || []).filter(coupon =>
      !coupon.coupon_usage.some((usage: { customer_id: string }) => usage.customer_id === customer_id)
    )

    return NextResponse.json({
      success: true,
      coupons: availableCoupons.map(coupon => ({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        type: coupon.type,
        value: coupon.value,
        min_order_value: coupon.min_order_value,
        max_discount: coupon.max_discount,
        end_date: coupon.end_date
      }))
    })

  } catch (error) {
    console.error('Get coupons error:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}
