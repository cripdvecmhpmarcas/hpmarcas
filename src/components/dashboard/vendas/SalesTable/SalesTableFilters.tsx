'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Filter,
  RefreshCw,
  Download,
  ChevronDown,
  X,
  Search,
  Calendar
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SaleFilters,
  SALE_STATUSES,
  PAYMENT_METHODS,
  CUSTOMER_TYPES
} from '@/types/sales'

interface SalesTableFiltersProps {
  filters: SaleFilters
  onFiltersChange: (filters: Partial<SaleFilters>) => void
  onRefresh: () => void
  onExport: (format: 'csv' | 'excel') => void
  loading?: boolean
  salesCount?: number
  totalSales?: number
}

export function SalesTableFilters({
  filters,
  onFiltersChange,
  onRefresh,
  onExport,
  loading = false,
  salesCount = 0,
  totalSales = 0
}: SalesTableFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [localSearch, setLocalSearch] = useState(filters.search || '')

  const searchTimeout = React.useRef<NodeJS.Timeout | undefined>(undefined)

  // Handle search with debounce
  const handleSearchChange = (value: string) => {
    setLocalSearch(value)
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }
    searchTimeout.current = setTimeout(() => {
      onFiltersChange({ search: value })
    }, 500)
  }

  // Handle filter changes
  const handleFilterChange = (key: keyof SaleFilters, value: string | number | undefined) => {
    onFiltersChange({ [key]: value })
  }

  // Clear all filters
  const handleClearFilters = () => {
    setLocalSearch('')
    onFiltersChange({
      search: '',
      customer_type: 'all',
      payment_method: 'all',
      status: 'all',
      salesperson_name: '',
      min_total: undefined,
      max_total: undefined,
      date_from: '',
      date_to: '',
      sort_by: 'created_at',
      sort_order: 'desc'
    })
    setShowAdvancedFilters(false)
  }

  // Check if there are active filters
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (['page', 'limit', 'sort_by', 'sort_order'].includes(key)) return false
    return value && value !== 'all' && value !== ''
  })

  return (
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
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onExport('csv')}>
                  Exportar CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport('excel')}>
                  Exportar Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por cliente, ID ou vendedor..."
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
              {Object.entries(SALE_STATUSES).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.customer_type || 'all'} onValueChange={(value) => handleFilterChange('customer_type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {Object.entries(CUSTOMER_TYPES).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.payment_method || 'all'} onValueChange={(value) => handleFilterChange('payment_method', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Pagamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os métodos</SelectItem>
              {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Vendedor"
                value={filters.salesperson_name || ''}
                onChange={(e) => handleFilterChange('salesperson_name', e.target.value)}
              />

              <Input
                type="number"
                placeholder="Valor mínimo"
                value={filters.min_total || ''}
                onChange={(e) => handleFilterChange('min_total', e.target.value ? Number(e.target.value) : undefined)}
              />

              <Input
                type="number"
                placeholder="Valor máximo"
                value={filters.max_total || ''}
                onChange={(e) => handleFilterChange('max_total', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>

            {/* Date Range Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="date"
                  placeholder="Data inicial"
                  value={filters.date_from || ''}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="date"
                  placeholder="Data final"
                  value={filters.date_to || ''}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Sorting Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                value={filters.sort_by || 'created_at'}
                onValueChange={(value) => handleFilterChange('sort_by', value as SaleFilters['sort_by'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Data</SelectItem>
                  <SelectItem value="total">Valor Total</SelectItem>
                  <SelectItem value="customer_name">Nome do Cliente</SelectItem>
                  <SelectItem value="profit">Lucro</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.sort_order || 'desc'}
                onValueChange={(value) => handleFilterChange('sort_order', value as SaleFilters['sort_order'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Direção" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Crescente</SelectItem>
                  <SelectItem value="desc">Decrescente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Filter Summary and Actions */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {salesCount} de {totalSales} vendas
            </p>
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              <X className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}