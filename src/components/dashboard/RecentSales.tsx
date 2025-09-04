'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShoppingCart, ExternalLink, Clock, User, CreditCard, Banknote, Smartphone, Building2, FileText } from 'lucide-react'
import { useRecentSales } from './hooks/useRecentSales'

export function RecentSales() {
  const { recentSales, loading, formatCurrency, formatDate, getPaymentMethodLabel } = useRecentSales()

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash':
      case 'dinheiro':
        return Banknote
      case 'card':
      case 'cartão':
        return CreditCard
      case 'pix':
        return Smartphone
      case 'transfer':
      case 'transferência':
        return Building2
      case 'check':
      case 'cheque':
        return FileText
      default:
        return CreditCard
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'concluída':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
            Concluída
          </Badge>
        )
      case 'pending':
      case 'pendente':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Pendente
          </Badge>
        )
      case 'cancelled':
      case 'cancelada':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-100">
            Cancelada
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Vendas Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-20 h-6 bg-gray-200 rounded"></div>
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
            <ShoppingCart className="h-5 w-5" />
            Vendas Recentes
            <Badge variant="secondary" className="ml-2">
              {recentSales.length} vendas
            </Badge>
          </CardTitle>
          {recentSales.length > 0 && (
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Ver Todas
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {recentSales.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <div className="text-center">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma venda recente encontrada</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentSales.map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm truncate">{sale.customerName}</span>
                    {getStatusBadge(sale.status)}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(sale.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      {(() => {
                        const IconComponent = getPaymentMethodIcon(sale.paymentMethod)
                        return <IconComponent className="h-3 w-3" />
                      })()} 
                      {getPaymentMethodLabel(sale.paymentMethod)}
                    </span>
                    <span>{sale.itemCount} {sale.itemCount === 1 ? 'item' : 'itens'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <div className="text-right">
                    <div className="font-bold text-lg">
                      {formatCurrency(sale.total)}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}