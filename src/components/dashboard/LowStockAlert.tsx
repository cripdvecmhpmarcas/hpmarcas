'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Package, ExternalLink } from 'lucide-react'
import { useLowStockAlert } from './hooks/useLowStockAlert'

export function LowStockAlert() {
  const { stockAlerts, loading, getStockLevel, getStockBadgeVariant, getStockBadgeText } = useLowStockAlert()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Alerta de Baixo Estoque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-16 h-6 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Alerta de Baixo Estoque
            <Badge variant="secondary" className="ml-2">
              {stockAlerts.length} produtos
            </Badge>
          </CardTitle>
          {stockAlerts.length > 0 && (
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Ver Todos
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {stockAlerts.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Todos os produtos estão com estoque adequado</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {stockAlerts.map((alert) => {
              const stockLevel = getStockLevel(alert.currentStock, alert.minStock)
              return (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">{alert.name}</h4>
                      <Badge
                        variant={getStockBadgeVariant(stockLevel)}
                        className="text-xs"
                      >
                        {getStockBadgeText(stockLevel)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>SKU: {alert.sku}</span>
                      <span>Marca: {alert.brand}</span>
                      <span>Categoria: {alert.category}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs mt-1">
                      <span className="text-red-600">
                        Estoque: {alert.currentStock}
                      </span>
                      <span className="text-muted-foreground">
                        Mínimo: {alert.minStock}
                      </span>
                      <span className="text-blue-600">
                        Necessário: +{alert.unitsNeeded}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
