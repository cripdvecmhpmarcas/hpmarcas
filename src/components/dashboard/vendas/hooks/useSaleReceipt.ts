import { useState, useCallback } from 'react'
import { useSupabaseAdmin } from '@/hooks/useSupabaseAdmin'
import { useToast } from '@/hooks/useToast'
import { jsPDF } from 'jspdf'
import {
  SaleReceipt,
  SaleWithDetails,
  PrintHistoryEntry,
  UseSaleReceiptReturn
} from '@/types/sales'
import { convertSaleDataToThermalReceipt } from '@/lib/thermal-receipt-utils'
import { formatPaymentMethod } from '@/lib/pdv-utils'

// Interfaces específicas para o hook

export interface CompanyData {
  name: string
  cnpj: string
  address: string
  city: string
  state: string
  phone: string
  email: string
  zip_code: string
}

export interface TaxData {
  icms_rate: number
  pis_rate: number
  cofins_rate: number
  tax_regime: string
}


// Tipos para queries do banco
interface SaleReceiptQueryData {
  id: string
  created_at: string
  customer_id: string
  customer_name: string
  customer_type: string
  total: number
  subtotal: number
  discount_amount: number | null
  discount_percent: number | null
  payment_method: string
  status: string
  salesperson_name: string | null
  notes: string | null
  updated_at: string
  user_id: string
  user_name: string
  sale_items: ReceiptItemQueryData[]
  customers: ReceiptCustomerQueryData
}

interface ReceiptItemQueryData {
  id: string
  quantity: number
  unit_price: number
  total_price: number
  product_name: string
  product_sku: string
  product_id: string
  created_at: string
  sale_id: string
  products: {
    id: string
    name: string
    sku: string
    cost: number
    retail_price: number
    wholesale_price: number
    volumes: Record<string, unknown> | null
  }
}

interface ReceiptCustomerQueryData {
  id: string
  name: string
  email: string | null
  phone: string | null
  type: string
  cpf_cnpj: string | null
}

export function useSaleReceipt(): UseSaleReceiptReturn {
  const [receiptData, setReceiptData] = useState<SaleReceipt | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [printHistory] = useState<PrintHistoryEntry[]>([])

  const supabase = useSupabaseAdmin()
  const { toast } = useToast()

  // Função para gerar número do cupom baseado no ID da venda
  const generateReceiptNumber = (saleId: string): string => {
    // Usar os últimos 8 caracteres do UUID para criar um número sequencial
    const numericPart = saleId.replace(/[^0-9]/g, '').slice(-6)
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    return `CF${today}${numericPart.padStart(6, '0')}`
  }

  // Função para buscar configurações da empresa
  const fetchCompanySettings = useCallback(async (): Promise<CompanyData> => {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1)
      .single()

    if (error || !data) {
      // Dados padrão caso não existam configurações
      return {
        name: 'HP MARCAS PERFUMES',
        cnpj: '12.345.678/0001-90',
        address: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP',
        phone: '(11) 99999-9999',
        email: 'contato@hpmarcas.com.br',
        zip_code: '01234-567'
      }
    }

    return {
      name: data.company_name,
      cnpj: data.cnpj,
      address: data.address,
      city: data.city,
      state: data.state,
      phone: data.phone,
      email: data.email,
      zip_code: data.zip_code
    }
  }, [supabase])

  // Função para buscar configurações fiscais
  const fetchTaxSettings = useCallback(async (): Promise<TaxData> => {
    const { data, error } = await supabase
      .from('tax_settings')
      .select('*')
      .limit(1)
      .single()

    if (error || !data) {
      // Dados padrão para Simples Nacional
      return {
        icms_rate: 0,
        pis_rate: 0,
        cofins_rate: 0,
        tax_regime: 'Simples Nacional'
      }
    }

    return {
      icms_rate: data.icms_rate,
      pis_rate: data.pis_rate,
      cofins_rate: data.cofins_rate,
      tax_regime: data.tax_regime
    }
  }, [supabase])

  // Função para buscar dados completos da venda
  const fetchSaleDetails = useCallback(async (saleId: string): Promise<SaleWithDetails> => {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items (
          id,
          quantity,
          unit_price,
          total_price,
          product_name,
          product_sku,
          product_id,
          created_at,
          sale_id,
          products (
            id,
            name,
            sku,
            cost,
            retail_price,
            wholesale_price,
            volumes
          )
        ),
        customers (
          id,
          name,
          email,
          phone,
          type,
          cpf_cnpj
        )
      `)
      .eq('id', saleId)
      .single()

    if (error || !data) {
      throw new Error('Venda não encontrada')
    }

    const saleData = data as SaleReceiptQueryData

    // Processar dados para calcular lucros
    const saleItems = saleData.sale_items?.map((item: ReceiptItemQueryData) => {
      const product = item.products
      const costPrice = product?.cost || 0
      const profitPerUnit = item.unit_price - costPrice
      const totalProfit = profitPerUnit * item.quantity

      return {
        ...item,
        product,
        profit_per_unit: profitPerUnit,
        total_profit: totalProfit
      }
    }) || []

    const totalProfit = saleItems.reduce((sum, item) => sum + (item.total_profit || 0), 0)
    const profitMargin = saleData.total > 0 ? (totalProfit / saleData.total) * 100 : 0

    return {
      ...saleData,
      sale_items: saleItems,
      customer: saleData.customers,
      total_profit: totalProfit,
      profit_margin: profitMargin,
      items_count: saleItems.length
    } as unknown as SaleWithDetails
  }, [supabase])

  // Função principal para gerar o cupom fiscal
  const generateReceipt = useCallback(async (saleId: string) => {
    try {
      setLoading(true)
      setError(null)

      // Buscar dados em paralelo
      const [saleDetails, companyData, taxData] = await Promise.all([
        fetchSaleDetails(saleId),
        fetchCompanySettings(),
        fetchTaxSettings()
      ])

      // Gerar número do cupom
      const receiptNumber = generateReceiptNumber(saleId)

      // Montar estrutura completa do cupom
      const receipt: SaleReceipt = {
        sale: saleDetails,
        company: companyData,
        receipt_number: receiptNumber,
        tax_info: {
          icms_rate: taxData.icms_rate,
          pis_rate: taxData.pis_rate,
          cofins_rate: taxData.cofins_rate
        }
      }

      setReceiptData(receipt)

      toast({
        title: 'Sucesso',
        description: 'Cupom fiscal gerado com sucesso',
        variant: 'success'
      })

    } catch (error) {
      console.error('Error generating receipt:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro ao gerar cupom fiscal'
      setError(errorMessage)
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [fetchSaleDetails, fetchCompanySettings, fetchTaxSettings, toast])

  // Função para marcar como re-impresso
  const markAsReprinted = useCallback(async () => {
    if (!receiptData) return

    try {
      // Por enquanto, apenas log
      // Em implementação futura, salvar em tabela de histórico
      console.log('Receipt reprinted:', receiptData.receipt_number)

    } catch (error) {
      console.error('Error marking as reprinted:', error)
    }
  }, [receiptData])

  // Função para impressão direta
  const printReceipt = useCallback(async () => {
    if (!receiptData) {
      toast({
        title: 'Erro',
        description: 'Nenhum cupom gerado para impressão',
        variant: 'destructive'
      })
      return
    }

    try {
      // Registrar impressão no histórico
      await markAsReprinted()

      // Acionar impressão do navegador
      window.print()

      toast({
        title: 'Sucesso',
        description: 'Cupom enviado para impressão',
        variant: 'success'
      })

    } catch (error) {
      console.error('Error printing receipt:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao imprimir cupom',
        variant: 'destructive'
      })
    }
  }, [receiptData, toast, markAsReprinted])

  // Função para download em PDF
  const downloadPDF = useCallback(async () => {
    if (!receiptData) {
      toast({
        title: 'Erro',
        description: 'Nenhum cupom gerado para download',
        variant: 'destructive'
      })
      return
    }

    try {
      // Registrar download no histórico
      await markAsReprinted()

      // Converter dados da venda para formato térmico padronizado
      const thermalData = convertSaleDataToThermalReceipt(receiptData.sale)

      // Instanciar jsPDF
      const pdf = new jsPDF()

      // Configurações do PDF
      const pageWidth = pdf.internal.pageSize.width
      const margin = 20
      let yPosition = margin

      // Função auxiliar para adicionar texto
      const addText = (text: string, x: number, y: number, options?: Record<string, unknown>) => {
        pdf.text(text, x, y, options)
        return y + 8
      }

      // Cabeçalho seguindo o modelo térmico
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      yPosition = addText('HP MARCAS PERFUMES', pageWidth / 2, yPosition, { align: 'center' })

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      yPosition = addText('Av. Presidente Vargas, 633 - Centro', pageWidth / 2, yPosition, { align: 'center' })
      yPosition = addText('Rio de Janeiro/RJ - CEP: 20071-004', pageWidth / 2, yPosition, { align: 'center' })

      // Linha separadora
      yPosition += 10
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 10

      // Título do cupom seguindo modelo térmico
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      yPosition = addText('CUPOM NAO FISCAL', pageWidth / 2, yPosition, { align: 'center' })

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')

      // Data e hora
      const date = new Date(thermalData.createdAt)
      const dateStr = date.toLocaleDateString("pt-BR")
      const timeStr = date.toLocaleTimeString("pt-BR")

      yPosition = addText(`Data: ${dateStr}        Hora: ${timeStr}`, margin, yPosition)
      yPosition = addText(`Venda: ${thermalData.id}`, margin, yPosition)
      yPosition = addText(`Operador: ${thermalData.userName || "Sistema"}`, margin, yPosition)

      // Vendedor apenas se informado
      if (thermalData.salespersonName && thermalData.salespersonName !== "Não informado") {
        yPosition = addText(`Vendedor: ${thermalData.salespersonName}`, margin, yPosition)
      }

      yPosition += 5
      yPosition = addText(`Cliente: ${thermalData.customer.name}`, margin, yPosition)
      yPosition = addText(`Tipo: ${thermalData.customer.type === "wholesale" ? "Atacado" : "Varejo"}`, margin, yPosition)

      // Linha separadora
      yPosition += 10
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 10

      // Cabeçalho dos produtos
      pdf.setFont('helvetica', 'bold')
      yPosition = addText('PRODUTOS', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 5
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 8

      // Itens seguindo modelo térmico
      pdf.setFont('helvetica', 'normal')
      thermalData.items.forEach((item, index) => {
        const itemName = item.displayName || item.name
        const volumeInfo = item.volume ? ` (${item.volume.size}${item.volume.unit})` : ''

        pdf.setFont('helvetica', 'bold')
        yPosition = addText(`${(index + 1).toString().padStart(3, "0")} ${itemName}${volumeInfo}`, margin, yPosition)

        pdf.setFont('helvetica', 'normal')
        yPosition = addText(`    SKU: ${item.sku}`, margin, yPosition)
        yPosition = addText(`    ${item.quantity}x R$ ${item.price.toFixed(2)} = R$ ${item.subtotal.toFixed(2)}`, margin, yPosition)
        yPosition += 3

        // Verificar se precisa de nova página
        if (yPosition > pdf.internal.pageSize.height - 80) {
          pdf.addPage()
          yPosition = margin
        }
      })

      // Resumo seguindo modelo térmico
      yPosition += 5
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 10

      pdf.setFont('helvetica', 'bold')
      yPosition = addText('RESUMO', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 5
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 8

      pdf.setFont('helvetica', 'normal')
      yPosition = addText(`Subtotal:               R$ ${thermalData.subtotal.toFixed(2)}`, margin, yPosition)

      if (thermalData.discountAmount > 0) {
        yPosition = addText(`Desconto (${thermalData.discountPercent.toFixed(1)}%):          -R$ ${thermalData.discountAmount.toFixed(2)}`, margin, yPosition)
      }

      pdf.setFont('helvetica', 'bold')
      yPosition = addText(`TOTAL:                  R$ ${thermalData.total.toFixed(2)}`, margin, yPosition)

      pdf.setFont('helvetica', 'normal')
      yPosition += 5
      yPosition = addText(`Pagamento: ${formatPaymentMethod(thermalData.paymentMethod)}`, margin, yPosition)

      if (thermalData.paymentMethod === "cash" && thermalData.amountPaid) {
        yPosition = addText(`Valor Recebido:         R$ ${thermalData.amountPaid.toFixed(2)}`, margin, yPosition)
        yPosition = addText(`Troco:                  R$ ${(thermalData.change || 0).toFixed(2)}`, margin, yPosition)
      }

      if (thermalData.notes) {
        yPosition += 5
        yPosition = addText(`Observacoes: ${thermalData.notes}`, margin, yPosition)
      }

      // Rodapé seguindo modelo térmico
      yPosition += 20
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 10

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'bold')
      yPosition = addText('OBRIGADO PELA PREFERENCIA!', pageWidth / 2, yPosition, { align: 'center' })

      pdf.setFont('helvetica', 'normal')
      yPosition = addText('Volte sempre!', pageWidth / 2, yPosition, { align: 'center' })
      yPosition = addText('Siga-nos nas redes sociais', pageWidth / 2, yPosition, { align: 'center' })
      yPosition = addText('@hpmarcasperfumes', pageWidth / 2, yPosition, { align: 'center' })

      // Salvar PDF
      const filename = `cupom_${thermalData.id}_2via.pdf`
      pdf.save(filename)

      toast({
        title: 'Sucesso',
        description: 'PDF baixado com sucesso',
        variant: 'success'
      })

    } catch (error) {
      console.error('Error generating PDF:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao gerar PDF',
        variant: 'destructive'
      })
    }
  }, [receiptData, toast, markAsReprinted])

  // Função para alternar modo preview
  const togglePreview = useCallback(() => {
    setPreviewMode(prev => !prev)
  }, [])

  // Função para buscar histórico de impressões
  const getPrintHistory = useCallback(async (): Promise<PrintHistoryEntry[]> => {
    try {
      // Por enquanto, retornar array vazio
      // Em implementação futura, buscar de tabela de histórico
      return []
    } catch (error) {
      console.error('Error fetching print history:', error)
      return []
    }
  }, [])

  return {
    receiptData,
    loading,
    error,
    previewMode,
    printHistory,
    generateReceipt,
    printReceipt,
    downloadPDF,
    togglePreview,
    getPrintHistory,
    markAsReprinted
  }
}
