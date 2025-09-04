"use client"

import React, { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Search,
  Filter,
  ChevronDown,
  X,
  CalendarIcon,
  DollarSign,
  Users,
  CreditCard,
  Settings2,
  Store
} from 'lucide-react'
import { SaleFilters, PERIOD_OPTIONS, PAYMENT_METHODS, SALE_STATUSES, CUSTOMER_TYPES, ORDER_SOURCES } from '@/types/sales'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface SalesFiltersProps {
  filters: SaleFilters
  onFiltersChange: (filters: Partial<SaleFilters>) => void
  onClearFilters: () => void
  className?: string
  compact?: boolean
  showAdvanced?: boolean
}

export function SalesFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  className,
  compact = false,
  showAdvanced: showAdvancedProp = false
}: SalesFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(showAdvancedProp)
  const [localSearch, setLocalSearch] = useState(filters.search || '')
  const [selectedPeriod, setSelectedPeriod] = useState('30')
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    filters.date_from ? new Date(filters.date_from) : undefined
  )
  const [dateTo, setDateTo] = useState<Date | undefined>(
    filters.date_to ? new Date(filters.date_to) : undefined
  )

  const searchTimeout = useRef<NodeJS.Timeout | undefined>(undefined)

  const handleSearchChange = (value: string) => {
    setLocalSearch(value)
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }
    searchTimeout.current = setTimeout(() => {
      onFiltersChange({ search: value })
    }, 500)
  }

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period)
    if (period !== 'custom') {
      const days = parseInt(period)
      const now = new Date()
      const startDate = new Date()
      startDate.setDate(now.getDate() - days)

      onFiltersChange({
        date_from: startDate.toISOString().split('T')[0],
        date_to: now.toISOString().split('T')[0]
      })
      setDateFrom(startDate)
      setDateTo(now)
    }
  }

  const handleCustomDateChange = (from?: Date, to?: Date) => {
    setDateFrom(from)
    setDateTo(to)
    if (from && to) {
      onFiltersChange({
        date_from: from.toISOString().split('T')[0],
        date_to: to.toISOString().split('T')[0]
      })
    }
  }

  const handleFilterChange = (key: keyof SaleFilters, value: string | number | undefined) => {
    onFiltersChange({ [key]: value })
  }

  const handleClearFilters = () => {
    setLocalSearch('')
    setSelectedPeriod('30')
    setDateFrom(undefined)
    setDateTo(undefined)
    setShowAdvancedFilters(false)
    onClearFilters()
  }

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'page' || key === 'limit' || key === 'sort_by' || key === 'sort_order') return false
    return value && value !== 'all' && value !== ''
  })

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 flex-wrap max-w-6xl mx-auto", className)}>
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar vendas..."
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={handleClearFilters}>
            <X className="h-4 w-4" />
            <span className="sr-only">Limpar filtros</span>
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className={cn("max-w-6xl mx-auto", className)}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
            {hasActiveFilters && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {Object.entries(filters).filter(([key, value]) => {
                  if (['page', 'limit', 'sort_by', 'sort_order'].includes(key)) return false
                  return value && value !== 'all' && value !== ''
                }).length}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings2 className="h-4 w-4 mr-2" />
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${showAdvancedFilters ? 'rotate-180' : ''}`}
                  />
                  <span className="ml-1">{showAdvancedFilters ? 'Básico' : 'Avançado'}</span>
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                <X className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Filtros Essenciais - Sempre Visíveis */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Busca - Span completo em mobile e 2 colunas em sm+ */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cliente, ID, vendedor..."
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 w-full"
            />
          </div>

          {/* Período */}
          <div className="w-full">
            <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-full">
                <CalendarIcon className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="w-full">
            <Select
              value={filters.status || 'all'}
              onValueChange={(value: string) => handleFilterChange('status', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.entries(SALE_STATUSES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Seletor de Data Customizada */}
        {selectedPeriod === 'custom' && (
          <div className="w-full max-w-md">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom && dateTo
                    ? `${format(dateFrom, 'dd/MM', { locale: ptBR })} - ${format(dateTo, 'dd/MM', { locale: ptBR })}`
                    : 'Selecionar período customizado'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-4 space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-2">Data de início</div>
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={(date) => handleCustomDateChange(date, dateTo)}
                      disabled={(date) => date > new Date() || (dateTo ? date > dateTo : false)}
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">Data final</div>
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={(date) => handleCustomDateChange(dateFrom, date)}
                      disabled={(date) => date > new Date() || (dateFrom ? date < dateFrom : false)}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Filtros Avançados - Collapsible */}
        <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
          <CollapsibleContent className="space-y-4">
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Filtros Avançados
              </h4>
              
              {/* Grid de Filtros Avançados */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Tipo de Cliente */}
                <div className="w-full">
                  <Select
                    value={filters.customer_type || 'all'}
                    onValueChange={(value: string) => handleFilterChange('customer_type', value)}
                  >
                    <SelectTrigger className="w-full">
                      <Users className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Tipo de cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      {Object.entries(CUSTOMER_TYPES).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Método de Pagamento */}
                <div className="w-full">
                  <Select
                    value={filters.payment_method || 'all'}
                    onValueChange={(value: string) => handleFilterChange('payment_method', value)}
                  >
                    <SelectTrigger className="w-full">
                      <CreditCard className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Método pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os métodos</SelectItem>
                      {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Origem do Pedido */}
                <div className="w-full">
                  <Select
                    value={filters.order_source || 'all'}
                    onValueChange={(value: string) => handleFilterChange('order_source', value)}
                  >
                    <SelectTrigger className="w-full">
                      <Store className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Origem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as origens</SelectItem>
                      {Object.entries(ORDER_SOURCES).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Vendedor */}
                <div className="w-full">
                  <Input
                    placeholder="Nome do vendedor"
                    value={filters.salesperson_name || ''}
                    onChange={(e) => handleFilterChange('salesperson_name', e.target.value)}
                  />
                </div>

                {/* Valores - Agrupados em uma linha */}
                <div className="sm:col-span-2 lg:col-span-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Valor Mínimo */}
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        placeholder="Valor mínimo"
                        value={filters.min_total || ''}
                        onChange={(e) => handleFilterChange('min_total', e.target.value ? Number(e.target.value) : undefined)}
                        className="pl-10"
                      />
                    </div>

                    {/* Valor Máximo */}
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        placeholder="Valor máximo"
                        value={filters.max_total || ''}
                        onChange={(e) => handleFilterChange('max_total', e.target.value ? Number(e.target.value) : undefined)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Ordenação */}
                <div className="w-full">
                  <Select
                    value={`${filters.sort_by || 'created_at'}_${filters.sort_order || 'desc'}`}
                    onValueChange={(value: string) => {
                      const [sortBy, sortOrder] = value.split('_')
                      onFiltersChange({
                        sort_by: sortBy as SaleFilters['sort_by'],
                        sort_order: sortOrder as SaleFilters['sort_order']
                      })
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at_desc">Mais recentes</SelectItem>
                      <SelectItem value="created_at_asc">Mais antigas</SelectItem>
                      <SelectItem value="total_desc">Maior valor</SelectItem>
                      <SelectItem value="total_asc">Menor valor</SelectItem>
                      <SelectItem value="profit_desc">Maior lucro</SelectItem>
                      <SelectItem value="profit_asc">Menor lucro</SelectItem>
                      <SelectItem value="customer_name_asc">Cliente (A-Z)</SelectItem>
                      <SelectItem value="customer_name_desc">Cliente (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Resumo dos Filtros Ativos */}
        {hasActiveFilters && (
          <div className="border-t pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Filtros aplicados:</span>
              {filters.search && (
                <Badge variant="outline" className="text-xs">
                  Busca: {filters.search.length > 20 ? `${filters.search.slice(0, 20)}...` : filters.search}
                </Badge>
              )}
              {filters.customer_type && filters.customer_type !== 'all' && (
                <Badge variant="outline" className="text-xs">
                  {CUSTOMER_TYPES[filters.customer_type as keyof typeof CUSTOMER_TYPES]}
                </Badge>
              )}
              {filters.status && filters.status !== 'all' && (
                <Badge variant="outline" className="text-xs">
                  {SALE_STATUSES[filters.status as keyof typeof SALE_STATUSES]}
                </Badge>
              )}
              {filters.payment_method && filters.payment_method !== 'all' && (
                <Badge variant="outline" className="text-xs">
                  {PAYMENT_METHODS[filters.payment_method as keyof typeof PAYMENT_METHODS]}
                </Badge>
              )}
              {filters.order_source && filters.order_source !== 'all' && (
                <Badge variant="outline" className="text-xs">
                  {ORDER_SOURCES[filters.order_source as keyof typeof ORDER_SOURCES]}
                </Badge>
              )}
              {(filters.min_total || filters.max_total) && (
                <Badge variant="outline" className="text-xs">
                  Valor: {filters.min_total ? `R$ ${filters.min_total}` : '0'} - {filters.max_total ? `R$ ${filters.max_total}` : '∞'}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
