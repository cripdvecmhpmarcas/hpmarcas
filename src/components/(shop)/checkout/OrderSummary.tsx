'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Package, Truck, Tag, Calculator } from 'lucide-react'
import type { CartDisplayItem, OrderSummary as OrderSummaryType } from '@/types/checkout'

interface OrderSummaryProps {
  items: CartDisplayItem[]
  summary: OrderSummaryType
  couponCode?: string
  shippingMethod?: string
  className?: string
}

export function OrderSummary({ 
  items, 
  summary, 
  couponCode, 
  shippingMethod,
  className 
}: OrderSummaryProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Resumo do Pedido
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Items */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Package className="h-4 w-4" />
            Produtos ({summary.items_count})
          </div>
          
          {items.map((item, index) => (
            <div key={`${item.productId}-${index}`} className="flex items-center justify-between text-sm">
              <div className="flex-1">
                <div className="font-medium">{item.name}</div>
                {item.volume && (
                  <div className="text-xs text-muted-foreground">
                    Volume: {item.volume.displayName}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  {item.quantity}x {formatPrice(item.currentPrice)}
                  {item.hasDiscount && (
                    <span className="ml-2">
                      <Badge variant="secondary" className="text-xs">
                        -{item.discountPercent}%
                      </Badge>
                    </span>
                  )}
                </div>
              </div>
              <div className="font-medium">
                {formatPrice(item.currentPrice * item.quantity)}
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Shipping */}
        {summary.shipping_cost > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Truck className="h-4 w-4" />
              Entrega
            </div>
            <div className="flex items-center justify-between text-sm">
              <div>
                <div>{shippingMethod || 'Entrega padrão'}</div>
                {summary.estimated_delivery && (
                  <div className="text-xs text-muted-foreground">
                    {summary.estimated_delivery}
                  </div>
                )}
              </div>
              <div>{formatPrice(summary.shipping_cost)}</div>
            </div>
          </div>
        )}

        {summary.shipping_cost === 0 && shippingMethod === 'pickup' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Truck className="h-4 w-4" />
              Retirada
            </div>
            <div className="flex items-center justify-between text-sm">
              <div>Retirada na loja</div>
              <div className="text-green-600 font-medium">Grátis</div>
            </div>
          </div>
        )}

        {/* Coupon */}
        {couponCode && summary.coupon_discount > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Tag className="h-4 w-4" />
                Cupom de desconto
              </div>
              <div className="flex items-center justify-between text-sm">
                <div>
                  <Badge variant="outline" className="text-xs">
                    {couponCode}
                  </Badge>
                </div>
                <div className="text-green-600 font-medium">
                  -{formatPrice(summary.coupon_discount)}
                </div>
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Totals */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatPrice(summary.subtotal)}</span>
          </div>
          
          {summary.shipping_cost > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span>Frete</span>
              <span>{formatPrice(summary.shipping_cost)}</span>
            </div>
          )}
          
          {summary.coupon_discount > 0 && (
            <div className="flex items-center justify-between text-sm text-green-600">
              <span>Desconto</span>
              <span>-{formatPrice(summary.coupon_discount)}</span>
            </div>
          )}
          
          <Separator />
          
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Total</span>
            <span>{formatPrice(summary.total)}</span>
          </div>
        </div>

        {/* Wholesale notice */}
        {items.some(item => item.isWholesale) && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-800">
              <div className="font-medium">Preço Atacado Aplicado</div>
              <div className="text-xs mt-1">
                Você está visualizando preços especiais para atacado
              </div>
            </div>
          </div>
        )}

        {/* Stock warning */}
        {items.some(item => item.stockStatus === 'low_stock') && (
          <div className="p-3 bg-yellow-50 rounded-lg">
            <div className="text-sm text-yellow-800">
              <div className="font-medium">Atenção ao Estoque</div>
              <div className="text-xs mt-1">
                Alguns itens possuem estoque limitado
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}