'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Truck, Package, Clock, Calculator } from 'lucide-react'
import type { ShippingOption, CustomerAddress } from '@/types/checkout'
import { toast } from 'sonner'

interface ShippingCalculatorProps {
  selectedAddress?: CustomerAddress | null
  selectedOption?: ShippingOption | null
  onOptionSelect: (option: ShippingOption) => void
  calculateShipping: (destinationZip: string) => Promise<ShippingOption[]>
  className?: string
}

export function ShippingCalculator({
  selectedAddress,
  selectedOption,
  onOptionSelect,
  calculateShipping,
  className
}: ShippingCalculatorProps) {
  const [options, setOptions] = useState<ShippingOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatPrice = (price: number) => {
    if (price === 0) return 'Grátis'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const handleCalculateShipping = useCallback(async () => {
    if (!selectedAddress) {
      toast.error('Selecione um endereço primeiro')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const shippingOptions = await calculateShipping(selectedAddress.zip_code)

      if (shippingOptions.length === 0) {
        setError('Não foi possível calcular o frete para este endereço')
        toast.error('Não foi possível calcular o frete')
      } else {
        setOptions(shippingOptions)

        if (!selectedOption) {
          onOptionSelect(shippingOptions[0])
        }
      }
    } catch (err) {
      console.error('Error calculating shipping:', err)
      setError('Erro ao calcular frete')
      toast.error('Erro ao calcular frete')
    } finally {
      setLoading(false)
    }
  }, [selectedAddress, calculateShipping, selectedOption, onOptionSelect])

  useEffect(() => {
    if (selectedAddress) {
      handleCalculateShipping()
    } else {
      setOptions([])
      setError(null)
    }
  }, [selectedAddress, handleCalculateShipping]) // Include all dependencies

  const getMethodIcon = (method: string, optionName: string) => {
    if (method === 'pickup') {
      return <Package className="h-4 w-4 text-green-600" />
    }
    if (method.includes('express') || optionName.toLowerCase().includes('sedex') || optionName.toLowerCase().includes('express')) {
      return <Package className="h-4 w-4 text-blue-600" />
    }
    return <Truck className="h-4 w-4 text-gray-600" />
  }

  const getMethodColor = (method: string, optionName: string) => {
    if (method === 'pickup') {
      return 'border-green-200 bg-green-50'
    }
    if (method.includes('express') || optionName.toLowerCase().includes('sedex') || optionName.toLowerCase().includes('express')) {
      return 'border-blue-200 bg-blue-50'
    }
    return 'border-gray-200 bg-gray-50'
  }

  if (!selectedAddress) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <div className="text-muted-foreground">
            Selecione um endereço para calcular o frete
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Opções de Entrega
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Address info */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-sm font-medium">Entrega para:</div>
          <div className="text-sm text-muted-foreground">
            {selectedAddress.city}/{selectedAddress.state} - {selectedAddress.zip_code}
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm text-red-800">{error}</div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={handleCalculateShipping}
            >
              <Calculator className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        )}

        {!loading && !error && options.length === 0 && (
          <div className="text-center py-8">
            <Button onClick={handleCalculateShipping}>
              <Calculator className="h-4 w-4 mr-2" />
              Calcular Frete
            </Button>
          </div>
        )}

        {options.length > 0 && !loading && (
          <RadioGroup
            value={selectedOption?.method || ''}
            onValueChange={(value) => {
              const option = options.find(opt => opt.method === value)
              if (option) {
                onOptionSelect(option)
              }
            }}
          >
            {options.map((option) => (
              <div key={option.method} className={`flex items-start space-x-3 p-4 border rounded-lg ${getMethodColor(option.method, option.name)}`}>
                <RadioGroupItem value={option.method} id={option.method} className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor={option.method} className="cursor-pointer">
                    <div className="flex items-center gap-2 font-medium">
                      {getMethodIcon(option.method, option.name)}
                      {option.name}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {option.delivery_time_description}
                      </div>
                      {option.carrier && (
                        <div className="text-xs mt-1">
                          via {option.carrier}
                        </div>
                      )}
                    </div>
                  </Label>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">
                    {formatPrice(option.price)}
                  </div>
                  {option.method === 'pickup' && (
                    <div className="text-xs text-green-600 mt-1">
                      Economia no frete
                    </div>
                  )}
                </div>
              </div>
            ))}
          </RadioGroup>
        )}

        {options.length > 0 && !loading && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCalculateShipping}
            className="w-full"
          >
            <Calculator className="h-4 w-4 mr-2" />
            Recalcular Frete
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
