import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const orderId = params.id

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'ID do pedido requerido' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    const { data: order, error: orderError } = await supabase
      .from('sales')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError) {
      if (orderError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Pedido nao encontrado' },
          { status: 404 }
        )
      }
      console.error('Error fetching order:', orderError)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar pedido' },
        { status: 500 }
      )
    }

    const { data: items, error: itemsError } = await supabase
      .from('sale_items')
      .select(`
        *,
        products!inner(name, images, sku, brand)
      `)
      .eq('sale_id', orderId)

    if (itemsError) {
      console.error('Error fetching order items:', itemsError)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar itens do pedido' },
        { status: 500 }
      )
    }

    let couponUsage = null
    if (order.discount_amount && order.discount_amount > 0) {
      const { data: usage } = await supabase
        .from('coupon_usage')
        .select(`
          *,
          coupons!inner(code, name, type, value)
        `)
        .eq('order_id', orderId)
        .single()

      couponUsage = usage
    }

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        items: items || [],
        coupon_usage: couponUsage
      }
    })

  } catch (error) {
    console.error('Get order error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
