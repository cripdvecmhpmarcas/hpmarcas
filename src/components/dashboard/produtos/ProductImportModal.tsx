'use client'

import { useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Loader2,
  Info
} from 'lucide-react'
import { useProductImport } from './hooks/useProductImport'
import { formatCurrency } from '@/lib/pdv-utils'
import { ParsedProduct } from '@/lib/import-utils'

interface ProductImportModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ProductImportModal({ isOpen, onClose }: ProductImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  const {
    loading,
    importing,
    file,
    importResult,
    selectedProducts,
    setFile,
    processFile,
    toggleProductSelection,
    selectAllValid,
    clearSelection,
    importSelectedProducts,
    downloadTemplate
  } = useProductImport()

  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) return

    // Valida tipo de arquivo
    if (!selectedFile.name.toLowerCase().endsWith('.xlsx')) {
      alert('Apenas arquivos Excel (.xlsx) são suportados')
      return
    }

    setFile(selectedFile)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    handleFileSelect(selectedFile)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const getRowBadge = (product: ParsedProduct) => {
    if (product.isValid) {
      return <Badge variant="default" className="gap-1">
        <CheckCircle className="h-3 w-3" />
        Válido
      </Badge>
    } else {
      return <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        Inválido
      </Badge>
    }
  }

  const getErrorsAndWarnings = (product: ParsedProduct) => {
    const items = []

    if (product.errors?.length > 0) {
      items.push(...product.errors.map((error: string) => ({ type: 'error', message: error })))
    }

    if (product.warnings?.length > 0) {
      items.push(...product.warnings.map((warning: string) => ({ type: 'warning', message: warning })))
    }

    return items
  }

  const handleClose = () => {
    setFile(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Produtos via Excel
          </DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo Excel para importar produtos em lote
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Área de upload */}
          {!file && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Arquivo Excel</Label>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Template
                </Button>
              </div>

              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                  }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  Arraste um arquivo Excel aqui ou clique para selecionar
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Apenas arquivos .xlsx são suportados
                </p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  Selecionar Arquivo
                </Button>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Arquivo selecionado */}
          {file && !importResult && (
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Arquivo selecionado: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button onClick={processFile} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Processar Arquivo'
                  )}
                </Button>
                <Button variant="outline" onClick={() => setFile(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Resultado da importação */}
          {importResult && (
            <div className="space-y-4">
              {/* Estatísticas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Total</span>
                  </div>
                  <p className="text-2xl font-bold">{importResult.totalRows}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Válidos</span>
                  </div>
                  <p className="text-2xl font-bold">{importResult.validProducts}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium">Inválidos</span>
                  </div>
                  <p className="text-2xl font-bold">{importResult.invalidProducts}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Selecionados</span>
                  </div>
                  <p className="text-2xl font-bold">{selectedProducts.size}</p>
                </div>
              </div>

              {/* Alertas de duplicatas */}
              {(importResult.duplicateSkus.length > 0 || importResult.duplicateBarcodes.length > 0) && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {importResult.duplicateSkus.length > 0 && (
                        <p>SKUs duplicados encontrados: {importResult.duplicateSkus.join(', ')}</p>
                      )}
                      {importResult.duplicateBarcodes.length > 0 && (
                        <p>Códigos de barras duplicados encontrados: {importResult.duplicateBarcodes.join(', ')}</p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllValid}
                  disabled={importResult.validProducts === 0}
                >
                  Selecionar Todos Válidos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                  disabled={selectedProducts.size === 0}
                >
                  Limpar Seleção
                </Button>
              </div>

              {/* Tabela de preview */}
              <div className="border rounded-lg">
                <ScrollArea className="h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedProducts.size === importResult.validProducts && importResult.validProducts > 0}
                            onCheckedChange={() => {
                              if (selectedProducts.size === importResult.validProducts) {
                                clearSelection()
                              } else {
                                selectAllValid()
                              }
                            }}
                            disabled={importResult.validProducts === 0}
                          />
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Marca</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Código de Barras</TableHead>
                        <TableHead>Preço Varejo</TableHead>
                        <TableHead>Estoque</TableHead>
                        <TableHead>Problemas/Avisos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importResult.products.map((product, index) => (
                        <TableRow key={index} className={!product.isValid ? 'bg-red-50' : ''}>
                          <TableCell>
                            <Checkbox
                              checked={selectedProducts.has(index)}
                              onCheckedChange={() => toggleProductSelection(index)}
                              disabled={!product.isValid}
                            />
                          </TableCell>
                          <TableCell>
                            {getRowBadge(product)}
                          </TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.brand}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1 rounded">{product.sku}</code>
                          </TableCell>
                          <TableCell>
                            {product.barcode && (
                              <code className="text-xs bg-muted px-1 rounded">{product.barcode}</code>
                            )}
                          </TableCell>
                          <TableCell>{formatCurrency(product.retail_price)}</TableCell>
                          <TableCell>{product.stock}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {getErrorsAndWarnings(product).map((item, idx) => (
                                <div key={idx} className={`text-xs ${item.type === 'error' ? 'text-red-600' : 'text-yellow-600'
                                  }`}>
                                  {item.type === 'error' ? '❌' : '⚠️'} {item.message}
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {importResult && (
            <>
              <Button variant="outline" onClick={() => setFile(null)}>
                Novo Arquivo
              </Button>
              <Button
                onClick={importSelectedProducts}
                disabled={selectedProducts.size === 0 || importing}
                className="min-w-[120px]"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  `Importar ${selectedProducts.size} Produtos`
                )}
              </Button>
            </>
          )}
          <Button variant="outline" onClick={handleClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
