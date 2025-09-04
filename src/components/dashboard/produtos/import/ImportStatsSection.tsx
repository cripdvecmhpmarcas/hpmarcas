'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  Package
} from 'lucide-react'
import type { ImportResult } from '@/lib/import-utils'

interface ImportStatsSectionProps {
  importResult: ImportResult
  selectedCount: number
}

export function ImportStatsSection({ importResult, selectedCount }: ImportStatsSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Products */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
          <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{importResult.totalRows}</div>
          <p className="text-xs text-muted-foreground">
            produtos no arquivo
          </p>
        </CardContent>
      </Card>

      {/* Valid Products */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Produtos Válidos</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{importResult.validProducts}</div>
          <p className="text-xs text-muted-foreground">
            prontos para importar
          </p>
        </CardContent>
      </Card>

      {/* Invalid Products */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Produtos com Erro</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{importResult.invalidProducts}</div>
          <p className="text-xs text-muted-foreground">
            precisam de correção
          </p>
        </CardContent>
      </Card>

      {/* Selected Products */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Selecionados</CardTitle>
          <Package className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{selectedCount}</div>
          <p className="text-xs text-muted-foreground">
            para importação
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
