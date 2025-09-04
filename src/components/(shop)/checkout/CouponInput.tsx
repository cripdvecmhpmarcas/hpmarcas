'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tag, X, Check, Loader2 } from 'lucide-react'
import type { CouponValidationResponse } from '@/types/checkout'

interface CouponInputProps {
  appliedCoupon?: {
    code: string
    discount: number
  } | null
  onCouponApply: (code: string) => Promise<CouponValidationResponse | null>
  onCouponRemove: () => void
  loading?: boolean
  className?: string
}

export function CouponInput({
  appliedCoupon,
  onCouponApply,
  onCouponRemove,
  loading = false,
  className
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('')
  const [applying, setApplying] = useState(false)

  const formatDiscount = (discount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(discount)
  }

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase()

    if (!code) {
      return
    }

    try {
      setApplying(true)

      const result = await onCouponApply(code)

      if (result?.valid) {
        setCouponCode('')
      }
    } catch (error) {
      console.error('Error applying coupon:', error)
    } finally {
      setApplying(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyCoupon()
    }
  }

  const handleRemoveCoupon = () => {
    onCouponRemove()
    setCouponCode('')
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Cupom de Desconto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {appliedCoupon ? (
          /* Applied coupon display */
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-green-800">
                  Cupom aplicado!
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    {appliedCoupon.code}
                  </Badge>
                  <span className="text-sm text-green-600">
                    Desconto: {formatDiscount(appliedCoupon.discount)}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveCoupon}
              className="text-green-600 hover:text-green-700 hover:bg-green-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          /* Coupon input form */
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Digite o código do cupom"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                disabled={applying || loading}
                className="uppercase"
              />
              <Button
                onClick={handleApplyCoupon}
                disabled={!couponCode.trim() || applying || loading}
                className="px-6"
              >
                {applying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Aplicar'
                )}
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              Insira o código do cupom para obter desconto no seu pedido
            </div>
          </div>
        )}

        {!appliedCoupon && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <div className="font-medium">Dica!</div>
              <div className="mt-1">
                Procure por cupons de desconto em nossas redes sociais ou newsletter
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
