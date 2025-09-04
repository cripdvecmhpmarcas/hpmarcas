'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatCurrency } from '@/lib/utils'
import type { ProductWithVolumes } from '@/types/products'

interface BulkPriceEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedProducts: ProductWithVolumes[]
  onUpdate: (ids: string[], priceType: 'retail_price' | 'wholesale_price', newPrice: number) => Promise<boolean>
}

export function BulkPriceEditModal({
  open,
  onOpenChange,
  selectedProducts,
  onUpdate
}: BulkPriceEditModalProps) {
  const [priceType, setPriceType] = useState<'retail_price' | 'wholesale_price'>('retail_price')
  const [newPrice, setNewPrice] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    const numPrice = parseFloat(newPrice.replace(',', '.'))

    if (isNaN(numPrice) || numPrice < 0) {
      return
    }

    setIsLoading(true)
    const productIds = selectedProducts.map(p => p.id)
    const success = await onUpdate(productIds, priceType, numPrice)
    setIsLoading(false)

    if (success) {
      onOpenChange(false)
      setNewPrice('')
    }
  }

  const formatInputValue = (val: string) => {
    return val.replace(/[^0-9,.]/g, '')
  }

  const priceTypeLabel = priceType === 'retail_price' ? 'Varejo' : 'Atacado'
  const currentPriceKey = priceType

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl break-words">
            Editar Preços em Massa
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 pr-2"
          style={{ maxHeight: 'calc(90vh - 120px)' }}>
          {/* Tipo de Preço */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tipo de Preço</Label>
            <RadioGroup
              value={priceType}
              onValueChange={(value) => setPriceType(value as typeof priceType)}
              className="flex flex-col sm:flex-row gap-3 sm:gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="retail_price" id="retail" />
                <Label htmlFor="retail" className="text-sm">Preço Varejo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="wholesale_price" id="wholesale" />
                <Label htmlFor="wholesale" className="text-sm">Preço Atacado</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Novo Preço */}
          <div className="space-y-2">
            <Label htmlFor="price" className="text-sm font-medium">
              Novo Preço ({priceTypeLabel})
            </Label>
            <Input
              id="price"
              value={newPrice}
              onChange={(e) => setNewPrice(formatInputValue(e.target.value))}
              placeholder="0,00"
              className="text-base sm:text-lg font-medium h-10 sm:h-11"
            />
          </div>

          {/* Preview dos Produtos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Produtos Selecionados</Label>
              <Badge variant="secondary" className="text-xs px-2 py-1">
                {selectedProducts.length} produto(s)
              </Badge>
            </div>

            <ScrollArea className="h-32 sm:h-48 border rounded-lg">
              <div className="p-2 sm:p-4 space-y-2">
                {selectedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between py-2 px-2 sm:px-3 bg-muted/30 rounded-lg space-y-1 sm:space-y-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        SKU: {product.sku} | {product.brand}
                      </p>
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {priceTypeLabel} Atual
                      </p>
                      <p className="font-medium text-sm">
                        {formatCurrency(product[currentPriceKey])}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Resumo da Operação */}
          {newPrice && !isNaN(parseFloat(newPrice.replace(',', '.'))) && (
            <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2 text-sm sm:text-base break-words">
                Resumo da Operação
              </h4>
              <div className="space-y-1 text-xs sm:text-sm text-blue-800">
                <p className="break-words">• {selectedProducts.length} produto(s) serão atualizados</p>
                <p className="break-words">• Tipo de preço: <strong>{priceTypeLabel}</strong></p>
                <p className="break-words">• Novo valor: <strong>{formatCurrency(parseFloat(newPrice.replace(',', '.')))}</strong></p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 flex flex-col-reverse sm:flex-row gap-3 sm:gap-2 pt-4 border-t mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full sm:w-auto min-h-[40px] text-sm"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isLoading ||
              !newPrice ||
              isNaN(parseFloat(newPrice.replace(',', '.'))) ||
              parseFloat(newPrice.replace(',', '.')) < 0 ||
              selectedProducts.length === 0
            }
            className="w-full sm:w-auto min-h-[40px] text-sm"
          >
            <span className="truncate">
              {isLoading ? 'Atualizando...' : `Atualizar ${selectedProducts.length} Produto(s)`}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
