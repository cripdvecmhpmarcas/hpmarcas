'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Download,
  Upload,
  Bookmark,
  Tag,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Sliders
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useProductFilters } from './hooks/useProductFilters'
import { ProductFilters as IProductFilters, PRODUCT_CATEGORIES } from '@/types/products'
import { CategorySelect } from '@/components/ui/category-select'
import { useCategories } from '@/hooks/useCategories'
import { formatCurrency } from '@/lib/pdv-utils'

interface ProductFiltersProps {
  onFiltersChange?: (filters: IProductFilters) => void
  className?: string
  compact?: boolean
}

export function ProductFilters({
  onFiltersChange,
  className = '',
  compact = false
}: ProductFiltersProps) {
  const {
    filters,
    availableBrands,
    priceRange,
    loading,
    showAdvanced,
    setFilters,
    resetFilters,
    clearFilter,
    setShowAdvanced,
    applyQuickFilter,
    getActiveFiltersCount,
    hasActiveFilters,
    exportFiltersState,
    importFiltersState
  } = useProductFilters(onFiltersChange)

  const { getCategoryPath } = useCategories()

  const [savedFilters, setSavedFilters] = useState<Array<{ name: string, state: string }>>([])
  const [saveFilterName, setSaveFilterName] = useState('')

  const handleSaveFilter = () => {
    if (saveFilterName.trim() && hasActiveFilters()) {
      const newFilter = {
        name: saveFilterName.trim(),
        state: exportFiltersState()
      }
      const updated = [...savedFilters, newFilter]
      setSavedFilters(updated)
      localStorage.setItem('savedProductFilters', JSON.stringify(updated))
      setSaveFilterName('')
    }
  }

  const handleLoadFilter = (state: string) => {
    importFiltersState(state)
  }

  const handleRemoveSavedFilter = (index: number) => {
    const updated = savedFilters.filter((_, i) => i !== index)
    setSavedFilters(updated)
    localStorage.setItem('savedProductFilters', JSON.stringify(updated))
  }

  const handlePriceRangeChange = (type: 'min' | 'max', value: string) => {
    const numValue = parseFloat(value) || 0
    const currentRange = filters.price_range || priceRange

    const newRange = {
      ...currentRange,
      [type]: numValue
    }

    setFilters({ price_range: newRange })
  }

  const clearSearch = () => {
    setFilters({ search: '' })
  }

  // Load saved filters on mount
  useEffect(() => {
    const saved = localStorage.getItem('savedProductFilters')
    if (saved) {
      try {
        setSavedFilters(JSON.parse(saved))
      } catch (error) {
        console.warn('Invalid saved filters:', error)
      }
    }
  }, [])

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={filters.search || ''}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="pl-10 pr-8"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Filter Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros
          {getActiveFiltersCount() > 0 && (
            <Badge variant="secondary" className="h-5 min-w-5 px-1 text-xs">
              {getActiveFiltersCount()}
            </Badge>
          )}
        </Button>

        {/* Quick Actions */}
        {hasActiveFilters() && (
          <Button variant="outline" size="sm" onClick={resetFilters}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header and Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, marca, SKU ou código de barras..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="pl-10 pr-8"
            />
            {filters.search && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Active Filters Badge */}
          {getActiveFiltersCount() > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Filter className="h-3 w-3" />
              {getActiveFiltersCount()} filtro{getActiveFiltersCount() !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Filters */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Tag className="h-4 w-4" />
                Filtros Rápidos
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => applyQuickFilter('low_stock')}>
                <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
                Estoque Baixo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyQuickFilter('out_of_stock')}>
                <XCircle className="h-4 w-4 mr-2 text-red-600" />
                Sem Estoque
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyQuickFilter('active')}>
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Produtos Ativos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyQuickFilter('inactive')}>
                <Package className="h-4 w-4 mr-2 text-gray-600" />
                Produtos Inativos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Saved Filters */}
          {savedFilters.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Bookmark className="h-4 w-4" />
                  Salvos
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {savedFilters.map((saved, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => handleLoadFilter(saved.state)}
                  >
                    {saved.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Advanced Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="gap-2"
          >
            <Sliders className="h-4 w-4" />
            Avançado
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {/* Reset */}
          {hasActiveFilters() && (
            <Button variant="outline" size="sm" onClick={resetFilters} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros Avançados
            </CardTitle>
            <CardDescription>
              Configure filtros detalhados para refinar sua busca
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <CategorySelect
                  value={filters.subcategory_id}
                  onValueChange={(value) => setFilters({ subcategory_id: value })}
                  placeholder="Todas as categorias"
                  allowClear={true}
                />
                
                {/* Legacy category filter for backward compatibility */}
                {!filters.subcategory_id && (
                  <Select
                    value={filters.category || 'all'}
                    onValueChange={(value) => setFilters({ category: value === 'all' ? '' : value })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Categorias legadas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {PRODUCT_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Select
                  value={filters.brand || 'all'}
                  onValueChange={(value) => setFilters({ brand: value === 'all' ? '' : value })}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as marcas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {availableBrands.map(brand => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => setFilters({ status: value as 'active' | 'inactive' | 'all' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock-status">Estoque</Label>
                <Select
                  value={filters.stock_status || 'all'}
                  onValueChange={(value) => setFilters({ stock_status: value as 'all' | 'low_stock' | 'out_of_stock' | 'in_stock' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="in_stock">Em Estoque</SelectItem>
                    <SelectItem value="low_stock">Estoque Baixo</SelectItem>
                    <SelectItem value="out_of_stock">Sem Estoque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-4">
              <Label>Faixa de Preço</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="price-min">Preço Mínimo</Label>
                  <Input
                    id="price-min"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={filters.price_range?.min || ''}
                    onChange={(e) => handlePriceRangeChange('min', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price-max">Preço Máximo</Label>
                  <Input
                    id="price-max"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="1000,00"
                    value={filters.price_range?.max || ''}
                    onChange={(e) => handlePriceRangeChange('max', e.target.value)}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Faixa disponível: {formatCurrency(priceRange.min)} - {formatCurrency(priceRange.max)}
                </div>
              </div>
            </div>

            <Separator />

            {/* Save Filters */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="save-filter">Salvar Filtros</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="save-filter"
                    placeholder="Nome do filtro..."
                    value={saveFilterName}
                    onChange={(e) => setSaveFilterName(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSaveFilter}
                    disabled={!saveFilterName.trim() || !hasActiveFilters()}
                  >
                    <Bookmark className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              </div>

              {/* Export/Import */}
              <div className="space-y-2">
                <Label>Compartilhar</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const state = exportFiltersState()
                      navigator.clipboard.writeText(state)
                    }}
                    disabled={!hasActiveFilters()}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.readText().then(importFiltersState)
                    }}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Saved Filters Management */}
            {savedFilters.length > 0 && (
              <div className="space-y-2">
                <Label>Filtros Salvos</Label>
                <div className="flex flex-wrap gap-2">
                  {savedFilters.map((saved, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="gap-2 pr-1 cursor-pointer hover:bg-muted"
                      onClick={() => handleLoadFilter(saved.state)}
                    >
                      {saved.name}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveSavedFilter(index)
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters() && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>

          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Busca: {filters.search}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => clearFilter('search')}
              />
            </Badge>
          )}

          {filters.subcategory_id && (
            <Badge variant="secondary" className="gap-1">
              Categoria: {getCategoryPath(filters.subcategory_id)}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => clearFilter('subcategory_id')}
              />
            </Badge>
          )}

          {filters.category && !filters.subcategory_id && (
            <Badge variant="secondary" className="gap-1">
              Categoria: {filters.category}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => clearFilter('category')}
              />
            </Badge>
          )}

          {filters.brand && (
            <Badge variant="secondary" className="gap-1">
              Marca: {filters.brand}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => clearFilter('brand')}
              />
            </Badge>
          )}

          {filters.status !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Status: {filters.status === 'active' ? 'Ativo' : 'Inativo'}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => clearFilter('status')}
              />
            </Badge>
          )}

          {filters.stock_status !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Estoque: {
                filters.stock_status === 'in_stock' ? 'Em Estoque' :
                  filters.stock_status === 'low_stock' ? 'Estoque Baixo' : 'Sem Estoque'
              }
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => clearFilter('stock_status')}
              />
            </Badge>
          )}

          {filters.price_range && (
            <Badge variant="secondary" className="gap-1">
              Preço: {formatCurrency(filters.price_range.min)} - {formatCurrency(filters.price_range.max)}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => clearFilter('price_range')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
