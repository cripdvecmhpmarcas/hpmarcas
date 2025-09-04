"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ShoppingBag, 
  Calendar, 
  CreditCard, 
  Package, 
  RefreshCw,
  MoreHorizontal,
  Receipt,
  TrendingUp
} from 'lucide-react'
import { useCustomerPurchases } from './hooks/useCustomerPurchases'
import { formatCurrency } from '@/lib/utils'

interface CustomerPurchasesProps {
  customerId: string | null
  className?: string
}

export function CustomerPurchases({ customerId, className }: CustomerPurchasesProps) {
  const { 
    purchases, 
    loading, 
    error, 
    refreshData, 
    totalPurchases, 
    totalSpent,
    loadMore,
    hasMore 
  } = useCustomerPurchases(customerId)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    const colors = {
      completed: 'text-green-600 bg-green-100',
      pending: 'text-yellow-600 bg-yellow-100',
      cancelled: 'text-red-600 bg-red-100',
      processing: 'text-blue-600 bg-blue-100'
    }
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100'
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      completed: 'Concluída',
      pending: 'Pendente',
      cancelled: 'Cancelada',
      processing: 'Processando'
    }
    return labels[status as keyof typeof labels] || status
  }

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      cash: 'Dinheiro',
      credit_card: 'Cartão de Crédito',
      debit_card: 'Cartão de Débito',
      pix: 'PIX',
      bank_transfer: 'Transferência',
      check: 'Cheque'
    }
    return labels[method as keyof typeof labels] || method
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <ShoppingBag className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar compras: {error}
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            className="ml-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Estatísticas de Compras */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingBag className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{totalPurchases}</p>
                <p className="text-sm text-muted-foreground">Total de Compras</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalSpent)}</p>
                <p className="text-sm text-muted-foreground">Total Gasto</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Receipt className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {totalPurchases > 0 ? formatCurrency(totalSpent / totalPurchases) : formatCurrency(0)}
                </p>
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Compras */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Histórico de Compras</h3>
          <Button variant="outline" size="sm" onClick={refreshData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {loading && purchases.length === 0 ? (
          <CustomerPurchasesSkeleton />
        ) : purchases.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma compra realizada
              </h3>
              <p className="text-gray-500">
                Este cliente ainda não realizou compras.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {purchases.map((purchase) => (
                <Card key={purchase.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Receipt className="h-4 w-4" />
                          Pedido #{purchase.id.slice(-8).toUpperCase()}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDate(purchase.sale_date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(purchase.total)}
                        </p>
                        <Badge className={getStatusColor(purchase.status)}>
                          {getStatusLabel(purchase.status)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="text-muted-foreground">Itens:</span>
                        <span className="font-medium">{purchase.items_count}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gray-400" />
                        <span className="text-muted-foreground">Pagamento:</span>
                        <span className="font-medium">
                          {getPaymentMethodLabel(purchase.payment_method)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-muted-foreground">Data:</span>
                        <span className="font-medium">
                          {new Date(purchase.sale_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-gray-400" />
                        <span className="text-muted-foreground">Status:</span>
                        <span className="font-medium">
                          {getStatusLabel(purchase.status)}
                        </span>
                      </div>
                    </div>

                    {/* Itens da Compra */}
                    {purchase.items.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-sm text-gray-700 mb-3">
                          Itens ({purchase.items_count})
                        </h4>
                        <div className="space-y-2">
                          {purchase.items.slice(0, 3).map((item) => (
                            <div key={item.id} className="flex justify-between items-center text-sm">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{item.product_name}</p>
                                <p className="text-gray-500 text-xs">SKU: {item.product_sku}</p>
                              </div>
                              <div className="text-right ml-4">
                                <p className="font-medium">
                                  {item.quantity}x {formatCurrency(item.unit_price)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  = {formatCurrency(item.total_price)}
                                </p>
                              </div>
                            </div>
                          ))}
                          {purchase.items.length > 3 && (
                            <p className="text-xs text-gray-500 pt-2">
                              + {purchase.items.length - 3} item(s) adicional(is)
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loading}
                  className="min-w-[150px]"
                >
                  {loading ? (
                    <>
                      <MoreHorizontal className="h-4 w-4 mr-2 animate-pulse" />
                      Carregando...
                    </>
                  ) : (
                    <>
                      <MoreHorizontal className="h-4 w-4 mr-2" />
                      Carregar Mais
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function CustomerPurchasesSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24 mt-1" />
              </div>
              <div className="text-right">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-5 w-16 mt-1" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
            <div className="border-t pt-4">
              <Skeleton className="h-4 w-20 mb-3" />
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, k) => (
                  <div key={k} className="flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}