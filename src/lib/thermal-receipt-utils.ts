// src/lib/thermal-receipt-utils.ts

import { formatPaymentMethod } from '@/lib/pdv-utils'
import type { PDVReceiptData, PDVSaleItem } from '@/types/pdv'
import type { SaleWithDetails, SaleItemWithProduct } from '@/types/sales'

export interface ThermalReceiptItem {
  name: string
  displayName?: string
  sku: string
  price: number
  quantity: number
  subtotal: number
  volume?: {
    size: string
    unit: string
  }
}

export interface ThermalReceiptCustomer {
  name: string
  type: 'retail' | 'wholesale'
}

export interface ThermalReceiptData {
  id: string
  items: ThermalReceiptItem[]
  customer: ThermalReceiptCustomer
  subtotal: number
  discountPercent: number
  discountAmount: number
  total: number
  paymentMethod: string
  amountPaid?: number
  change?: number
  notes?: string
  createdAt: string
  userName?: string
  salespersonName?: string
}

/**
 * Gera o texto do cupom térmico otimizado para impressoras de 58mm
 */
export const generateThermalReceiptText = (saleData: ThermalReceiptData): string => {
  const date = new Date(saleData.createdAt)
  const dateStr = date.toLocaleDateString("pt-BR")
  const timeStr = date.toLocaleTimeString("pt-BR")

  let receipt = `========================================
           HP MARCAS PERFUMES
========================================
Av. Presidente Vargas, 633 - Centro
Rio de Janeiro/RJ - CEP: 20071-004

CUPOM NAO FISCAL

Data: ${dateStr}        Hora: ${timeStr}
Venda: ${saleData.id}
Operador: ${saleData.userName || "Sistema"}`

  // Adicionar vendedor apenas se informado
  if (saleData.salespersonName && saleData.salespersonName !== "Não informado") {
    receipt += `
Vendedor: ${saleData.salespersonName}`
  }

  receipt += `

Cliente: ${saleData.customer.name}
Tipo: ${saleData.customer.type === "wholesale" ? "Atacado" : "Varejo"}

========================================
PRODUTOS
========================================`

  saleData.items.forEach((item, index) => {
    const itemName = item.displayName || item.name
    const volumeInfo = item.volume ? ` (${item.volume.size}${item.volume.unit})` : ''
    receipt += `
${(index + 1).toString().padStart(3, "0")} ${itemName}${volumeInfo}
    SKU: ${item.sku}
    ${item.quantity}x R$ ${item.price.toFixed(2)} = R$ ${item.subtotal.toFixed(2)}`
  })

  receipt += `

========================================
RESUMO
========================================
Subtotal:               R$ ${saleData.subtotal.toFixed(2)}`

  if (saleData.discountAmount > 0) {
    receipt += `
Desconto (${saleData.discountPercent.toFixed(1)}%):          -R$ ${saleData.discountAmount.toFixed(2)}`
  }

  receipt += `
TOTAL:                  R$ ${saleData.total.toFixed(2)}

Pagamento: ${formatPaymentMethod(saleData.paymentMethod)}`

  if (saleData.paymentMethod === "cash" && saleData.amountPaid) {
    receipt += `
Valor Recebido:         R$ ${saleData.amountPaid.toFixed(2)}
Troco:                  R$ ${(saleData.change || 0).toFixed(2)}`
  }

  if (saleData.notes) {
    receipt += `

Observacoes: ${saleData.notes}`
  }

  receipt += `

========================================
        OBRIGADO PELA PREFERENCIA!
========================================
Volte sempre!
Siga-nos nas redes sociais
@hpmarcasperfumes

========================================`

  return receipt
}

/**
 * Abre janela de impressão otimizada para impressoras térmicas
 */
export const printThermalReceipt = (
  receiptText: string,
  saleId: string,
  onStartPrint: () => void,
  onEndPrint: () => void,
  isReprint: boolean = false
): void => {
  onStartPrint()

  try {
    // Tentar abrir nova janela para impressão
    const printWindow = window.open("", "_blank", "width=800,height=600")

    if (!printWindow) {
      // Popup foi bloqueado - usar método alternativo
      alert("⚠️ Bloqueador de popup detectado!\n\nPor favor:\n1. Permita popups neste site\n2. Ou use Ctrl+P para imprimir esta página")
      onEndPrint()
      return
    }

    // Título da janela
    const windowTitle = isReprint
      ? `Cupom Não Fiscal (2ª VIA) - ${saleId}`
      : `Cupom Não Fiscal - ${saleId}`

    // Cabeçalho do cupom se for 2ª via
    const reprintHeader = isReprint ? `
========================================
                2ª VIA
========================================
` : ''

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${windowTitle}</title>
          <style>
            /* Reset e configurações básicas */
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: 'Courier New', monospace;
              font-size: 8px;
              line-height: 1.1;
              color: #000;
              background: #fff;
              padding: 2mm;
              width: 100%;
            }

            .receipt {
              width: 54mm; /* Largura padrão impressora térmica 58mm menos margens */
              margin: 0 auto;
              word-wrap: break-word;
              overflow-wrap: break-word;
            }

            pre {
              white-space: pre-wrap;
              margin: 0;
              font-family: 'Courier New', monospace;
              font-size: 8px;
              line-height: 1.1;
            }

            /* Configurações específicas para impressão */
            @media print {
              @page {
                size: 58mm auto;
                margin: 2mm;
              }

              body {
                margin: 0;
                padding: 1mm;
                font-size: 7px;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              .receipt {
                width: 100%;
                max-width: 54mm;
              }

              /* Ocultar elementos desnecessários na impressão */
              @media print {
                button, .no-print { display: none !important; }
              }
            }

            /* Para impressoras que suportam mais largura */
            @media print and (min-width: 80mm) {
              @page { size: 80mm auto; }
              .receipt { width: 76mm; }
              body { font-size: 9px; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <pre>${reprintHeader}${receiptText}</pre>
          </div>
        </body>
      </html>
    `)

    printWindow.document.close()

    // Aguardar carregamento e depois imprimir com melhor timing
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus()
        printWindow.print()

        // Fechar janela após impressão com delay
        setTimeout(() => {
          printWindow.close()
          onEndPrint()
        }, 1000)
      }, 500)
    }

    // Fallback caso onload não funcione
    setTimeout(() => {
      if (printWindow && !printWindow.closed) {
        printWindow.focus()
        printWindow.print()
        setTimeout(() => {
          printWindow.close()
          onEndPrint()
        }, 1000)
      }
    }, 2000)

  } catch (error) {
    console.error("Erro ao abrir janela de impressão:", error)
    alert("❌ Erro ao abrir impressão.\n\nTente:\n1. Atualizar a página\n2. Usar Ctrl+P para imprimir")
    onEndPrint()
  }
}

/**
 * Converte dados do PDV para formato do cupom térmico
 */
export const convertPDVDataToThermalReceipt = (pdvData: PDVReceiptData): ThermalReceiptData => {
  return {
    id: pdvData.id,
    items: pdvData.items.map((item: PDVSaleItem) => ({
      name: item.name,
      displayName: item.displayName,
      sku: item.sku,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.subtotal,
      volume: item.volume
    })),
    customer: {
      name: pdvData.customer.name,
      type: pdvData.customer.type
    },
    subtotal: pdvData.subtotal,
    discountPercent: pdvData.discountPercent,
    discountAmount: pdvData.discountAmount,
    total: pdvData.total,
    paymentMethod: pdvData.paymentMethod,
    amountPaid: pdvData.amountPaid,
    change: pdvData.change,
    notes: pdvData.notes,
    createdAt: pdvData.createdAt,
    userName: pdvData.userName,
    salespersonName: pdvData.salespersonName
  }
}

/**
 * Converte dados de venda para formato do cupom térmico
 */
export const convertSaleDataToThermalReceipt = (saleData: SaleWithDetails): ThermalReceiptData => {
  return {
    id: saleData.id,
    items: saleData.sale_items?.map((item: SaleItemWithProduct) => ({
      name: item.product_name,
      displayName: item.product_name,
      sku: item.product_sku,
      price: item.unit_price,
      quantity: item.quantity,
      subtotal: item.total_price,
      volume: item.product?.volumes ? JSON.parse(item.product.volumes as string) : undefined
    })) || [],
    customer: {
      name: saleData.customer_name || saleData.customer?.name || 'Cliente',
      type: (saleData.customer_type || saleData.customer?.type || 'retail') as 'retail' | 'wholesale'
    },
    subtotal: saleData.subtotal || 0,
    discountPercent: saleData.discount_percent || 0,
    discountAmount: saleData.discount_amount || 0,
    total: saleData.total,
    paymentMethod: saleData.payment_method,
    notes: saleData.notes || undefined,
    createdAt: saleData.created_at,
    userName: saleData.user_name,
    salespersonName: saleData.salesperson_name || undefined
  }
}
