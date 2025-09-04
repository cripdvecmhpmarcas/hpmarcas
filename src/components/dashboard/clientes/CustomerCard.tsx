"use client"

import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  ShoppingBag,
  Star,
  Eye,
  Building,
  CreditCard
} from 'lucide-react'
import { 
  CustomerWithDetails,
  getCustomerStatusColor,
  getCustomerStatusLabel,
  getCustomerTypeLabel,
  formatCustomerDocument,
  formatCustomerPhone
} from '@/types/customers'
import { formatCurrency } from '@/lib/utils'

interface CustomerCardProps {
  customer: CustomerWithDetails
  onViewDetails?: (customerId: string) => void
  className?: string
}

export function CustomerCard({ customer, onViewDetails, className }: CustomerCardProps) {
  const getCustomerInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getDefaultAddress = () => {
    return customer.addresses?.find(addr => addr.is_default) || customer.addresses?.[0]
  }

  const defaultAddress = getDefaultAddress()

  return (
    <Card className={`h-full transition-all duration-200 hover:shadow-md hover:border-gold-200 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-12 w-12 ring-2 ring-gold-200">
              <AvatarFallback className="bg-gradient-to-br from-gold-400 to-gold-600 text-white font-semibold">
                {getCustomerInitials(customer.name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-gray-900 truncate">
                {customer.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getCustomerStatusColor(customer.status)}>
                  {getCustomerStatusLabel(customer.status)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {getCustomerTypeLabel(customer.type)}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informações de Contato */}
        <div className="space-y-2">
          {customer.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="truncate">{customer.email}</span>
            </div>
          )}
          
          {customer.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4 text-gray-400" />
              <span>{formatCustomerPhone(customer.phone)}</span>
            </div>
          )}

          {customer.cpf_cnpj && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {customer.type === 'business' ? (
                <Building className="h-4 w-4 text-gray-400" />
              ) : (
                <User className="h-4 w-4 text-gray-400" />
              )}
              <span>{formatCustomerDocument(customer.cpf_cnpj, customer.type)}</span>
            </div>
          )}

          {defaultAddress && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="truncate">
                {defaultAddress.city}, {defaultAddress.state}
              </span>
            </div>
          )}
        </div>

        {/* Estatísticas de Compras */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-gold-600" />
              <span className="text-sm font-medium text-gray-700">Compras</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {customer.purchase_stats?.total_orders || 0}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Total Gasto</span>
            </div>
            <span className="text-sm font-semibold text-green-600">
              {formatCurrency(customer.purchase_stats?.total_spent || 0)}
            </span>
          </div>

          {customer.review_stats && customer.review_stats.total_reviews > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">Reviews</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-gray-900">
                  {customer.review_stats.avg_rating.toFixed(1)}
                </span>
                <span className="text-xs text-gray-500">
                  ({customer.review_stats.total_reviews})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Informações de Data */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Cadastro: {formatDate(customer.created_at)}</span>
          </div>
          <span>
            Última compra: {formatDate(customer.purchase_stats?.last_purchase_date || null)}
          </span>
        </div>

        {/* Ação */}
        <div className="pt-2">
          <Button 
            onClick={() => onViewDetails?.(customer.id)}
            variant="outline" 
            size="sm" 
            className="w-full hover:bg-gold-50 hover:border-gold-300"
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}