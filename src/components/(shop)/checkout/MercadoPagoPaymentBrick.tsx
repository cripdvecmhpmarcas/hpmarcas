'use client'

import { useEffect, useState, useCallback } from 'react'
import { initMercadoPago, Payment } from '@mercadopago/sdk-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CreditCard, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

if (process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY) {
  initMercadoPago(process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY, {
    locale: 'pt-BR'
  })
}

interface MercadoPagoPaymentBrickProps {
  preferenceId: string
  amount: number
  customerEmail?: string
  customerName?: string
  customerCpf?: string | null
  onPaymentSubmit?: (paymentData: {
    status: string
    payment_method?: string
    payment_id?: string
    amount?: number
    external_reference?: string
    qr_code?: string
    qr_code_base64?: string
    ticket_url?: string
  }) => void
  onPaymentError?: (error: { message?: string; code?: string }) => void
  onReady?: () => void
  className?: string
}

export function MercadoPagoPaymentBrick({
  preferenceId,
  amount,
  customerEmail,
  customerName,
  customerCpf,
  onPaymentSubmit,
  onPaymentError,
  onReady,
  className
}: MercadoPagoPaymentBrickProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price / 100) // Valor já vem em centavos
  }

  // Valor já deve vir em centavos, mas garantir mínimo
  const normalizedAmount = Math.max(Math.round(amount), 500) // Mínimo R$ 5,00 (500 centavos)  // Payment Brick initialization configuration
  const initialization = {
    amount: normalizedAmount,
    // Removido preferenceId temporariamente para evitar erro "Failed to get preference details"
    ...(customerEmail && {
      payer: {
        email: customerEmail,
        ...(customerName && {
          first_name: customerName.split(' ')[0] || 'Cliente',
          last_name: customerName.split(' ').slice(1).join(' ') || 'HP Marcas'
        }),
        ...(customerCpf && {
          identification: {
            type: 'CPF',
            number: customerCpf
          }
        })
      }
    })
  }

  // Payment methods customization - apenas PIX
  const customization = {
    visual: {
      style: {
        theme: 'default' as const
      }
    },
    paymentMethods: {
      bankTransfer: 'all' as const, // Permitir PIX (bank_transfer)
      maxInstallments: 1
    }
  }

  // State para prevenir múltiplos submits
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = useCallback(async (formData: unknown, additionalData?: unknown) => {
    console.log('Payment submitted:', { formData, additionalData })

    // PROTEÇÃO: Previne múltiplos submits simultâneos
    if (isSubmitting) {
      console.log('Payment already being processed, ignoring duplicate submit')
      return Promise.resolve()
    }

    return new Promise<void>(async (resolve, reject) => {
      try {
        setIsSubmitting(true)

        const response = await fetch('/api/payments/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            formData,
            additionalData,
            preferenceId,
            amount: normalizedAmount
          }),
        })

        const result = await response.json()

        if (result.success) {
          console.log('Payment processed successfully:', result)

          onPaymentSubmit?.({
            status: result.payment?.status || 'pending',
            payment_method: result.payment?.payment_method_id || 'unknown',
            payment_id: result.payment?.id?.toString(),
            amount: normalizedAmount,
            external_reference: result.payment?.external_reference,
            qr_code: result.payment?.point_of_interaction?.transaction_data?.qr_code,
            qr_code_base64: result.payment?.point_of_interaction?.transaction_data?.qr_code_base64,
            ticket_url: result.payment?.point_of_interaction?.transaction_data?.ticket_url
          })

          if (result.payment?.payment_method_id === 'pix') {
            toast.success('PIX gerado! Aguardando confirmação do pagamento.')
          } else if (result.payment?.status === 'approved') {
            toast.success('Pagamento aprovado com sucesso!')
          } else {
            toast.success('Pagamento enviado para processamento.')
          }

          resolve()
        } else {
          throw new Error(result.error || 'Erro ao processar pagamento')
        }

      } catch (error) {
        console.error('Error processing payment:', error)
        const errorMessage = error instanceof Error ? error.message : 'Erro ao processar pagamento'

        toast.error(errorMessage)
        onPaymentError?.({
          message: errorMessage,
          code: 'PAYMENT_ERROR'
        })

        reject()
      } finally {
        // Libera após 2 segundos para evitar race conditions
        setTimeout(() => {
          setIsSubmitting(false)
        }, 2000)
      }
    })
  }, [preferenceId, normalizedAmount, onPaymentSubmit, onPaymentError, isSubmitting])

  const onReadyCallback = useCallback(() => {
    console.log('Payment Brick is ready')
    setIsLoading(false)
    onReady?.()
  }, [onReady])

  const onErrorCallback = useCallback((error: { message?: string; code?: string }) => {
    console.error('Payment Brick error:', error)
    const errorMessage = error?.message || 'Erro no Payment Brick'
    setError(errorMessage)

    toast.error(errorMessage)
    onPaymentError?.({
      message: errorMessage,
      code: error?.code || 'BRICK_ERROR'
    })
  }, [onPaymentError])

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY) {
      setError('Chave pública do Mercado Pago não configurada')
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (amount < 500) {
      console.warn(`Valor ${amount} centavos é muito baixo. Usando valor mínimo de 500 centavos (R$ 5,00)`)
    }
  }, [amount])

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Erro no Pagamento
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
          <CreditCard className="h-5 w-5" />
          Método de Pagamento
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Total a pagar: <span className="font-bold text-lg">{formatPrice(normalizedAmount)}</span>
        </div>
      </CardHeader>
      <CardContent>
        {/* Loading state */}
        {(isLoading || isSubmitting) && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">
              {isSubmitting ? 'Processando pagamento...' : 'Carregando métodos de pagamento...'}
            </p>
          </div>
        )}

        {/* Payment Brick Component */}
        <div className={(isLoading || isSubmitting) ? 'hidden' : ''}>
          <Payment
            initialization={initialization}
            customization={customization}
            onSubmit={onSubmit}
            onReady={onReadyCallback}
            onError={onErrorCallback}
          />
        </div>

        {!isLoading && !error && (
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 text-center">
              🔒 Pagamento processado com segurança pelo Mercado Pago
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
