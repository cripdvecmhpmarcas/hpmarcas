"use client"

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Package, TrendingDown, Eye } from 'lucide-react'
import { useLowStockAlert } from './hooks/useLowStockAlert'

interface StockAlertSummaryProps {
  className?: string
  variant?: 'compact' | 'expanded'
  showActions?: boolean
}

export function StockAlertSummary({
  className,
  variant = 'compact',
  showActions = true
}: StockAlertSummaryProps) {
  const {
    lowStockProducts,
    criticalStockProducts,
    outOfStockProducts,
    totalAlert
  } = useLowStockAlert()

  // Usa o totalAlert do hook, que já exclui alertas dismissados
  // mas não é afetado pelo status de lido das notificações

  if (totalAlert === 0) {
    return (
      <Card className={`border-green-200 bg-green-50 ${className}`}>
        <CardContent className="flex items-center gap-3 p-4">
          <Package className="h-5 w-5 text-green-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900">Estoque em dia!</p>
            <p className="text-xs text-green-700">Todos os produtos estão com estoque adequado</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (variant === 'compact') {
    return (
      <Card className={`border-red-200 bg-red-50 ${className}`}>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-900">
                {totalAlert} {totalAlert === 1 ? 'produto precisa' : 'produtos precisam'} de atenção
              </p>
              <div className="flex items-center gap-2 text-xs text-red-700">
                {outOfStockProducts.length > 0 && (
                  <span>{outOfStockProducts.length} sem estoque</span>
                )}
                {criticalStockProducts.length > 0 && (
                  <span>{criticalStockProducts.length} crítico</span>
                )}
                {lowStockProducts.length > 0 && (
                  <span>{lowStockProducts.length} baixo</span>
                )}
              </div>
            </div>
          </div>
          {showActions && (
            <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
              <Eye className="h-4 w-4 mr-1" />
              Ver alertas
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`border-red-200 bg-red-50 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-900">Alertas de Estoque</h3>
          </div>
          <Badge variant="destructive">{totalAlert}</Badge>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-2xl font-bold text-red-600">{outOfStockProducts.length}</span>
            </div>
            <p className="text-xs text-red-700">Sem Estoque</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-2xl font-bold text-red-500">{criticalStockProducts.length}</span>
            </div>
            <p className="text-xs text-red-700">Crítico</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Package className="h-4 w-4 text-yellow-600" />
              <span className="text-2xl font-bold text-yellow-600">{lowStockProducts.length}</span>
            </div>
            <p className="text-xs text-red-700">Baixo</p>
          </div>
        </div>

        {showActions && (
          <Button className="w-full" variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Ver todos os alertas
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
