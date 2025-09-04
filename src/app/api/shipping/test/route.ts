import { NextRequest, NextResponse } from 'next/server'
import { createShippingService } from '@/lib/shipping-service'
import { createMelhorEnvioService } from '@/lib/melhor-envio'

/**
 * Test endpoint for Melhor Envio integration
 * GET /api/shipping/test
 */
export async function GET() {
  try {
    const results: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      tests: {}
    }

    // Test 1: Configuration
    const useMelhorEnvio = !!(
      process.env.MELHOR_ENVIO_CLIENT_ID && 
      process.env.MELHOR_ENVIO_CLIENT_SECRET
    )

    results.tests = {
      ...results.tests as object,
      configuration: {
        status: 'ok',
        melhor_envio_configured: useMelhorEnvio,
        sandbox_mode: process.env.MELHOR_ENVIO_SANDBOX === 'true',
        store_configured: !!process.env.STORE_ADDRESS_FROM_NAME,
        credentials: {
          client_id: !!process.env.MELHOR_ENVIO_CLIENT_ID,
          client_secret: !!process.env.MELHOR_ENVIO_CLIENT_SECRET,
          redirect_uri: !!process.env.MELHOR_ENVIO_REDIRECT_URI,
        }
      }
    }

    // Test 2: Service instantiation
    try {
      const shippingService = createShippingService()
      results.tests = {
        ...results.tests as object,
        service_creation: {
          status: 'ok',
          message: 'Shipping service created successfully'
        }
      }

      // Test 3: Melhor Envio authentication (if configured)
      if (useMelhorEnvio) {
        try {
          const melhorEnvio = createMelhorEnvioService()
          await melhorEnvio.authenticate()
          
          results.tests = {
            ...results.tests as object,
            authentication: {
              status: 'ok',
              message: 'Authentication successful'
            }
          }

          // Test 4: Get services
          try {
            const services = await melhorEnvio.getServices()
            results.tests = {
              ...results.tests as object,
              services: {
                status: 'ok',
                count: services.length,
                available_services: services.map(s => ({
                  id: s.id,
                  name: s.name,
                  company: s.company.name
                }))
              }
            }
          } catch (error) {
            results.tests = {
              ...results.tests as object,
              services: {
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            }
          }

        } catch (error) {
          results.tests = {
            ...results.tests as object,
            authentication: {
              status: 'error',
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        }
      } else {
        results.tests = {
          ...results.tests as object,
          authentication: {
            status: 'skipped',
            message: 'Melhor Envio not configured, using mock service'
          }
        }
      }

      // Test 5: Shipping calculation
      try {
        const testRequest = {
          origin_zip_code: process.env.NEXT_PUBLIC_STORE_ZIPCODE || '01310-100',
          destination_zip_code: '04038-001', // Test CEP in São Paulo
          items: [{
            weight: 0.5, // 500g
            length: 20,
            width: 15,
            height: 10,
            value: 50.00
          }]
        }

        const options = await shippingService.calculateShipping(testRequest)
        
        results.tests = {
          ...results.tests as object,
          shipping_calculation: {
            status: 'ok',
            request: testRequest,
            options: options.map(opt => ({
              method: opt.method,
              name: opt.name,
              price: opt.price,
              delivery_time: opt.delivery_time_description,
              carrier: opt.carrier
            }))
          }
        }

      } catch (error) {
        results.tests = {
          ...results.tests as object,
          shipping_calculation: {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      }

    } catch (error) {
      results.tests = {
        ...results.tests as object,
        service_creation: {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    // Overall status
    const testsObj = results.tests as Record<string, { status: string }>
    const allTests = Object.values(testsObj)
    const hasErrors = allTests.some(test => test.status === 'error')
    
    results.overall_status = hasErrors ? 'error' : 'ok'
    results.summary = {
      total_tests: allTests.length,
      passed: allTests.filter(test => test.status === 'ok').length,
      failed: allTests.filter(test => test.status === 'error').length,
      skipped: allTests.filter(test => test.status === 'skipped').length
    }

    return NextResponse.json(results, { 
      status: hasErrors ? 500 : 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Shipping test error:', error)
    return NextResponse.json({
      overall_status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * Test specific shipping calculation
 * POST /api/shipping/test
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { origin_zip_code, destination_zip_code, items, force_melhor_envio } = body

    // Validate required fields
    if (!origin_zip_code || !destination_zip_code || !items?.length) {
      return NextResponse.json({
        success: false,
        error: 'Campos obrigatórios: origin_zip_code, destination_zip_code, items'
      }, { status: 400 })
    }

    const shippingService = createShippingService()
    
    // Override service if requested
    if (force_melhor_envio && process.env.MELHOR_ENVIO_CLIENT_ID) {
      try {
        const melhorEnvio = createMelhorEnvioService()
        const options = await melhorEnvio.calculateShipping({
          from: {
            postal_code: origin_zip_code.replace(/\D/g, ''),
            address: process.env.STORE_ADDRESS_FROM_ADDRESS || '',
            number: '1000',
            district: process.env.STORE_ADDRESS_FROM_DISTRICT || '',
            city: process.env.STORE_ADDRESS_FROM_CITY || '',
            state_abbr: process.env.STORE_ADDRESS_FROM_STATE_ABBR || '',
            country_id: 'BR',
          },
          to: {
            postal_code: destination_zip_code.replace(/\D/g, ''),
            address: 'Rua Teste',
            number: '100',
            district: 'Centro',
            city: 'São Paulo',
            state_abbr: 'SP',
            country_id: 'BR',
          },
          products: items.map((item: { width: number; height: number; length: number; weight: number; value: number }, index: number) => ({
            id: `item-${index}`,
            width: item.width,
            height: item.height,
            length: item.length,
            weight: item.weight,
            insurance_value: item.value,
            quantity: 1,
          })),
          services: '1,2,3,17',
        })

        return NextResponse.json({
          success: true,
          source: 'melhor_envio_direct',
          options: options
        })
      } catch (error) {
        return NextResponse.json({
          success: false,
          source: 'melhor_envio_direct',
          error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
      }
    }

    // Use shipping service (with fallback)
    const options = await shippingService.calculateShipping({
      origin_zip_code,
      destination_zip_code,
      items
    })

    return NextResponse.json({
      success: true,
      source: 'shipping_service',
      options
    })

  } catch (error) {
    console.error('Shipping test POST error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}