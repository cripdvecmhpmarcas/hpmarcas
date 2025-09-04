import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    const { data: order, error } = await supabase
      .from('sales')
      .select('id, status, payment_status, payment_external_id, updated_at')
      .eq('id', orderId)
      .single()

    if (error || !order) {
      console.error('Order not found:', orderId, error)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      paymentStatus: order.payment_status,
      paymentExternalId: order.payment_external_id,
      updatedAt: order.updated_at,
      isPaid: order.payment_status === 'approved',
      isConfirmed: order.status === 'confirmed'
    })

  } catch (error) {
    console.error('Error checking order status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
