'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Download,
  Upload
} from 'lucide-react'
import type { ImportResult } from '@/lib/import-utils'

interface ImportActionsSectionProps {
  importResult: ImportResult
  selectedProducts: Set<number>
  onSelectAllValid: () => void
  onClearSelection: () => void
  onImport: () => void
  onNewFile: () => void
  importing: boolean
}

export function ImportActionsSection({
  importResult,
  selectedProducts,
  onSelectAllValid,
  onClearSelection,
  onImport,
  onNewFile,
  importing
}: ImportActionsSectionProps) {
  const hasValidProducts = importResult.validProducts > 0
  const hasSelectedProducts = selectedProducts.size > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Ações de Importação</span>
          <div className="flex items-center gap-2">
            {importResult.invalidProducts > 0 && (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" />
                {importResult.invalidProducts} erros
              </Badge>
            )}
            {(importResult.duplicateSkus.length > 0 || importResult.duplicateBarcodes.length > 0) && (
              <Badge variant="secondary" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {importResult.duplicateSkus.length + importResult.duplicateBarcodes.length} duplicatas
              </Badge>
            )}
            {hasValidProducts && (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                {importResult.validProducts} válidos
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Alert */}
        {importResult.invalidProducts > 0 ? (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{importResult.invalidProducts} produtos</strong> contêm erros e não podem ser importados.
              Corrija os problemas no arquivo Excel e faça um novo upload.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Perfeito!</strong> Todos os {importResult.validProducts} produtos estão válidos e prontos para importação.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {/* Selection Actions */}
          {hasValidProducts && (
            <>
              <Button
                variant="outline"
                onClick={onSelectAllValid}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Selecionar Todos Válidos ({importResult.validProducts})
              </Button>

              {hasSelectedProducts && (
                <Button
                  variant="outline"
                  onClick={onClearSelection}
                >
                  Limpar Seleção ({selectedProducts.size})
                </Button>
              )}
            </>
          )}

          {/* Import Action */}
          {hasSelectedProducts && (
            <Button
              onClick={onImport}
              disabled={importing}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importando {selectedProducts.size} produtos...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Importar Selecionados ({selectedProducts.size})
                </>
              )}
            </Button>
          )}

          {/* New File Action */}
          <Button
            variant="outline"
            onClick={onNewFile}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Novo Arquivo
          </Button>
        </div>

        {/* Import Progress */}
        {importing && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Importando produtos para o banco de dados...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
