import { Resend } from 'resend'
import fs from 'fs'
import path from 'path'

// Inicializar Resend
const resend = new Resend(process.env.RESEND_API_KEY)

// Configurações do email
const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'HP Marcas <pedidos@hpmarcas.com.br>',
  supportEmail: process.env.SUPPORT_EMAIL || 'suporte@hpmarcas.com.br',
  whatsappNumber: process.env.WHATSAPP_NUMBER || '(11) 99999-9999',
  whatsappUrl: process.env.WHATSAPP_URL || 'https://wa.me/5511999999999',
  websiteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://hpmarcas.com.br',
  companyAddress: process.env.COMPANY_ADDRESS || 'São Paulo, SP - Brasil',
  companyCnpj: process.env.COMPANY_CNPJ || '00.000.000/0001-00',
  socialUrls: {
    instagram: process.env.INSTAGRAM_URL || 'https://instagram.com/hpmarcas',
    facebook: process.env.FACEBOOK_URL || 'https://facebook.com/hpmarcas',
  }
}

// Tipos para os dados do email
export interface OrderEmailData {
  orderId: string
  orderNumber: string
  customerName: string
  customerEmail: string
  orderDate: string
  paymentMethod: string
  orderStatus: string
  items: Array<{
    productName: string
    quantity: number
    unitPrice: number
    totalPrice: number
    imageUrl?: string
    sku: string
  }>
  subtotal: number
  shippingCost?: number
  discount?: number
  totalAmount: number
  shippingAddress?: {
    name: string
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }
  isPix?: boolean
  trackingNumber?: string
  estimatedDelivery?: string
  paymentId?: string
  invoiceKey?: string
}

// Função para carregar template HTML
function loadTemplate(templateName: string): string {
  const templatePath = path.join(process.cwd(), 'src', 'email-templates', `${templateName}.html`)

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template ${templateName} não encontrado em ${templatePath}`)
  }

  return fs.readFileSync(templatePath, 'utf-8')
}

// Função para substituir variáveis no template
function replaceTemplateVariables(template: string, data: Record<string, unknown>): string {
  let result = template

  // Função auxiliar para acessar propriedades aninhadas
  function getNestedValue(obj: unknown, path: string): unknown {
    const keys = path.split('.')
    let current = obj

    for (const key of keys) {
      if (current && typeof current === 'object' && current !== null) {
        current = (current as Record<string, unknown>)[key]
      } else {
        return undefined
      }
    }

    return current
  }

  // Substituições simples e objetos aninhados
  Object.keys(data).forEach(key => {
    const value = data[key]
    if (typeof value === 'string' || typeof value === 'number') {
      const regex = new RegExp(`{{${key}}}`, 'g')
      result = result.replace(regex, String(value))
    }
  })

  // Substituições para propriedades de objetos aninhados (ex: SHIPPING_ADDRESS.NAME)
  result = result.replace(/{{(\w+)\.(\w+)}}/g, (match, objectName, propertyName) => {
    const objectValue = data[objectName]
    if (objectValue && typeof objectValue === 'object') {
      const nestedValue = getNestedValue(objectValue, propertyName)
      return nestedValue ? String(nestedValue) : ''
    }
    return match // retorna o match original se não encontrar
  })

  // Substituições condicionais
  result = result.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, condition, content) => {
    return data[condition] ? content : ''
  })

  // Substituições condicionais para propriedades aninhadas
  result = result.replace(/{{#if\s+(\w+)\.(\w+)}}([\s\S]*?){{\/if}}/g, (match, objectName, propertyName, content) => {
    const objectValue = data[objectName]
    if (objectValue && typeof objectValue === 'object') {
      const nestedValue = getNestedValue(objectValue, propertyName)
      return nestedValue ? content : ''
    }
    return ''
  })

  // Substituições de loops (simplificado para arrays)
  result = result.replace(/{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g, (match, arrayName, itemTemplate) => {
    const array = data[arrayName]
    if (!Array.isArray(array)) return ''

    return array.map(item => {
      let itemHtml = itemTemplate
      Object.keys(item).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g')
        itemHtml = itemHtml.replace(regex, String(item[key]))
      })
      return itemHtml
    }).join('')
  })

  return result
}

// Função para formatar valor monetário
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

// Função para formatar data
function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj)
}

// Função para obter nome do método de pagamento
function getPaymentMethodName(method: string): string {
  const methods: Record<string, string> = {
    'pix': 'PIX',
    'credit_card': 'Cartão de Crédito',
    'debit_card': 'Cartão de Débito',
    'bank_slip': 'Boleto Bancário',
    'cash': 'Dinheiro'
  }
  return methods[method] || method
}

// Função para obter status do pedido em português
function getOrderStatusName(status: string): string {
  const statuses: Record<string, string> = {
    'pending': 'Aguardando Pagamento',
    'confirmed': 'Confirmado',
    'processing': 'Em Preparação',
    'shipped': 'Enviado',
    'delivered': 'Entregue',
    'cancelled': 'Cancelado'
  }
  return statuses[status] || status
}

// Função principal para enviar email de confirmação de pedido
export async function sendOrderConfirmationEmail(orderData: OrderEmailData) {
  try {
    console.log('Enviando email de confirmação de pedido:', orderData.orderId)

    // Carregar template
    const template = loadTemplate('order-confirmation')

    // Preparar dados para o template
    const templateData = {
      ...EMAIL_CONFIG,
      ORDER_NUMBER: orderData.orderNumber,
      ORDER_DATE: formatDate(orderData.orderDate),
      PAYMENT_METHOD: getPaymentMethodName(orderData.paymentMethod),
      ORDER_STATUS: getOrderStatusName(orderData.orderStatus),
      CUSTOMER_NAME: orderData.customerName,
      SUBTOTAL: formatCurrency(orderData.subtotal),
      SHIPPING_COST: orderData.shippingCost ? formatCurrency(orderData.shippingCost) : null,
      DISCOUNT: orderData.discount ? formatCurrency(orderData.discount) : null,
      TOTAL_AMOUNT: formatCurrency(orderData.totalAmount),
      IS_PIX: orderData.isPix,
      SHIPPING_ADDRESS: orderData.shippingAddress ? {
        NAME: orderData.shippingAddress.name,
        STREET: orderData.shippingAddress.street,
        NUMBER: orderData.shippingAddress.number,
        COMPLEMENT: orderData.shippingAddress.complement,
        NEIGHBORHOOD: orderData.shippingAddress.neighborhood,
        CITY: orderData.shippingAddress.city,
        STATE: orderData.shippingAddress.state,
        ZIP_CODE: orderData.shippingAddress.zipCode
      } : null,
      TRACK_ORDER_URL: `${EMAIL_CONFIG.websiteUrl}/minha-conta/pedidos`,
      ACCOUNT_URL: `${EMAIL_CONFIG.websiteUrl}/minha-conta`,
      SUPPORT_URL: `${EMAIL_CONFIG.websiteUrl}/faq`,
      PRIVACY_URL: `${EMAIL_CONFIG.websiteUrl}/politica-privacidade`,
      INSTAGRAM_URL: EMAIL_CONFIG.socialUrls.instagram,
      FACEBOOK_URL: EMAIL_CONFIG.socialUrls.facebook,
      WHATSAPP_NUMBER: EMAIL_CONFIG.whatsappNumber,
      SUPPORT_EMAIL: EMAIL_CONFIG.supportEmail,
      COMPANY_ADDRESS: EMAIL_CONFIG.companyAddress,
      COMPANY_CNPJ: EMAIL_CONFIG.companyCnpj,
      WEBSITE_URL: EMAIL_CONFIG.websiteUrl,
      WHATSAPP_URL: EMAIL_CONFIG.whatsappUrl,
      ITEMS: orderData.items.map(item => ({
        PRODUCT_NAME: item.productName,
        QUANTITY: item.quantity,
        UNIT_PRICE: formatCurrency(item.unitPrice),
        TOTAL_PRICE: formatCurrency(item.totalPrice),
        IMAGE_URL: item.imageUrl || `${EMAIL_CONFIG.websiteUrl}/placeholder.jpg`,
        SKU: item.sku
      }))
    }

    // Gerar HTML do email
    const htmlContent = replaceTemplateVariables(template, templateData)

    // Enviar email
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: [orderData.customerEmail],
      subject: `Pedido #${orderData.orderNumber} - Confirmação HP Marcas`,
      html: htmlContent,
      tags: [
        { name: 'type', value: 'order-confirmation' },
        { name: 'order_id', value: orderData.orderId }
      ]
    })

    return { success: true, emailId: result.data?.id }

  } catch (error) {
    console.error('Erro ao enviar email de confirmação:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

// Função para enviar email de pagamento confirmado
export async function sendPaymentConfirmedEmail(orderData: OrderEmailData) {
  try {

    // Carregar template
    const template = loadTemplate('payment-confirmed')

    // Preparar dados para o template
    const templateData = {
      ...EMAIL_CONFIG,
      ORDER_NUMBER: orderData.orderNumber,
      PAYMENT_DATE: formatDate(new Date()),
      PAYMENT_METHOD: getPaymentMethodName(orderData.paymentMethod),
      ORDER_STATUS: getOrderStatusName(orderData.orderStatus),
      CUSTOMER_NAME: orderData.customerName,
      SUBTOTAL: formatCurrency(orderData.subtotal),
      SHIPPING_COST: orderData.shippingCost ? formatCurrency(orderData.shippingCost) : null,
      DISCOUNT: orderData.discount ? formatCurrency(orderData.discount) : null,
      TOTAL_AMOUNT: formatCurrency(orderData.totalAmount),
      TRACKING_NUMBER: orderData.trackingNumber,
      ESTIMATED_DELIVERY: orderData.estimatedDelivery ? formatDate(orderData.estimatedDelivery) : 'Em breve',
      PAYMENT_ID: orderData.paymentId,
      INVOICE_KEY: orderData.invoiceKey,
      TRACK_ORDER_URL: `${EMAIL_CONFIG.websiteUrl}/minha-conta/pedidos`,
      TRACKING_URL: orderData.trackingNumber ? `https://rastreamento.correios.com.br/app/index.php?codigo=${orderData.trackingNumber}` : null,
      ACCOUNT_URL: `${EMAIL_CONFIG.websiteUrl}/minha-conta`,
      SUPPORT_URL: `${EMAIL_CONFIG.websiteUrl}/faq`,
      PRIVACY_URL: `${EMAIL_CONFIG.websiteUrl}/politica-privacidade`,
      INSTAGRAM_URL: EMAIL_CONFIG.socialUrls.instagram,
      FACEBOOK_URL: EMAIL_CONFIG.socialUrls.facebook,
      WHATSAPP_NUMBER: EMAIL_CONFIG.whatsappNumber,
      SUPPORT_EMAIL: EMAIL_CONFIG.supportEmail,
      COMPANY_ADDRESS: EMAIL_CONFIG.companyAddress,
      COMPANY_CNPJ: EMAIL_CONFIG.companyCnpj,
      WEBSITE_URL: EMAIL_CONFIG.websiteUrl,
      WHATSAPP_URL: EMAIL_CONFIG.whatsappUrl
    }

    // Gerar HTML do email
    const htmlContent = replaceTemplateVariables(template, templateData)

    // Enviar email
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: [orderData.customerEmail],
      subject: `Pagamento Confirmado - Pedido #${orderData.orderNumber} - HP Marcas`,
      html: htmlContent,
      tags: [
        { name: 'type', value: 'payment-confirmed' },
        { name: 'order_id', value: orderData.orderId }
      ]
    })

    console.log('Email de pagamento confirmado enviado com sucesso:', result.data?.id)
    return { success: true, emailId: result.data?.id }

  } catch (error) {
    console.error('Erro ao enviar email de pagamento confirmado:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

// Função para testar configuração do email
export async function testEmailConfiguration() {
  try {
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: ['test@example.com'],
      subject: 'Teste de Configuração - HP Marcas',
      html: '<h1>Configuração de Email OK!</h1><p>O sistema de emails está funcionando corretamente.</p>'
    })

    return { success: true, emailId: result.data?.id }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}
