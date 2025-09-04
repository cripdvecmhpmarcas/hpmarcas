import { NextRequest, NextResponse } from 'next/server'
import { createShippingService } from '@/lib/shipping-service'
import type { ShippingCalculationRequest, ShippingCalculationResponse } from '@/types/checkout'

export async function POST(request: NextRequest) {
  try {
    const body: ShippingCalculationRequest = await request.json()
    const { origin_zip_code, destination_zip_code, items } = body

    if (!origin_zip_code || !destination_zip_code || !items?.length) {
      return NextResponse.json({
        success: false,
        options: [],
        error: 'Dados obrigatórios ausentes'
      } as ShippingCalculationResponse)
    }

    // Create shipping service instance
    const shippingService = createShippingService()

    // Calculate shipping options
    const options = await shippingService.calculateShipping({
      origin_zip_code,
      destination_zip_code,
      items
    })

    return NextResponse.json({
      success: true,
      options
    } as ShippingCalculationResponse)

  } catch (error) {
    console.error('Shipping calculation error:', error)
    
    // Return appropriate error message
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor'
    
    return NextResponse.json({
      success: false,
      options: [],
      error: errorMessage
    } as ShippingCalculationResponse)
  }
}

export async function GET() {
  const useMelhorEnvio = !!(
    process.env.MELHOR_ENVIO_CLIENT_ID && 
    process.env.MELHOR_ENVIO_CLIENT_SECRET
  )

  return NextResponse.json({
    status: 'ok',
    message: 'API de entrega está funcionando',
    integration: useMelhorEnvio ? 'Melhor Envio API' : 'Mock',
    sandbox: process.env.MELHOR_ENVIO_SANDBOX === 'true',
    configured: {
      melhor_envio: useMelhorEnvio,
      store_address: !!process.env.STORE_ADDRESS_FROM_NAME
    }
  })
}
