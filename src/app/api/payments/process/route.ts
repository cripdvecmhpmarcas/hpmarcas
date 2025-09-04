import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createServiceRoleClient } from '@/lib/supabase-server'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
  options: { timeout: 5000 }
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { formData, additionalData, preferenceId, amount } = body

    console.log('Processing payment:', { formData, additionalData, preferenceId, amount })

    if (!preferenceId || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    // Busca pedido por payment_external_id (preferência MP) ou id (fallback)
    let order, orderError

    // Primeiro tenta buscar por payment_external_id (caso principal)
    const { data: orderByExternalId, error: externalIdError } = await supabase
      .from('sales')
      .select('*')
      .eq('payment_external_id', preferenceId)
      .single()

    if (!externalIdError && orderByExternalId) {
      order = orderByExternalId
      orderError = null
    } else {
      // Fallback: busca por id do pedido
      const { data: orderById, error: idError } = await supabase
        .from('sales')
        .select('*')
        .eq('id', preferenceId)
        .single()

      order = orderById
      orderError = idError
    }

    if (orderError || !order) {
      console.error('Order not found by payment_external_id or id:', { preferenceId, externalIdError, orderError })
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // cria pagamento com Mercado Pago
    const payment = new Payment(client)

    // extrai estrutura de dados aninhada
    const paymentFormData = formData?.formData || formData

    console.log('Extracted payment form data:', paymentFormData)

    // pega dados do customer do pedido para fallbacks
    const { data: customer } = await supabase
      .from('customers')
      .select('name, email, cpf_cnpj')
      .eq('id', order.customer_id)
      .single()

    // prepara nome e sobrenome do customer
    const customerName = customer?.name || order.customer_name || 'Cliente'
    const nameParts = customerName.split(' ')
    const firstName = nameParts[0] || 'Cliente'
    const lastName = nameParts.slice(1).join(' ') || 'HP Marcas'

    // prepara dados de pagamento simplificados para PIX
    const paymentData = {
      transaction_amount: Math.max(Math.round(amount), 500) / 100, // converte centavos para reais para o MP
      payment_method_id: paymentFormData?.payment_method_id,
      description: `Pedido HP Marcas #${preferenceId?.slice(-8) || 'N/A'}`,
      payer: {
        email: paymentFormData?.payer?.email || customer?.email || `${order.customer_name?.toLowerCase().replace(/\s+/g, '.')}@hpmarcas.com.br`,
        first_name: paymentFormData?.payer?.first_name || firstName,
        last_name: paymentFormData?.payer?.last_name || lastName,
        identification: {
          type: 'CPF',
          number: paymentFormData?.payer?.identification?.number || customer?.cpf_cnpj || '00000000000'
        }
      },
      external_reference: preferenceId,
      notification_url: `${process.env.NEXTAUTH_URL || 'https://hpmarcas-clone.vercel.app'}/api/webhooks/mercadopago`,
    }

    // remove campos undefined para evitar problemas
    const payer: Record<string, unknown> = paymentData.payer
    Object.keys(payer).forEach((key: string) => {
      if (payer[key] === undefined) {
        delete payer[key]
      }
    })
    if (payer.identification && typeof payer.identification === 'object' && payer.identification !== null) {
      const identification = payer.identification as { type?: string; number?: string }
      if (identification.number === '00000000000') {
        // remove identification se for o CPF padrão para evitar erro
        delete payer.identification
      }
    }

    console.log('Customer data from DB:', customer)
    console.log('Sending payment data to Mercado Pago:', JSON.stringify(paymentData, null, 2))

    // valida campos obrigatórios para o Mercado Pago
    if (!paymentData.payment_method_id) {
      console.error('Missing payment_method_id:', paymentFormData)
      return NextResponse.json(
        { success: false, error: 'Missing payment method ID' },
        { status: 400 }
      )
    }

    const paymentResult = await payment.create({
      body: paymentData,
    })

    console.log('Mercado Pago response:', paymentResult)
    console.log('Comparison - Sent vs Received:')
    console.log('Sent payer:', JSON.stringify(paymentData.payer, null, 2))
    console.log('Received payer:', JSON.stringify(paymentResult.payer, null, 2))

    if (paymentResult) {
      // atualiza pedido com informações de pagamento
      const { error: updateError } = await supabase
        .from('sales')
        .update({
          payment_external_id: paymentResult.id?.toString(),
          payment_status: mapPaymentStatus(paymentResult.status),
          payment_method: paymentResult.payment_method_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', preferenceId)

      if (updateError) {
        console.error('Error updating order:', updateError)
      }

      return NextResponse.json({
        success: true,
        payment: {
          id: paymentResult.id,
          status: paymentResult.status,
          status_detail: paymentResult.status_detail,
          payment_method_id: paymentResult.payment_method_id,
          external_reference: paymentResult.external_reference,
          transaction_amount: paymentResult.transaction_amount,
          point_of_interaction: paymentResult.point_of_interaction,
        },
      })
    } else {
      throw new Error('No payment result received')
    }

  } catch (error) {
    console.error('Payment processing error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error processing payment'
      },
      { status: 500 }
    )
  }
}

function mapPaymentStatus(mpStatus: string | null | undefined): string {
  switch (mpStatus) {
    case 'approved':
      return 'approved'
    case 'pending':
      return 'pending'
    case 'authorized':
      return 'authorized'
    case 'in_process':
      return 'processing'
    case 'in_mediation':
      return 'in_mediation'
    case 'rejected':
      return 'rejected'
    case 'cancelled':
      return 'cancelled'
    case 'refunded':
      return 'refunded'
    case 'charged_back':
      return 'charged_back'
    default:
      return 'pending'
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Payment processing API is running',
  })
}
