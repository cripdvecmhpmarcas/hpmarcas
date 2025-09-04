import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import type { CreateOrderRequest, CreateOrderResponse } from '@/types/checkout'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { getMercadoPagoConfig, getBaseUrl } from '@/lib/ssl-config'

// Initialize Mercado Pago
const client = new MercadoPagoConfig(getMercadoPagoConfig())

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json()
    const { customer_id, shipping_address_id, shipping_cost, shipping_method, coupon_code, items } = body

    // Validate required fields
    if (!customer_id || !shipping_address_id || !items?.length) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatorios ausentes' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    // Get customer data
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customer_id)
      .single()

    if (customerError || !customer) {
      return NextResponse.json(
        { success: false, error: 'Cliente nao encontrado' },
        { status: 404 }
      )
    }

    // Get shipping address
    const { data: shippingAddress, error: addressError } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('id', shipping_address_id)
      .eq('customer_id', customer_id)
      .single()

    if (addressError || !shippingAddress) {
      return NextResponse.json(
        { success: false, error: 'Endereco de entrega nao encontrado' },
        { status: 404 }
      )
    }

    // Validate products and stock
    const productIds = items.map(item => item.product_id)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds)
      .eq('status', 'active')

    if (productsError || !products) {
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar produtos' },
        { status: 500 }
      )
    }

    // Validate stock and calculate totals
    let subtotal = 0
    let coupon_discount = 0
    const validatedItems = []
    const stockErrors = []

    for (const item of items) {
      const product = products.find(p => p.id === item.product_id)

      if (!product) {
        return NextResponse.json(
          { success: false, error: `Produto ${item.product_id} nao encontrado ou inativo` },
          { status: 400 }
        )
      }

      // Check stock availability
      if (product.stock < item.quantity) {
        stockErrors.push({
          product_id: item.product_id,
          product_name: product.name,
          requested: item.quantity,
          available: product.stock
        })
      }

      // Calculate price based on customer type
      const isWholesale = customer.type === 'wholesale'
      let unit_price = isWholesale ? product.wholesale_price : product.retail_price

      // Apply volume price adjustment if present
      if (item.volume?.price_adjustment) {
        unit_price += item.volume.price_adjustment
      }

      const total_price = unit_price * item.quantity
      subtotal += total_price

      validatedItems.push({
        product_id: item.product_id,
        product_name: product.name,
        product_sku: product.sku,
        quantity: item.quantity,
        unit_price,
        total_price,
        volume: item.volume
      })
    }

    // Return stock errors if any
    if (stockErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Estoque insuficiente para alguns produtos',
          validation_errors: { stock: stockErrors }
        },
        { status: 400 }
      )
    }

    // Validate and apply coupon if provided
    if (coupon_code) {
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', coupon_code.toUpperCase())
        .eq('is_active', true)
        .single()

      if (coupon && !couponError) {
        const now = new Date()
        const startDate = new Date(coupon.start_date)
        const endDate = coupon.end_date ? new Date(coupon.end_date) : null

        // Check if coupon is valid
        const isDateValid = now >= startDate && (!endDate || now <= endDate)
        const isUsageLimitValid = !coupon.usage_limit || coupon.used_count < coupon.usage_limit
        const isMinOrderValid = !coupon.min_order_value || subtotal >= coupon.min_order_value

        if (isDateValid && isUsageLimitValid && isMinOrderValid) {
          if (coupon.type === 'percentage') {
            coupon_discount = Math.min(
              (subtotal * coupon.value) / 100,
              coupon.max_discount || Infinity
            )
          } else {
            coupon_discount = Math.min(coupon.value, subtotal)
          }
        }
      }
    }

    const total = subtotal - coupon_discount + shipping_cost

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from('sales')
      .insert({
        customer_id,
        customer_name: customer.name,
        customer_type: customer.type,
        subtotal,
        discount_amount: coupon_discount,
        total,
        payment_method: 'pix',
        payment_status: 'pending',
        status: 'pending',
        order_source: 'ecommerce',
        shipping_address_id,
        shipping_method: shipping_method || 'standard',
        shipping_cost,
        user_id: customer.user_id || customer_id,
        user_name: customer.name
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Error creating order:', orderError)
      return NextResponse.json(
        { success: false, error: 'Erro ao criar pedido' },
        { status: 500 }
      )
    }

    // Insert order items
    const orderItemsData = validatedItems.map(item => ({
      sale_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_sku: item.product_sku,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price
    }))

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(orderItemsData)

    if (itemsError) {
      console.error('Error creating order items:', itemsError)
      // Rollback order creation
      await supabase.from('sales').delete().eq('id', order.id)
      return NextResponse.json(
        { success: false, error: 'Erro ao criar itens do pedido' },
        { status: 500 }
      )
    }

    // Record coupon usage if applicable
    if (coupon_code && coupon_discount > 0) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('id')
        .eq('code', coupon_code.toUpperCase())
        .single()

      if (coupon) {
        await supabase.from('coupon_usage').insert({
          coupon_id: coupon.id,
          customer_id,
          order_id: order.id,
          discount_amount: coupon_discount
        })

        // Update coupon used count
        await supabase.rpc('increment_coupon_usage', {
          coupon_id: coupon.id
        })
      }
    }

    // Create Mercado Pago preference for PIX only
    const preference = new Preference(client)

    const preferenceData = {
      items: [
        {
          id: order.id,
          title: `Pedido #${order.id.slice(-8)}`,
          description: `${validatedItems.length} item(ns)`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: total
        }
      ],
      payer: {
        name: customer.name,
        email: customer.email || 'customer@hpmarcas.com.br'
      },
      payment_methods: {
        excluded_payment_methods: [
          { id: 'visa' },
          { id: 'master' },
          { id: 'amex' },
          { id: 'elo' }
        ],
        excluded_payment_types: [
          { id: 'credit_card' },
          { id: 'debit_card' },
          { id: 'ticket' }
        ],
        installments: 1
      },
      back_urls: {
        success: `${process.env.NEXTAUTH_URL || 'https://845aa0d9346e.ngrok-free.app/'}/checkout/sucesso/${order.id}`,
        failure: `${process.env.NEXTAUTH_URL || 'https://845aa0d9346e.ngrok-free.app/'}/checkout?error=payment_failed`,
        pending: `${process.env.NEXTAUTH_URL || 'https://845aa0d9346e.ngrok-free.app/'}/checkout/sucesso/${order.id}?status=pending`
      },
      notification_url: `${process.env.NEXTAUTH_URL || 'https://845aa0d9346e.ngrok-free.app/'}/api/webhooks/mercadopago`,
      external_reference: order.id,
      statement_descriptor: 'HP MARCAS'
    }

    try {
      const mpResponse = await preference.create({ body: preferenceData })

      // Update order with Mercado Pago preference ID
      await supabase
        .from('sales')
        .update({
          payment_method_detail: { preference_id: mpResponse.id },
          payment_external_id: mpResponse.id
        })
        .eq('id', order.id)

      // Enviar email de confirmação de pedido (assíncrono)
      try {
        const baseUrl = getBaseUrl()
        const emailPayload = {
          type: 'order-confirmation',
          orderId: order.id
        }

        const emailResponse = await fetch(`${baseUrl}/api/emails/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailPayload)
        })


        if (!emailResponse.ok) {
          const errorText = await emailResponse.text()
          console.warn('Falha ao enviar email de confirmação:', errorText)
          console.warn('Headers da resposta:', Object.fromEntries(emailResponse.headers.entries()))
        } else {
          const successResponse = await emailResponse.json()
          console.log('Email de confirmação de pedido enviado com sucesso:', successResponse)
        }
      } catch (emailError) {
        console.error('Erro ao enviar email de confirmação (não crítico):', emailError)
        console.error('Stack trace:', emailError instanceof Error ? emailError.stack : 'Sem stack trace')
      }

      return NextResponse.json({
        success: true,
        order: {
          ...order,
          total_amount: total,
          subtotal_amount: subtotal,
          coupon_discount: coupon_discount,
          order_source: 'ecommerce',
          shipping_address_id,
          shipping_method: shipping_method || 'standard',
          shipping_cost,
          payment_external_id: mpResponse.id
        },
        payment_preference_id: mpResponse.id
      } as CreateOrderResponse)

    } catch (mpError) {
      console.error('Mercado Pago error:', mpError)
      return NextResponse.json(
        { success: false, error: 'Erro ao criar preferencia de pagamento' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
