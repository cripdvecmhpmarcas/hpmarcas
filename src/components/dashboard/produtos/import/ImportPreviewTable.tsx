'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Eye,
  EyeOff
} from 'lucide-react'
import type { ImportResult, ParsedProduct } from '@/lib/import-utils'

interface ImportPreviewTableProps {
  importResult: ImportResult
  selectedProducts: Set<number>
  onToggleSelection: (rowNumber: number) => void
  onSelectAll: () => void
  onClearAll: () => void
}

export function ImportPreviewTable({
  importResult,
  selectedProducts,
  onToggleSelection,
  onSelectAll,
  onClearAll
}: ImportPreviewTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showInvalidOnly, setShowInvalidOnly] = useState(false)
  const { products } = importResult

  // Filter products based on search and validity
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchTerm === '' ||
      Object.values(product).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )

    const matchesFilter = !showInvalidOnly || !product.isValid

    return matchesSearch && matchesFilter
  })

  const formatCellValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'number') return value.toLocaleString('pt-BR')
    return String(value)
  }

  const getRowStatusIcon = (product: ParsedProduct) => {
    if (!product.isValid) {
      return <XCircle className="h-4 w-4 text-red-500" />
    }
    if (product.warnings.length > 0) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />
  }

  const getRowStatusBadge = (product: ParsedProduct) => {
    if (!product.isValid) {
      return (
        <Badge variant="destructive" className="text-xs">
          {product.errors.length} erro{product.errors.length !== 1 ? 's' : ''}
        </Badge>
      )
    }
    if (product.warnings.length > 0) {
      return (
        <Badge variant="secondary" className="text-xs">
          {product.warnings.length} aviso{product.warnings.length !== 1 ? 's' : ''}
        </Badge>
      )
    }
    return (
      <Badge variant="default" className="text-xs">
        Válido
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Preview dos Produtos</CardTitle>
            <CardDescription>
              Revise os dados antes de importar. {filteredProducts.length} de {products.length} produtos
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInvalidOnly(!showInvalidOnly)}
              className="gap-2"
            >
              {showInvalidOnly ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showInvalidOnly ? 'Mostrar Todos' : 'Apenas Erros'}
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onSelectAll}>
              Selecionar Válidos
            </Button>
            <Button variant="outline" size="sm" onClick={onClearAll}>
              Limpar Seleção
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedProducts.size > 0 && filteredProducts.filter(p => p.isValid).every(p => selectedProducts.has(p.rowIndex))}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onSelectAll()
                      } else {
                        onClearAll()
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="w-16">Status</TableHead>
                <TableHead className="w-16">Linha</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Código de Barras</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Problemas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow
                  key={product.rowIndex}
                  className={`
                    ${!product.isValid ? 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500' : ''}
                    ${product.warnings.length > 0 && product.isValid ? 'bg-yellow-50 hover:bg-yellow-100 border-l-4 border-l-yellow-500' : ''}
                    ${product.isValid && product.warnings.length === 0 ? 'bg-green-50 hover:bg-green-100 border-l-4 border-l-green-500' : ''}
                    transition-colors
                  `}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedProducts.has(product.rowIndex)}
                        disabled={!product.isValid}
                        onCheckedChange={() => {
                          console.log('Toggle product:', {
                            rowIndex: product.rowIndex,
                            isValid: product.isValid,
                            name: product.name,
                            errors: product.errors
                          })
                          onToggleSelection(product.rowIndex)
                        }}
                      />
                      {/* Status visual */}
                      <div className="flex flex-col text-xs">
                        <span className={product.isValid ? 'text-green-600' : 'text-red-600'}>
                          {product.isValid ? '✓ Válido' : '✗ Erro'}
                        </span>
                        {!product.isValid && (
                          <span className="text-red-500 text-[10px]">
                            {product.errors.length} erro{product.errors.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    {getRowStatusIcon(product)}
                  </TableCell>

                  <TableCell className="font-mono text-sm">
                    {product.rowIndex}
                  </TableCell>

                  <TableCell className="max-w-[200px]">
                    <div className="truncate font-medium">
                      {formatCellValue(product.name)}
                    </div>
                  </TableCell>

                  <TableCell className="font-mono text-sm">
                    {formatCellValue(product.barcode)}
                  </TableCell>

                  <TableCell>
                    {product.retail_price && (
                      <span className="font-medium">
                        R$ {formatCellValue(product.retail_price)}
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    {formatCellValue(product.category)}
                  </TableCell>

                  <TableCell>
                    {formatCellValue(product.stock)}
                  </TableCell>

                  <TableCell className="max-w-[300px]">
                    <div className="space-y-1">
                      {getRowStatusBadge(product)}

                      {/* Error Messages */}
                      {product.errors.length > 0 && (
                        <div className="space-y-1">
                          {product.errors.map((error, index) => (
                            <div
                              key={index}
                              className="text-xs text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded flex items-start gap-1"
                            >
                              <XCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                              <span>{error}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Warning Messages */}
                      {product.warnings.length > 0 && (
                        <div className="space-y-1">
                          {product.warnings.map((warning, index) => (
                            <div
                              key={index}
                              className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-1 rounded flex items-start gap-1"
                            >
                              <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <span>{warning}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Success indicator */}
                      {product.isValid && product.errors.length === 0 && product.warnings.length === 0 && (
                        <div className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>Pronto para importar</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || showInvalidOnly ?
                'Nenhum produto encontrado com os filtros aplicados.' :
                'Nenhum produto para exibir.'
              }
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
