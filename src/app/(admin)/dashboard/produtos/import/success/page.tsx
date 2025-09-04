'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  Package,
  Plus,
  FileSpreadsheet
} from 'lucide-react'

export default function ImportSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [importedCount, setImportedCount] = useState(0)
  const [importedProducts, setImportedProducts] = useState<string[]>([])

  useEffect(() => {
    // Recupera dados da URL ou localStorage
    const count = searchParams.get('count')
    const products = searchParams.get('products')

    if (count) {
      setImportedCount(parseInt(count))
    }

    if (products) {
      try {
        setImportedProducts(JSON.parse(decodeURIComponent(products)))
      } catch {
        setImportedProducts([])
      }
    }

    // Limpa localStorage se usado
    const savedCount = localStorage.getItem('import_count')
    const savedProducts = localStorage.getItem('import_products')

    if (savedCount && !count) {
      setImportedCount(parseInt(savedCount))
      localStorage.removeItem('import_count')
    }

    if (savedProducts && !products) {
      try {
        setImportedProducts(JSON.parse(savedProducts))
        localStorage.removeItem('import_products')
      } catch {
        setImportedProducts([])
      }
    }
  }, [searchParams])

  const handleGoToProducts = () => {
    router.push('/dashboard/produtos')
  }

  const handleNewImport = () => {
    router.push('/dashboard/produtos/import')
  }

  const handleCreateProduct = () => {
    router.push('/dashboard/produtos/novo')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-6">
        {/* Success Icon */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Importação Concluída!
          </h1>
          <p className="text-lg text-gray-600">
            Seus produtos foram importados com sucesso
          </p>
        </div>

        {/* Stats Card */}
        <Card className="border-green-200 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2 text-green-700">
              <Package className="h-5 w-5" />
              Resumo da Importação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {importedCount}
              </div>
              <p className="text-gray-600">
                produto{importedCount !== 1 ? 's' : ''} importado{importedCount !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Imported Products Preview */}
            {importedProducts.length > 0 && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Produtos importados:
                </p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {importedProducts.slice(0, 5).map((productName, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                        {index + 1}
                      </Badge>
                      <span className="text-gray-700 truncate">{productName}</span>
                    </div>
                  ))}
                  {importedProducts.length > 5 && (
                    <p className="text-xs text-gray-500 italic">
                      ... e mais {importedProducts.length - 5} produto{importedProducts.length - 5 !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            onClick={handleGoToProducts}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            <Package className="h-4 w-4" />
            Ver Produtos
          </Button>

          <Button
            variant="outline"
            onClick={handleNewImport}
            className="gap-2 border-green-200 hover:bg-green-50"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Nova Importação
          </Button>

          <Button
            variant="outline"
            onClick={handleCreateProduct}
            className="gap-2 border-green-200 hover:bg-green-50"
          >
            <Plus className="h-4 w-4" />
            Criar Produto
          </Button>
        </div>

        {/* Additional Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">
                  Próximos passos
                </p>
                <ul className="text-blue-700 space-y-1">
                  <li>• Verifique se todos os produtos estão corretos</li>
                  <li>• Configure imagens e descrições detalhadas</li>
                  <li>• Ajuste estoques se necessário</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
