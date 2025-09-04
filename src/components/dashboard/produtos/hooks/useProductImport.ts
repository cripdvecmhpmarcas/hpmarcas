'use client'

import { useState, useCallback } from 'react'
import { useSupabaseAdmin } from '@/hooks/useSupabaseAdmin'
import { useToast } from '@/hooks/useToast'
import { ProductInsert } from '@/types/products'
import {
  processExcelImport,
  ImportResult,
  ImportValidationOptions,
  downloadImportTemplate,
  ParsedProduct
} from '@/lib/import-utils'

export interface UseProductImportReturn {
  // Estado
  loading: boolean
  importing: boolean
  file: File | null
  importResult: ImportResult | null
  selectedProducts: Set<number>

  // Ações
  setFile: (file: File | null) => void
  processFile: () => Promise<void>
  toggleProductSelection: (index: number) => void
  selectAllValid: () => void
  clearSelection: () => void
  importSelectedProducts: () => Promise<void>
  downloadTemplate: () => void
  resetImport: () => void
}

export function useProductImport(): UseProductImportReturn {
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set())

  const supabase = useSupabaseAdmin()
  const { toast } = useToast()

  const resetImport = useCallback(() => {
    setFile(null)
    setImportResult(null)
    setSelectedProducts(new Set())
    setLoading(false)
    setImporting(false)
  }, [])

  const downloadTemplate = useCallback(() => {
    try {
      downloadImportTemplate()
      toast({
        title: 'Sucesso',
        description: 'Template de importação baixado com sucesso'
      })
    } catch {
      toast({
        title: 'Erro',
        description: 'Erro ao baixar template',
        variant: 'destructive'
      })
    }
  }, [toast])

  const fetchExistingData = useCallback(async (): Promise<ImportValidationOptions> => {
    try {
      // Busca SKUs existentes
      const { data: skuData, error: skuError } = await supabase
        .from('products')
        .select('sku')
        .not('sku', 'is', null)

      if (skuError) throw skuError

      // Busca barcodes existentes (apenas não vazios)
      const { data: barcodeData, error: barcodeError } = await supabase
        .from('products')
        .select('barcode')
        .not('barcode', 'is', null)
        .neq('barcode', '')

      if (barcodeError) throw barcodeError

      return {
        existingSkus: skuData?.map(item => item.sku) || [],
        existingBarcodes: barcodeData?.map(item => item.barcode) || [],
        allowEmptyBarcode: true
      }
    } catch (error) {
      console.error('Erro ao buscar dados existentes:', error)
      throw new Error('Erro ao validar dados existentes no sistema')
    }
  }, [supabase])

  const processFile = useCallback(async () => {
    if (!file) return

    setLoading(true)
    try {
      // Busca dados existentes para validação
      const validationOptions = await fetchExistingData()

      // Processa arquivo
      const result = await processExcelImport(file, validationOptions)

      setImportResult(result)

      // Auto-seleciona produtos válidos
      const validIndices = new Set<number>()
      result.products.forEach((product) => {
        if (product.isValid) {
          validIndices.add(product.rowIndex)
        }
      })
      setSelectedProducts(validIndices)

      toast({
        title: 'Arquivo processado',
        description: `${result.validProducts} produtos válidos encontrados de ${result.totalRows} total`
      })

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao processar arquivo'
      toast({
        title: 'Erro no processamento',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [file, fetchExistingData, toast])

  const toggleProductSelection = useCallback((rowIndex: number) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(rowIndex)) {
        newSet.delete(rowIndex)
      } else {
        // Só permite selecionar produtos válidos
        const product = importResult?.products.find(p => p.rowIndex === rowIndex)
        if (product?.isValid) {
          newSet.add(rowIndex)
        }
      }
      return newSet
    })
  }, [importResult])

  const selectAllValid = useCallback(() => {
    if (!importResult) return

    const validIndices = new Set<number>()
    importResult.products.forEach((product) => {
      if (product.isValid) {
        validIndices.add(product.rowIndex)
      }
    })
    setSelectedProducts(validIndices)
  }, [importResult])

  const clearSelection = useCallback(() => {
    setSelectedProducts(new Set())
  }, [])

  const importSelectedProducts = useCallback(async () => {
    if (!importResult || selectedProducts.size === 0) return

    setImporting(true)
    try {
      const productsToImport = Array.from(selectedProducts)
        .map(rowIndex => importResult.products.find(p => p.rowIndex === rowIndex))
        .filter((product): product is ParsedProduct => product !== undefined && product.isValid)

      if (productsToImport.length === 0) {
        throw new Error('Nenhum produto válido selecionado')
      }

      // Converte dados para formato do banco
      const productsData: ProductInsert[] = productsToImport.map(product => ({
        name: product.name,
        description: product.description || '',
        brand: product.brand,
        category: product.category,
        subcategory_id: null, // Por enquanto null, pode ser expandido futuramente
        sku: product.sku,
        barcode: product.barcode || '', // Supabase espera string, não null
        cost: product.cost,
        wholesale_price: product.wholesale_price,
        retail_price: product.retail_price,
        stock: product.stock,
        min_stock: product.min_stock,
        status: product.status as 'active' | 'inactive',
        images: [],
        volumes: product.volumes ? JSON.parse(product.volumes) : []
      }))

      // Importa em lote
      const { data, error } = await supabase
        .from('products')
        .insert(productsData)
        .select('id, name')

      if (error) throw error

      // Salva dados da importação para a página de sucesso
      const importedProductNames = productsToImport.map(p => p.name)
      const importCount = data?.length || productsData.length

      toast({
        title: 'Importação concluída!',
        description: `${importCount} produtos importados com sucesso. Redirecionando...`
      })

      // Aguarda um momento para mostrar o toast, depois navega
      setTimeout(() => {
        const successUrl = `/dashboard/produtos/import/success?count=${importCount}&products=${encodeURIComponent(JSON.stringify(importedProductNames))}`
        window.location.href = successUrl
      }, 1500)

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao importar produtos'
      toast({
        title: 'Erro na importação',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setImporting(false)
    }
  }, [importResult, selectedProducts, supabase, toast])

  return {
    // Estado
    loading,
    importing,
    file,
    importResult,
    selectedProducts,

    // Ações
    setFile,
    processFile,
    toggleProductSelection,
    selectAllValid,
    clearSelection,
    importSelectedProducts,
    downloadTemplate,
    resetImport
  }
}
