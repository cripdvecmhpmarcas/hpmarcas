'use client'

import { useEffect, useState, useCallback } from 'react'
import { initMercadoPago, StatusScreen } from '@mercadopago/sdk-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react'

if (process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY) {
  initMercadoPago(process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY, {
    locale: 'pt-BR'
  })
}

interface MercadoPagoStatusBrickProps {
  paymentId: string
  onReady?: () => void
  onError?: (error: { message?: string; code?: string }) => void
  className?: string
}

export function MercadoPagoStatusBrick({
  paymentId,
  onReady,
  onError,
  className
}: MercadoPagoStatusBrickProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const initialization = {
    paymentId: paymentId
  }

  const customization = {
    visual: {
      hideStatusDetails: false,  // Mostrar detalhes do status
      hideTransactionDate: false, // Mostrar data da transação
      style: {
        theme: 'dark' as const // 'default' | 'dark' | 'bootstrap' | 'flat'
      }
    },
    backUrls: {
      error: `${window.location.origin}/checkout?error=payment_failed`,
      return: `${window.location.origin}/checkout/success`
    }
  }

  const onReadyCallback = useCallback(() => {
    console.log('Status Screen Brick is ready')
    setIsLoading(false)
    onReady?.()
  }, [onReady])

  // Handle errors
  const onErrorCallback = useCallback((error: { message?: string; code?: string }) => {
    console.error('Status Screen Brick error:', error)
    const errorMessage = error?.message || 'Erro no Status Screen'
    setError(errorMessage)
    setIsLoading(false)

    onError?.({
      message: errorMessage,
      code: error?.code || 'STATUS_BRICK_ERROR'
    })
  }, [onError])

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY) {
      setError('Chave pública do Mercado Pago não configurada')
      setIsLoading(false)
    }
  }, [])

  // Validar o ID do pagamento
  useEffect(() => {
    if (!paymentId) {
      setError('ID do pagamento não fornecido')
      setIsLoading(false)
    }
  }, [paymentId])

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Erro no Status do Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Status do Pagamento
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          ID do Pagamento: <span className="font-mono">{paymentId}</span>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">
              Carregando status do pagamento...
            </p>
          </div>
        )}

        {/* Status Screen Brick Component */}
        <div className={isLoading ? 'hidden' : ''}>
          <StatusScreen
            initialization={initialization}
            customization={customization}
            onReady={onReadyCallback}
            onError={onErrorCallback}
          />
        </div>

        {!isLoading && !error && (
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 text-center">
              🔒 Status verificado em tempo real com o Mercado Pago
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
