import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useOrderFormatters } from '@/hooks/useOrderFormatters'
import type { EcommerceOrderItem } from '@/types/checkout'

interface OrderSummaryCardProps {
  items: EcommerceOrderItem[]
  subtotalAmount: number
  shippingCost: number
  couponDiscount: number
  totalAmount: number
  className?: string
}

export function OrderSummaryCard({
  items,
  subtotalAmount,
  shippingCost,
  couponDiscount,
  totalAmount,
  className
}: OrderSummaryCardProps) {
  const { formatCurrency } = useOrderFormatters()

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Itens do Pedido</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items?.map((item) => (
          <div key={item.id} className="flex justify-between items-start">
            <div className="flex-1">
              <div className="font-medium text-sm">
                {item.product?.name || 'Produto'}
              </div>
              <div className="text-xs text-muted-foreground">
                Qtd: {item.quantity} × {formatCurrency(item.unit_price)}
              </div>
            </div>
            <div className="font-medium">
              {formatCurrency(item.total_price)}
            </div>
          </div>
        ))}

        <Separator />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotalAmount)}</span>
          </div>

          {shippingCost > 0 && (
            <div className="flex justify-between">
              <span>Frete</span>
              <span>{formatCurrency(shippingCost)}</span>
            </div>
          )}

          {couponDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Desconto</span>
              <span>-{formatCurrency(couponDiscount)}</span>
            </div>
          )}

          <Separator />

          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}