import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CreditCard, QrCode, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useOrderFormatters, type PaymentStatusInfo } from '@/hooks/useOrderFormatters'

interface PaymentStatusCardProps {
  paymentStatus: string | null
  totalAmount: number
  paymentExternalId?: string | null
  showPixActions?: boolean
  className?: string
}

export function PaymentStatusCard({
  paymentStatus,
  totalAmount,
  paymentExternalId,
  showPixActions = false,
  className
}: PaymentStatusCardProps) {
  const { formatCurrency, getPaymentStatusInfo } = useOrderFormatters()
  const [pixCopied, setPixCopied] = useState(false)

  const paymentInfo: PaymentStatusInfo = getPaymentStatusInfo(paymentStatus)

  const copyPixCode = () => {
    const pixCode = paymentExternalId || 'Código PIX não disponível'

    navigator.clipboard.writeText(pixCode).then(() => {
      setPixCopied(true)
      toast.success('Código PIX copiado!')
      setTimeout(() => setPixCopied(false), 2000)
    }).catch(() => {
      toast.error('Erro ao copiar código PIX')
    })
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Status do Pagamento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Badge className={paymentInfo.color + ' border'}>
                {paymentInfo.text}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">
                {paymentInfo.description}
              </p>
            </div>
            <div className="text-right">
              <div className="font-bold text-xl">
                {formatCurrency(totalAmount)}
              </div>
              <div className="text-sm text-muted-foreground">
                via PIX
              </div>
            </div>
          </div>

          {showPixActions && paymentStatus === 'pending' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <QrCode className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-blue-800">
                    Aguardando pagamento PIX
                  </div>
                  <div className="text-sm text-blue-600">
                    Complete o pagamento para confirmar seu pedido
                  </div>
                </div>
              </div>

              <Button
                onClick={copyPixCode}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {pixCopied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar código PIX
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
