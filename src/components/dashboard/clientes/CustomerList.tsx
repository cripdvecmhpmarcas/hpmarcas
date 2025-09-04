"use client"

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Search,
  Filter,
  RefreshCw,
  Users,
  UserCheck,
  UserX,
  Building,
  User as UserIcon,
  ChevronDown,
  X,
  MoreHorizontal
} from 'lucide-react'
import { CustomerCard } from './CustomerCard'
import { useCustomers } from './hooks/useCustomers'
import { CustomerFilters, CUSTOMER_STATUSES, CUSTOMER_TYPES } from '@/types/customers'

interface CustomerListProps {
  onCustomerSelect?: (customerId: string) => void
  className?: string
}

export function CustomerList({ onCustomerSelect, className }: CustomerListProps) {
  const {
    customers,
    loading,
    error,
    total,
    hasMore,
    filters,
    setFilters,
    refreshData,
    loadMore,
    resetFilters
  } = useCustomers()

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [localSearch, setLocalSearch] = useState(filters.search || '')

  const searchTimeout = React.useRef<NodeJS.Timeout | undefined>(undefined)
  const handleSearchChange = (value: string) => {
    setLocalSearch(value)
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }
    searchTimeout.current = setTimeout(() => {
      setFilters({ search: value })
    }, 500)
  }

  // Statistics
  const stats = useMemo(() => {
    const activeCount = customers.filter(c => c.status === 'active').length
    const inactiveCount = customers.filter(c => c.status === 'inactive').length
    const businessCount = customers.filter(c => c.type === 'business').length
    const individualCount = customers.filter(c => c.type === 'individual').length

    return {
      total: customers.length,
      active: activeCount,
      inactive: inactiveCount,
      business: businessCount,
      individual: individualCount
    }
  }, [customers])

  const handleFilterChange = (key: keyof CustomerFilters, value: string | number | undefined) => {
    setFilters({ [key]: value })
  }

  const handleClearFilters = () => {
    setLocalSearch('')
    resetFilters()
    setShowAdvancedFilters(false)
  }

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'page' || key === 'limit' || key === 'sort_by' || key === 'sort_order') return false
    return value && value !== 'all' && value !== ''
  })

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <X className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar clientes: {error}
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
      {/* Header com Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
                <p className="text-xs text-muted-foreground">Inativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-600">{stats.business}</p>
                <p className="text-xs text-muted-foreground">Empresas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-orange-600">{stats.individual}</p>
                <p className="text-xs text-muted-foreground">Pessoas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros e Busca
            </CardTitle>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Badge variant="secondary" className="bg-gold-100 text-gold-800">
                  Filtros ativos
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`}
                />
                {showAdvancedFilters ? 'Menos filtros' : 'Mais filtros'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filtros Básicos */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, email ou documento..."
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.entries(CUSTOMER_STATUSES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.type || 'all'} onValueChange={(value) => handleFilterChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {Object.entries(CUSTOMER_TYPES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={`${filters.sort_by || 'name'}_${filters.sort_order || 'asc'}`}
              onValueChange={(value) => {
                const [sortBy, sortOrder] = value.split('_')
                setFilters({
                  sort_by: sortBy as CustomerFilters['sort_by'],
                  sort_order: sortOrder as CustomerFilters['sort_order']
                })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
                <SelectItem value="name_desc">Nome (Z-A)</SelectItem>
                <SelectItem value="created_at_desc">Mais recentes</SelectItem>
                <SelectItem value="created_at_asc">Mais antigos</SelectItem>
                <SelectItem value="total_spent_desc">Maior valor gasto</SelectItem>
                <SelectItem value="total_spent_asc">Menor valor gasto</SelectItem>
                <SelectItem value="last_purchase_desc">Última compra</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtros Avançados */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <Input
                placeholder="Cidade"
                value={filters.city || ''}
                onChange={(e) => handleFilterChange('city', e.target.value)}
              />

              <Input
                type="number"
                placeholder="Valor mínimo gasto"
                value={filters.min_spent || ''}
                onChange={(e) => handleFilterChange('min_spent', e.target.value ? Number(e.target.value) : undefined)}
              />

              <Input
                type="number"
                placeholder="Valor máximo gasto"
                value={filters.max_spent || ''}
                onChange={(e) => handleFilterChange('max_spent', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          )}

          {/* Ações dos Filtros */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {customers.length} de {total} clientes
              </p>
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                <X className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      <div className="space-y-4">
        {loading && customers.length === 0 ? (
          <CustomerListSkeleton />
        ) : customers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum cliente encontrado
              </h3>
              <p className="text-gray-500 mb-4">
                {hasActiveFilters
                  ? 'Tente ajustar os filtros para encontrar clientes.'
                  : 'Ainda não há clientes cadastrados no sistema.'
                }
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={handleClearFilters}>
                  Limpar Filtros
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customers.map((customer) => (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                  onViewDetails={onCustomerSelect}
                />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center pt-6">
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

function CustomerListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
