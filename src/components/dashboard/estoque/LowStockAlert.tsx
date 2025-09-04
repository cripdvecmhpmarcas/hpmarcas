"use client"

import React from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertTriangle,
  X,
  Package,
  ShoppingCart,
  Eye,
  RefreshCw
} from 'lucide-react'
import { useLowStockAlert } from './hooks/useLowStockAlert'
import { getStockStatusColor, LowStockProduct } from '@/types/stock'
import { formatCurrency } from '@/lib/utils'

interface LowStockAlertProps {
  className?: string
  showDismissed?: boolean
}

export function LowStockAlert({ className, showDismissed = true }: LowStockAlertProps) {
  const {
    lowStockProducts,
    criticalStockProducts,
    outOfStockProducts,
    loading,
    error,
    totalAlert,
    refreshData,
    dismissAlert
  } = useLowStockAlert()

  if (loading) {
    return <LowStockAlertSkeleton />
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar alertas: {error}
        </AlertDescription>
      </Alert>
    )
  }

  if (totalAlert === 0) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <Package className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Todos os produtos estão com estoque adequado!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Resumo dos alertas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Alertas de Estoque
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="destructive">{totalAlert}</Badge>
            <Button variant="outline" size="sm" onClick={refreshData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{outOfStockProducts.length}</div>
              <div className="text-sm text-muted-foreground">Sem Estoque</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-700">{criticalStockProducts.length}</div>
              <div className="text-sm text-muted-foreground">Estoque Crítico</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{lowStockProducts.length}</div>
              <div className="text-sm text-muted-foreground">Estoque Baixo</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Produtos sem estoque */}
      {outOfStockProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Produtos Sem Estoque ({outOfStockProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {outOfStockProducts.map(product => (
                <ProductAlertCard
                  key={product.id}
                  product={product}
                  onDismiss={showDismissed ? dismissAlert : undefined}
                  priority="critical"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Produtos com estoque crítico */}
      {criticalStockProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Estoque Crítico ({criticalStockProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalStockProducts.map(product => (
                <ProductAlertCard
                  key={product.id}
                  product={product}
                  onDismiss={showDismissed ? dismissAlert : undefined}
                  priority="high"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Produtos com estoque baixo */}
      {lowStockProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-yellow-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Estoque Baixo ({lowStockProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockProducts.map(product => (
                <ProductAlertCard
                  key={product.id}
                  product={product}
                  onDismiss={showDismissed ? dismissAlert : undefined}
                  priority="medium"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface ProductAlertCardProps {
  product: LowStockProduct
  onDismiss?: (id: string) => void
  priority: 'critical' | 'high' | 'medium'
}

function ProductAlertCard({ product, onDismiss, priority }: ProductAlertCardProps) {
  const priorityColors = {
    critical: 'border-red-500 bg-red-50',
    high: 'border-red-400 bg-red-25',
    medium: 'border-yellow-400 bg-yellow-50'
  }

  return (
    <div className={`border rounded-lg p-4 ${priorityColors[priority]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {product.images && product.images[0] && (
              <div className="relative w-12 h-12 flex-shrink-0">
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  width={48}
                  height={48}
                  className="object-cover rounded border"
                  sizes="48px"
                />
              </div>
            )}
            <div>
              <h3 className="font-medium">{product.name}</h3>
              <p className="text-sm text-muted-foreground">
                {product.brand} • {product.sku}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Estoque Atual</div>
              <div className="font-medium">
                <Badge className={getStockStatusColor(product.stock_status)}>
                  {product.current_stock} un.
                </Badge>
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Estoque Mínimo</div>
              <div className="font-medium">{product.min_stock} un.</div>
            </div>
            <div>
              <div className="text-muted-foreground">Necessário</div>
              <div className="font-medium text-red-600">+{product.units_needed} un.</div>
            </div>
            <div>
              <div className="text-muted-foreground">Valor Unitário</div>
              <div className="font-medium">{formatCurrency(product.retail_price)}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => window.location.href = `/dashboard/estoque?tab=movements&product=${product.id}`}
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              Reabastecer
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => window.location.href = `/dashboard/produtos/${product.id}`}
            >
              <Eye className="h-4 w-4 mr-1" />
              Ver Produto
            </Button>
          </div>
        </div>

        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDismiss(product.id)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

function LowStockAlertSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-8 w-12 mx-auto mb-2" />
                <Skeleton className="h-4 w-20 mx-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Skeleton className="w-12 h-12 rounded" />
                        <div>
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, k) => (
                          <div key={k}>
                            <Skeleton className="h-3 w-16 mb-1" />
                            <Skeleton className="h-4 w-12" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}