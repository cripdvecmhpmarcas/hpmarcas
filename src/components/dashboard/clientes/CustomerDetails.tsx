"use client"

import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  User,
  Mail,
  Phone,
  Calendar,
  Building,
  CreditCard,
  RefreshCw,
  X,
  Star,
  ShoppingBag,
  MessageSquare,
  Home,
  TrendingUp
} from 'lucide-react'
import { 
  getCustomerStatusColor,
  getCustomerStatusLabel,
  getCustomerTypeLabel,
  formatCustomerDocument,
  formatCustomerPhone
} from '@/types/customers'
import { formatCurrency } from '@/lib/utils'
import { useCustomerDetails } from './hooks/useCustomerDetails'
import { CustomerAddresses } from './CustomerAddresses'
import { CustomerPurchases } from './CustomerPurchases'
import { CustomerReviews } from './CustomerReviews'

interface CustomerDetailsProps {
  customerId: string | null
  onClose?: () => void
  className?: string
}

export function CustomerDetails({ customerId, onClose, className }: CustomerDetailsProps) {
  const { customer, loading, error, refreshData } = useCustomerDetails(customerId)

  const getCustomerInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (loading) {
    return <CustomerDetailsSkeleton className={className} />
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <User className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar detalhes: {error}
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

  if (!customer) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Cliente não encontrado
          </h3>
          <p className="text-gray-500">
            Não foi possível encontrar os detalhes deste cliente.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com informações principais */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-gold-200">
                <AvatarFallback className="bg-gradient-to-br from-gold-400 to-gold-600 text-white font-semibold text-lg">
                  {getCustomerInitials(customer.name)}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{customer.name}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getCustomerStatusColor(customer.status)}>
                    {getCustomerStatusLabel(customer.status)}
                  </Badge>
                  <Badge variant="outline">
                    {getCustomerTypeLabel(customer.type)}
                  </Badge>
                  {!customer.is_anonymous && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Cliente Registrado
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={refreshData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              {onClose && (
                <Button variant="outline" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Informações de contato */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Contato</h4>
              {customer.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{formatCustomerPhone(customer.phone)}</span>
                </div>
              )}
              {customer.cpf_cnpj && (
                <div className="flex items-center gap-2 text-sm">
                  {customer.type === 'business' ? (
                    <Building className="h-4 w-4 text-gray-400" />
                  ) : (
                    <User className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-gray-600">
                    {formatCustomerDocument(customer.cpf_cnpj, customer.type)}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Datas</h4>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-600">Cadastro: {formatDate(customer.created_at)}</p>
                  {customer.purchase_stats?.last_purchase_date && (
                    <p className="text-gray-600">
                      Última compra: {formatDate(customer.purchase_stats.last_purchase_date)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Estatísticas de Compras</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <ShoppingBag className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-600">
                    {customer.purchase_stats?.total_orders || 0} compras
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-green-600" />
                  <span className="text-gray-600">
                    {formatCurrency(customer.purchase_stats?.total_spent || 0)} gastos
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <span className="text-gray-600">
                    {formatCurrency(customer.purchase_stats?.avg_order_value || 0)} ticket médio
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Reviews</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-600">
                    {customer.review_stats?.total_reviews || 0} reviews
                  </span>
                </div>
                {customer.review_stats && customer.review_stats.total_reviews > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-gray-600">
                      {customer.review_stats.avg_rating.toFixed(1)} média
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Produtos favoritos */}
          {customer.purchase_stats?.favorite_products && customer.purchase_stats.favorite_products.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Produtos Mais Comprados</h4>
              <div className="flex flex-wrap gap-2">
                {customer.purchase_stats.favorite_products.slice(0, 5).map((product, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {product}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Notas do cliente */}
          {customer.notes && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Observações</h4>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                {customer.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs com detalhes específicos */}
      <Tabs defaultValue="addresses" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="addresses" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Endereços
          </TabsTrigger>
          <TabsTrigger value="purchases" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Compras
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Reviews
          </TabsTrigger>
        </TabsList>

        <TabsContent value="addresses">
          <CustomerAddresses customerId={customerId} />
        </TabsContent>

        <TabsContent value="purchases">
          <CustomerPurchases customerId={customerId} />
        </TabsContent>

        <TabsContent value="reviews">
          <CustomerReviews customerId={customerId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CustomerDetailsSkeleton({ className }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div>
                <Skeleton className="h-8 w-48" />
                <div className="flex gap-2 mt-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-5 w-20" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
          
          <div>
            <Skeleton className="h-5 w-32 mb-3" />
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-20" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24" />
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}