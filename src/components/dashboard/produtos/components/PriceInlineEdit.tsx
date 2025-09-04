'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Check, X, Edit3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

interface PriceInlineEditProps {
  value: number
  productId: string
  priceType: 'retail_price' | 'wholesale_price'
  onUpdate: (id: string, priceType: 'retail_price' | 'wholesale_price', newPrice: number) => Promise<boolean>
  disabled?: boolean
}

export function PriceInlineEdit({
  value,
  productId,
  priceType,
  onUpdate,
  disabled = false
}: PriceInlineEditProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Inicializar valor de edição
  useEffect(() => {
    if (isEditing) {
      setEditValue(value.toString())
      // Focar e selecionar texto após o DOM atualizar
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 0)
    }
  }, [isEditing, value])

  // Cancelar edição
  const handleCancel = () => {
    setIsEditing(false)
    setEditValue('')
  }

  // Confirmar edição
  const handleConfirm = async () => {
    const numValue = parseFloat(editValue.replace(',', '.'))

    if (isNaN(numValue) || numValue < 0) {
      return // Valor inválido
    }

    if (numValue === value) {
      handleCancel()
      return // Valor não mudou
    }

    setIsLoading(true)
    const success = await onUpdate(productId, priceType, numValue)
    setIsLoading(false)

    if (success) {
      setIsEditing(false)
      setEditValue('')
    }
  }

  // Manipular teclas
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirm()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  // Manipular blur (perder foco)
  const handleBlur = () => {
    // Pequeno delay para permitir clique nos botões
    setTimeout(() => {
      if (!inputRef.current?.matches(':focus-within')) {
        handleCancel()
      }
    }, 100)
  }

  // Formatação do valor para exibição
  const formatInputValue = (val: string) => {
    // Permitir apenas números, vírgula e ponto
    return val.replace(/[^0-9,.]/g, '')
  }

  if (!isEditing) {
    return (
      <div
        className="group flex items-center justify-between min-w-[100px] hover:bg-muted/50 rounded px-2 py-1 cursor-pointer transition-colors"
        onClick={() => !disabled && setIsEditing(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (!disabled) {
              setIsEditing(true)
            }
          }
        }}
      >
        <span className="font-medium">
          {formatCurrency(value)}
        </span>
        {!disabled && (
          <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 min-w-[140px]">
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(formatInputValue(e.target.value))}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        disabled={isLoading}
        className="h-8 text-sm"
        placeholder="0,00"
      />
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-700"
          onClick={handleConfirm}
          disabled={isLoading}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-700"
          onClick={handleCancel}
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
