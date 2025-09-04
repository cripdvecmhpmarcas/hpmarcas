import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package } from 'lucide-react'
import { useOrderFormatters, type OrderStatusInfo } from '@/hooks/useOrderFormatters'

interface OrderStatusCardProps {
  status: string
  createdAt: string
  className?: string
}

export function OrderStatusCard({ status, createdAt, className }: OrderStatusCardProps) {
  const { getOrderStatusInfo } = useOrderFormatters()
  const orderInfo: OrderStatusInfo = getOrderStatusInfo(status)
  const IconComponent = orderInfo.icon

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Status do Pedido
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={orderInfo.color + ' border'}>
                <IconComponent className="h-4 w-4 mr-1" />
                {orderInfo.text}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Pedido realizado em {new Date(createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}