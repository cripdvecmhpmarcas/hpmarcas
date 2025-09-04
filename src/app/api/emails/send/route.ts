import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { sendOrderConfirmationEmail, sendPaymentConfirmedEmail, testEmailConfiguration, OrderEmailData } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, orderId, testMode = false } = body

    // Verificar se é modo de teste
    if (testMode) {
      console.log('Testando configuração de email...')
      const result = await testEmailConfiguration()
      return NextResponse.json(result)
    }

    // Validar parâmetros obrigatórios
    if (!type || !orderId) {
      return NextResponse.json(
        { success: false, error: 'Tipo de email e ID do pedido são obrigatórios' },
        { status: 400 }
      )
    }

    if (!['order-confirmation', 'payment-confirmed'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de email inválido' },
        { status: 400 }
      )
    }

    console.log(`Processando envio de email tipo: ${type} para pedido: ${orderId}`)

    const supabase = createServiceRoleClient()

    // Buscar dados do pedido (query simples)
    const { data: order, error: orderError } = await supabase
      .from('sales')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('Erro ao buscar pedido:', orderError)
      return NextResponse.json(
        { success: false, error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    // Buscar dados do cliente
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('name, email')
      .eq('id', order.customer_id)
      .single()

    if (customerError || !customer || !customer.email) {
      console.error('Erro ao buscar cliente:', customerError)
      return NextResponse.json(
        { success: false, error: 'Cliente não encontrado ou sem email' },
        { status: 404 }
      )
    }

    // Buscar endereço de entrega se disponível
    let shippingAddress = null
    if (order.shipping_address_id) {
      const { data: address } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('id', order.shipping_address_id)
        .single()

      shippingAddress = address
    }

    // Buscar itens do pedido
    const { data: items, error: itemsError } = await supabase
      .from('sale_items')
      .select(`
        *,
        products!inner(name, images, sku, brand)
      `)
      .eq('sale_id', orderId)

    if (itemsError) {
      console.error('Erro ao buscar itens do pedido:', itemsError)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar itens do pedido' },
        { status: 500 }
      )
    }

    // Preparar dados do email
    const orderEmailData: OrderEmailData = {
      orderId: order.id,
      orderNumber: order.id.slice(-8).toUpperCase(),
      customerName: customer.name,
      customerEmail: customer.email,
      orderDate: order.created_at,
      paymentMethod: order.payment_method || 'pix',
      orderStatus: order.status || 'pending',
      items: (items || []).map(item => ({
        productName: item.products?.name || 'Produto',
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price,
        imageUrl: item.products?.images?.[0] || undefined,
        sku: item.products?.sku || ''
      })),
      subtotal: order.subtotal || 0,
      shippingCost: order.shipping_cost || 0,
      discount: order.discount_amount || 0,
      totalAmount: order.total,
      shippingAddress: shippingAddress ? {
        name: customer.name,
        street: shippingAddress.street,
        number: shippingAddress.number,
        complement: shippingAddress.complement || undefined,
        neighborhood: shippingAddress.neighborhood,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zipCode: shippingAddress.zip_code
      } : undefined,
      isPix: order.payment_method === 'pix',
      trackingNumber: order.tracking_number || undefined,
      estimatedDelivery: order.estimated_delivery || undefined,
      paymentId: order.payment_external_id || undefined,
      invoiceKey: undefined // Campo não existe ainda na tabela
    }

    // Enviar email baseado no tipo
    let result
    switch (type) {
      case 'order-confirmation':
        result = await sendOrderConfirmationEmail(orderEmailData)
        break
      case 'payment-confirmed':
        result = await sendPaymentConfirmedEmail(orderEmailData)
        break
      default:
        return NextResponse.json(
          { success: false, error: 'Tipo de email não suportado' },
          { status: 400 }
        )
    }

    if (result.success) {
      // Registrar envio no log (opcional)
      await supabase
        .from('email_logs')
        .insert([{
          order_id: orderId,
          email_type: type,
          recipient_email: orderEmailData.customerEmail,
          status: 'sent',
          external_id: result.emailId,
          sent_at: new Date().toISOString()
        }])
        .select()
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Erro no envio de email:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const test = searchParams.get('test')

  if (test === 'true') {
    try {
      const result = await testEmailConfiguration()
      return NextResponse.json({
        status: 'ok',
        message: 'Email service API is running',
        testResult: result
      })
    } catch (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Email service test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return NextResponse.json({
    status: 'ok',
    message: 'Email service API is running',
    availableTypes: ['order-confirmation', 'payment-confirmed']
  })
}
