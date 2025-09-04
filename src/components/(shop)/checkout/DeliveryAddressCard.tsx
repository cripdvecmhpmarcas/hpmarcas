import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin } from 'lucide-react'
import type { EcommerceOrder } from '@/types/checkout'

interface DeliveryAddressCardProps {
  order: Pick<EcommerceOrder, 'street' | 'number' | 'complement' | 'neighborhood' | 'city' | 'state' | 'zip_code' | 'shipping_name'>
  className?: string
}

export function DeliveryAddressCard({ order, className }: DeliveryAddressCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Endereço de Entrega
        </CardTitle>
      </CardHeader>
      <CardContent>
        {order.street ? (
          <div className="text-sm">
            <div className="font-medium">{order.shipping_name}</div>
            <div>{order.street}, {order.number}</div>
            {order.complement && <div>{order.complement}</div>}
            <div>{order.neighborhood}</div>
            <div>{order.city}/{order.state}</div>
            <div>CEP: {order.zip_code}</div>
          </div>
        ) : (
          <div className="text-muted-foreground">
            Endereço não disponível
          </div>
        )}
      </CardContent>
    </Card>
  )
}