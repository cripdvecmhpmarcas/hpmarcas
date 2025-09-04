'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Download,
  Upload,
  MoreHorizontal,
  Edit,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  DollarSign,
  X
} from 'lucide-react'
import { useProductsTable } from './hooks/useProductsTable'
import { ProductFilters } from './ProductFilters'
import { PriceInlineEdit } from './components/PriceInlineEdit'
import { BulkPriceEditModal } from './components/BulkPriceEditModal'
import { useCategories } from '@/hooks/useCategories'
import {
  ProductWithVolumes,
  PRODUCT_STATUSES
} from '@/types/products'
import { formatCurrency } from '@/lib/pdv-utils'

interface ProductsTableProps {
  onEditProduct?: (id: string) => void
  onCreateProduct?: () => void
  onViewProduct?: (id: string) => void
}

export function ProductsTable({
  onEditProduct,
  onCreateProduct,
  onViewProduct
}: ProductsTableProps) {
  const router = useRouter()
  const { getCategoryPath } = useCategories()
  const [isWholesaleMode, setIsWholesaleMode] = useState(false)
  const [showBulkPriceModal, setShowBulkPriceModal] = useState(false)

  const {
    products,
    loading,
    error,
    stats,
    pagination,
    sorting,
    selectedProducts,
    setFilters,
    setPage,
    setPageSize,
    setSorting,
    toggleProductSelection,
    selectAllProducts,
    clearSelection,
    refreshProducts,
    updateProductStatus,
    bulkUpdateStatus,
    updateProductPrice,
    bulkUpdatePrices,
    exportProducts
  } = useProductsTable()

  const handleSort = (column: keyof ProductWithVolumes) => {
    const newDirection = sorting.column === column && sorting.direction === 'asc' ? 'desc' : 'asc'
    setSorting(column, newDirection)
  }

  const getSortIcon = (column: keyof ProductWithVolumes) => {
    if (sorting.column !== column) return <ArrowUpDown className="h-4 w-4" />
    return sorting.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  const getDisplayPrice = (product: ProductWithVolumes) => {
    return isWholesaleMode ? product.wholesale_price : product.retail_price
  }

  const getPriceColumnHeader = () => {
    return isWholesaleMode ? 'Preço Atacado' : 'Preço Varejo'
  }

  const getPriceSortColumn = () => {
    return isWholesaleMode ? 'wholesale_price' : 'retail_price'
  }

  const getSelectedProductsData = () => {
    return products.filter(product => selectedProducts.includes(product.id))
  }

  const getStockStatus = (product: ProductWithVolumes) => {
    if (product.stock === 0) return 'out_of_stock'
    if (product.stock < product.min_stock) return 'low_stock'
    return 'in_stock'
  }

  const getStockBadge = (product: ProductWithVolumes) => {
    const status = getStockStatus(product)
    const config = {
      in_stock: { label: 'Em Estoque', variant: 'default' as const, icon: CheckCircle },
      low_stock: { label: 'Estoque Baixo', variant: 'destructive' as const, icon: AlertTriangle },
      out_of_stock: { label: 'Sem Estoque', variant: 'secondary' as const, icon: XCircle }
    }

    const { label, variant, icon: Icon } = config[status]
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === 'active' ? 'default' : 'secondary'}>
        {PRODUCT_STATUSES[status as keyof typeof PRODUCT_STATUSES]}
      </Badge>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={refreshProducts} className="mt-4">
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Produtos</h2>
          <p className="text-muted-foreground">
            Gerencie seu catálogo de produtos
          </p>
        </div>

        {/* Price Type Switch and Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setIsWholesaleMode(false)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${!isWholesaleMode
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10'
                }`}
            >
              Varejo
            </button>
            <button
              onClick={() => setIsWholesaleMode(true)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${isWholesaleMode
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10'
                }`}
            >
              Atacado
            </button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <Button onClick={onCreateProduct} className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              <span className="hidden xs:inline">Novo Produto</span>
              <span className="xs:hidden">Novo</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
                  <Download className="h-4 w-4" />
                  <span className="hidden xs:inline">Exportar</span>
                  <span className="xs:hidden">Export</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportProducts('csv')}>
                  Exportar CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportProducts('excel')}>
                  Exportar Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push('/dashboard/produtos/import')}>
              <Upload className="h-4 w-4" />
              Importar
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold">{stats.total_products}</p>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Ativos</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold">{stats.active_products}</p>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Estoque Baixo</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold">{stats.low_stock_products}</p>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Sem Estoque</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold">{stats.out_of_stock_products}</p>
          </div>
          <div className="rounded-lg border p-3 xs:col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Valor Total</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold">{formatCurrency(stats.total_stock_value)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <ProductFilters
        onFiltersChange={setFilters}
        compact={false}
      />

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="flex flex-col gap-3 p-4 bg-muted rounded-lg sm:flex-row sm:items-center">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedProducts.length} produto{selectedProducts.length !== 1 ? 's' : ''} selecionado{selectedProducts.length !== 1 ? 's' : ''}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="sm:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2 sm:ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkPriceModal(true)}
              className="w-full sm:w-auto"
            >
              <DollarSign className="h-4 w-4 mr-1" />
              <span className="hidden xs:inline">Editar Preços</span>
              <span className="xs:hidden">Preços</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkUpdateStatus(selectedProducts, 'active')}
              className="w-full sm:w-auto"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Ativar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkUpdateStatus(selectedProducts, 'inactive')}
              className="w-full sm:w-auto"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Desativar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelection}
              className="hidden sm:flex w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-1" />
              <span className="hidden xs:inline">Limpar Seleção</span>
              <span className="xs:hidden">Limpar</span>
            </Button>
            {/* <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteProducts(selectedProducts)}
            >
              Excluir
            </Button> */}
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelection}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedProducts.length === products.length && products.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      selectAllProducts()
                    } else {
                      clearSelection()
                    }
                  }}
                />
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('name')} className="gap-2">
                  Nome
                  {getSortIcon('name')}
                </Button>
              </TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('stock')} className="gap-2">
                  Estoque
                  {getSortIcon('stock')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort(getPriceSortColumn())} className="gap-2">
                  {getPriceColumnHeader()}
                  {getSortIcon(getPriceSortColumn())}
                </Button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={9} className="h-16">
                    <div className="flex items-center justify-center">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Nenhum produto encontrado</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={() => toggleProductSelection(product.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.images?.[0] && (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {product.description}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                  <TableCell>
                    {product.subcategory_id ? (
                      <div>
                        <div className="font-medium text-sm">
                          {getCategoryPath(product.subcategory_id)}
                        </div>
                      </div>
                    ) : product.category ? (
                      <div className="text-sm text-muted-foreground">
                        {product.category} <span className="text-xs">(legado)</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{product.brand}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{product.stock}</span>
                      {getStockBadge(product)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <PriceInlineEdit
                      value={getDisplayPrice(product)}
                      productId={product.id}
                      priceType={getPriceSortColumn()}
                      onUpdate={updateProductPrice}
                    />
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(product.status)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onViewProduct?.(product.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditProduct?.(product.id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => updateProductStatus(product.id, product.status === 'active' ? 'inactive' : 'active')}
                        >
                          {product.status === 'active' ? 'Desativar' : 'Ativar'}
                        </DropdownMenuItem>
                        {/* <DropdownMenuItem
                          onClick={() => deleteProducts([product.id])}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem> */}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Mostrando {((pagination.page - 1) * pagination.pageSize) + 1} a{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} de{' '}
            {pagination.total} produtos
          </p>
          <Select
            value={pagination.pageSize.toString()}
            onValueChange={(value) => setPageSize(Number(value))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            Anterior
          </Button>
          <span className="text-sm">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
          >
            Próxima
          </Button>
        </div>
      </div>

      {/* Modal de Edição de Preços em Massa */}
      <BulkPriceEditModal
        open={showBulkPriceModal}
        onOpenChange={setShowBulkPriceModal}
        selectedProducts={getSelectedProductsData()}
        onUpdate={bulkUpdatePrices}
      />
    </div>
  )
}
