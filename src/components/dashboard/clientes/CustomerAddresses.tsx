"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MapPin, Home, Building, Star, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCustomerAddresses } from './hooks/useCustomerAddresses'

interface CustomerAddressesProps {
  customerId: string | null
  className?: string
}

export function CustomerAddresses({ customerId, className }: CustomerAddressesProps) {
  const { addresses, loading, error, refreshData, defaultAddress } = useCustomerAddresses(customerId)

  if (loading) {
    return <CustomerAddressesSkeleton className={className} />
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <MapPin className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar endereços: {error}
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

  if (addresses.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum endereço cadastrado
          </h3>
          <p className="text-gray-500">
            Este cliente ainda não possui endereços cadastrados.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Endereços ({addresses.length})</h3>
        <Button variant="outline" size="sm" onClick={refreshData}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((address) => (
          <Card key={address.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {address.label === 'comercial' ? (
                    <Building className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Home className="h-5 w-5 text-green-600" />
                  )}
                  <CardTitle className="text-base">{address.label}</CardTitle>
                </div>
                {address.is_default && (
                  <Badge variant="secondary" className="bg-gold-100 text-gold-800">
                    <Star className="h-3 w-3 mr-1" />
                    Padrão
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div>
                <p className="font-medium text-gray-900">{address.name}</p>
                <div className="text-sm text-gray-600 space-y-1 mt-2">
                  <p>
                    {address.street}, {address.number}
                    {address.complement && `, ${address.complement}`}
                  </p>
                  <p>{address.neighborhood}</p>
                  <p>
                    {address.city} - {address.state}
                  </p>
                  <p>CEP: {address.zip_code}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
                <span>
                  Cadastrado: {new Date(address.created_at).toLocaleDateString('pt-BR')}
                </span>
                {address.updated_at !== address.created_at && (
                  <span>
                    Atualizado: {new Date(address.updated_at).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {defaultAddress && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-blue-900">
              <Star className="h-4 w-4" />
              Endereço Principal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-blue-800">
              <p className="font-medium">{defaultAddress.name}</p>
              <p>
                {defaultAddress.street}, {defaultAddress.number}
                {defaultAddress.complement && `, ${defaultAddress.complement}`}
              </p>
              <p>
                {defaultAddress.neighborhood} - {defaultAddress.city}/{defaultAddress.state}
              </p>
              <p>CEP: {defaultAddress.zip_code}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function CustomerAddressesSkeleton({ className }: { className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-8" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="flex justify-between pt-3 border-t">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}