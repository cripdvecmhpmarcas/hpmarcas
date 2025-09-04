"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Plus,
  Filter,
  Search,
  Package,
  TrendingUp,
  TrendingDown,
  Calculator,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  STOCK_MOVEMENT_TYPES,
  STOCK_MOVEMENT_REASONS,
  StockMovementWithProduct,
  StockMovementFilters,
  StockMovementType,
  StockMovementReason
} from '@/types/stock'
import { StockMovementModal } from './StockMovementModal'
import { useStockMovements } from './hooks/useStockMovements'

const MOVEMENT_ICONS = {
  entry: TrendingUp,
  exit: TrendingDown,
  adjustment: Calculator
} as const

const MOVEMENT_COLORS = {
  entry: 'text-green-600 bg-green-50 border-green-200',
  exit: 'text-red-600 bg-red-50 border-red-200',
  adjustment: 'text-blue-600 bg-blue-50 border-blue-200'
} as const

interface StockMovementsProps {
  className?: string
}

export function StockMovements({ className }: StockMovementsProps) {
  const {
    movements,
    loading,
    error,
    filters,
    pagination,
    setFilters,
    setPage,
    refreshMovements
  } = useStockMovements()

  const [showModal, setShowModal] = useState(false)
  const [selectedMovement, setSelectedMovement] = useState<StockMovementWithProduct | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Local filter state
  const [localFilters, setLocalFilters] = useState<StockMovementFilters>(filters)

  // Apply filters
  const applyFilters = () => {
    setFilters(localFilters)
    setShowFilters(false)
  }

  // Reset filters
  const resetFilters = () => {
    const defaultFilters: StockMovementFilters = {
      search: '',
      type: 'all',
      reason: 'all',
      date_from: '',
      date_to: ''
    }
    setLocalFilters(defaultFilters)
    setFilters(defaultFilters)
  }

  // Handle movement creation
  const handleCreateMovement = async () => {
    await refreshMovements()
    setShowModal(false)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get movement type icon
  const getMovementIcon = (type: string) => {
    const Icon = MOVEMENT_ICONS[type as keyof typeof MOVEMENT_ICONS]
    return Icon ? <Icon className="h-4 w-4" /> : null
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Movimentações de Estoque</h2>
          <p className="text-gray-600">Gerencie e acompanhe todas as movimentações</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Movimentação
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filtros</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Produto, SKU..."
                    value={localFilters.search}
                    onChange={(e) => setLocalFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={localFilters.type}
                  onValueChange={(value: 'all' | 'entry' | 'exit' | 'adjustment') =>
                    setLocalFilters(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Object.entries(STOCK_MOVEMENT_TYPES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {getMovementIcon(key)}
                          {label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label>Motivo</Label>
                <Select
                  value={localFilters.reason}
                  onValueChange={(value) => setLocalFilters(prev => ({ ...prev, reason: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Object.entries(STOCK_MOVEMENT_REASONS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date range */}
              <div className="space-y-2">
                <Label>Período</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={localFilters.date_from}
                    onChange={(e) => setLocalFilters(prev => ({ ...prev, date_from: e.target.value }))}
                    className="flex-1"
                  />
                  <Input
                    type="date"
                    value={localFilters.date_to}
                    onChange={(e) => setLocalFilters(prev => ({ ...prev, date_to: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={applyFilters}>
                Aplicar Filtros
              </Button>
              <Button variant="outline" onClick={resetFilters}>
                Limpar
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Entradas</p>
                <p className="text-2xl font-bold">
                  {movements.filter(m => m.type === 'entry').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Saídas</p>
                <p className="text-2xl font-bold">
                  {movements.filter(m => m.type === 'exit').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calculator className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Ajustes</p>
                <p className="text-2xl font-bold">
                  {movements.filter(m => m.type === 'adjustment').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Movements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Carregando movimentações...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
              <Button
                variant="outline"
                onClick={() => refreshMovements()}
                className="mt-2"
              >
                Tentar Novamente
              </Button>
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma movimentação encontrada</p>
              <Button
                onClick={() => setShowModal(true)}
                className="mt-2"
              >
                Criar primeira movimentação
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="font-medium">
                        {formatDate(movement.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            {movement.product?.name || 'Produto não encontrado'}
                          </div>
                          <div className="text-xs text-gray-500">
                            SKU: {movement.product?.sku || 'N/A'}
                          </div>
                          {movement.product?.brand && (
                            <div className="text-xs text-gray-500">
                              {movement.product.brand}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={MOVEMENT_COLORS[movement.type as StockMovementType]}>
                          <div className="flex items-center gap-1">
                            {getMovementIcon(movement.type)}
                            {STOCK_MOVEMENT_TYPES[movement.type as StockMovementType]}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {STOCK_MOVEMENT_REASONS[movement.reason as StockMovementReason] || movement.reason}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-sm font-medium",
                            movement.type === 'entry' && "text-green-600",
                            movement.type === 'exit' && "text-red-600",
                            movement.type === 'adjustment' && "text-blue-600"
                          )}>
                            {movement.type === 'entry' && '+'}
                            {movement.type === 'exit' && '-'}
                            {Math.abs(movement.quantity)}
                          </span>
                          <span className="text-sm text-gray-500">
                            unid
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-32 truncate">
                          {movement.notes || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedMovement(movement)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Mostrando {((pagination.page - 1) * pagination.pageSize) + 1} a {Math.min(pagination.page * pagination.pageSize, pagination.total)} de {pagination.total} movimentações
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    {pagination.page} de {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Movement Modal */}
      <StockMovementModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleCreateMovement}
      />

      {/* Movement Details Modal */}
      {selectedMovement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Detalhes da Movimentação</h3>

            <div className="space-y-3">
              <div>
                <Label className="text-sm text-gray-500">Data/Hora</Label>
                <p className="font-medium">{formatDate(selectedMovement.created_at)}</p>
              </div>

              <div>
                <Label className="text-sm text-gray-500">Produto</Label>
                <p className="font-medium">{selectedMovement.product?.name}</p>
                <p className="text-sm text-gray-500">{selectedMovement.product?.sku}</p>
              </div>

              <div>
                <Label className="text-sm text-gray-500">Tipo</Label>
                <Badge className={MOVEMENT_COLORS[selectedMovement.type as StockMovementType]}>
                  {STOCK_MOVEMENT_TYPES[selectedMovement.type as StockMovementType]}
                </Badge>
              </div>

              <div>
                <Label className="text-sm text-gray-500">Motivo</Label>
                <p className="font-medium">{STOCK_MOVEMENT_REASONS[selectedMovement.reason as StockMovementReason] || selectedMovement.reason}</p>
              </div>

              <div>
                <Label className="text-sm text-gray-500">Quantidade</Label>
                <p className="font-medium">
                  {selectedMovement.type === 'exit' ? '-' : '+'}
                  {selectedMovement.quantity}
                </p>
              </div>

              {selectedMovement.notes && (
                <div>
                  <Label className="text-sm text-gray-500">Observações</Label>
                  <p className="font-medium">{selectedMovement.notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => setSelectedMovement(null)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
