'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft,
  FileSpreadsheet,
  Download,
  CheckCircle,
  Info,
  Loader2
} from 'lucide-react'
import { ImportUploadSection } from '@/components/dashboard/produtos/import/ImportUploadSection'
import { ImportStatsSection } from '@/components/dashboard/produtos/import/ImportStatsSection'
import { ImportPreviewTable } from '@/components/dashboard/produtos/import/ImportPreviewTable'
import { ImportActionsSection } from '@/components/dashboard/produtos/import/ImportActionsSection'
import { useProductImport } from '@/components/dashboard/produtos/hooks/useProductImport'

export default function ProductImportPage() {
  const router = useRouter()
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
    downloadTemplate,
    resetImport
  } = useProductImport()

  const handleBack = () => {
    if (file || importResult) {
      if (confirm('Tem certeza? Todos os dados serão perdidos.')) {
        resetImport()
        router.push('/dashboard/produtos')
      }
    } else {
      router.push('/dashboard/produtos')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 relative">
      {/* Loading Overlay durante importação */}
      {importing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4 shadow-2xl">
            <CardContent className="p-8 text-center space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <Loader2 className="h-16 w-16 animate-spin text-green-600" />
                  <div className="absolute inset-0 h-16 w-16 border-4 border-green-200 rounded-full"></div>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-gray-900">
                  Importando Produtos
                </h3>
                <p className="text-gray-600">
                  Processando {selectedProducts.size} produto{selectedProducts.size !== 1 ? 's' : ''} selecionado{selectedProducts.size !== 1 ? 's' : ''}...
                </p>
              </div>
              <div className="space-y-2">
                <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-1000 animate-pulse"
                    style={{ width: '75%' }}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Salvando no banco de dados...
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <p className="text-xs text-gray-400 bg-gray-50 p-2 rounded">
                ⚠️ Não feche esta página durante a importação
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Importar Produtos</h1>
              <p className="text-muted-foreground">
                Faça upload de um arquivo Excel para importar produtos em lote
              </p>
            </div>
          </div>

          <Button variant="outline" onClick={downloadTemplate} className="gap-2">
            <Download className="h-4 w-4" />
            Baixar Template
          </Button>
        </div>

        {/* Progress Indicator */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${!file ? 'text-blue-600' : 'text-green-600'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${!file ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                  }`}>
                  {!file ? '1' : <CheckCircle className="h-4 w-4" />}
                </div>
                <span className="font-medium">Upload do Arquivo</span>
              </div>

              <div className="flex-1 h-0.5 bg-gray-200">
                <div className={`h-full transition-all duration-500 ${file ? 'bg-green-500 w-full' : 'bg-blue-500 w-1/3'
                  }`} />
              </div>

              <div className={`flex items-center gap-2 ${!file ? 'text-gray-400' :
                  !importResult ? 'text-blue-600' : 'text-green-600'
                }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${!file ? 'bg-gray-100 text-gray-400' :
                    !importResult ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                  }`}>
                  {!file ? '2' :
                    !importResult ? (loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '2') :
                      <CheckCircle className="h-4 w-4" />}
                </div>
                <span className="font-medium">Processamento</span>
              </div>

              <div className="flex-1 h-0.5 bg-gray-200">
                <div className={`h-full transition-all duration-500 ${importResult ? 'bg-green-500 w-full' :
                    file ? 'bg-blue-500 w-1/3' : 'bg-gray-200 w-0'
                  }`} />
              </div>

              <div className={`flex items-center gap-2 ${!importResult ? 'text-gray-400' :
                  selectedProducts.size === 0 ? 'text-blue-600' : 'text-green-600'
                }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${!importResult ? 'bg-gray-100 text-gray-400' :
                    selectedProducts.size === 0 ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                  }`}>
                  {!importResult ? '3' :
                    selectedProducts.size === 0 ? '3' : <CheckCircle className="h-4 w-4" />}
                </div>
                <span className="font-medium">Seleção & Importação</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Section */}
        {!file && (
          <ImportUploadSection onFileSelect={setFile} />
        )}

        {/* File Selected - Processing */}
        {file && !importResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Arquivo Selecionado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
                </AlertDescription>
              </Alert>

              {loading && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="font-medium">Processando arquivo Excel...</span>
                  </div>
                  <div className="space-y-2">
                    <Progress value={75} className="w-full h-2" />
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Lendo planilha Excel</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        <span>Validando dados dos produtos</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <div className="h-4 w-4 rounded-full border-2 border-gray-300"></div>
                        <span>Verificando duplicatas</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {importResult && (
          <div className="space-y-6">
            {/* Stats */}
            <ImportStatsSection
              importResult={importResult}
              selectedCount={selectedProducts.size}
            />

            {/* Actions */}
            <ImportActionsSection
              importResult={importResult}
              selectedProducts={selectedProducts}
              onSelectAllValid={selectAllValid}
              onClearSelection={clearSelection}
              onImport={importSelectedProducts}
              onNewFile={() => setFile(null)}
              importing={importing}
            />

            {/* Preview Table */}
            <ImportPreviewTable
              importResult={importResult}
              selectedProducts={selectedProducts}
              onToggleSelection={toggleProductSelection}
              onSelectAll={selectAllValid}
              onClearAll={clearSelection}
            />
          </div>
        )}
      </div>
    </div>
  )
}
