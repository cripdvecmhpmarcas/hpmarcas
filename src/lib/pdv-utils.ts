// src/lib/pdv-utils.ts

/**
 * Utilitários para o sistema PDV
 */

// Funções de arredondamento para evitar problemas de precisão numérica
export const roundToTwoDecimals = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

export const safeAdd = (...values: number[]): number => {
  const sum = values.reduce((acc, val) => acc + val, 0);
  return roundToTwoDecimals(sum);
};

export const safeSubtract = (a: number, b: number): number => {
  return roundToTwoDecimals(a - b);
};

export const safeMultiply = (a: number, b: number): number => {
  return roundToTwoDecimals(a * b);
};

export const safeDivide = (a: number, b: number): number => {
  if (b === 0) return 0;
  return roundToTwoDecimals(a / b);
};

export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return roundToTwoDecimals((value / total) * 100);
};

export const applyPercentageDiscount = (value: number, percentage: number): number => {
  const discount = safeMultiply(value, percentage / 100);
  return safeSubtract(value, discount);
};

// Formatar valores monetários
export const formatCurrency = (value: number): string => {
  const roundedValue = roundToTwoDecimals(value);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(roundedValue);
};

// Formatar data
export const formatDate = (date: string | Date): { date: string; time: string } => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return {
    date: dateObj.toLocaleDateString("pt-BR"),
    time: dateObj.toLocaleTimeString("pt-BR"),
  };
};

// Validar código de barras
export const validateBarcode = (barcode: string): { valid: boolean; message: string } => {
  const trimmed = barcode.trim();

  if (trimmed.length < 8) {
    return { valid: false, message: "Código deve ter pelo menos 8 dígitos" };
  }

  if (trimmed.length > 20) {
    return { valid: false, message: "Código deve ter no máximo 20 dígitos" };
  }

  if (!/^\d+$/.test(trimmed)) {
    return { valid: false, message: "Código deve conter apenas números" };
  }

  return { valid: true, message: "Código válido" };
};

// Calcular troco
export const calculateChange = (amountPaid: number, total: number): number => {
  return Math.max(0, amountPaid - total);
};

// Gerar sugestões de valores para dinheiro
export const generateCashSuggestions = (total: number): number[] => {
  const suggestions = [
    total,
    Math.ceil(total / 5) * 5,     // Próximo múltiplo de 5
    Math.ceil(total / 10) * 10,   // Próximo múltiplo de 10
    Math.ceil(total / 20) * 20,   // Próximo múltiplo de 20
    Math.ceil(total / 50) * 50,   // Próximo múltiplo de 50
    Math.ceil(total / 100) * 100, // Próximo múltiplo de 100
  ];

  // Remove duplicatas e ordena
  return [...new Set(suggestions)].sort((a, b) => a - b);
};

// Formatar método de pagamento
export const formatPaymentMethod = (method: string): string => {
  const methods: Record<string, string> = {
    cash: "Dinheiro",
    credit: "Cartão Crédito",
    debit: "Cartão Débito",
    pix: "PIX",
    transfer: "Transferência",
  };
  return methods[method] || method;
};

// Gerar SKU automático
export const generateSKU = (prefix: string = "PDV"): string => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `${prefix}-${timestamp.slice(-6)}${random}`;
};

// Validar preço
export const validatePrice = (price: string | number): { valid: boolean; value: number; message: string } => {
  const numericPrice = typeof price === "string" ? parseFloat(price) : price;

  if (isNaN(numericPrice)) {
    return { valid: false, value: 0, message: "Preço deve ser um número válido" };
  }

  if (numericPrice < 0) {
    return { valid: false, value: 0, message: "Preço não pode ser negativo" };
  }

  if (numericPrice > 999999.99) {
    return { valid: false, value: 0, message: "Preço muito alto" };
  }

  return { valid: true, value: numericPrice, message: "Preço válido" };
};

// Calcular desconto
export const calculateDiscount = (
  subtotal: number,
  type: "percent" | "amount",
  value: number
): { discountAmount: number; discountPercent: number } => {
  if (type === "percent") {
    const percent = Math.min(Math.max(value, 0), 100);
    const amount = (subtotal * percent) / 100;
    return { discountAmount: amount, discountPercent: percent };
  } else {
    const amount = Math.min(Math.max(value, 0), subtotal);
    const percent = subtotal > 0 ? (amount / subtotal) * 100 : 0;
    return { discountAmount: amount, discountPercent: percent };
  }
};

// Detectar se entrada é de leitor de código de barras
export const detectBarcodeReader = (
  inputValue: string,
  inputStartTime: number,
  threshold: number = 50
): boolean => {
  const inputDuration = Date.now() - inputStartTime;
  const avgCharTime = inputDuration / inputValue.length;
  return avgCharTime < threshold && inputValue.length >= 8;
};

// Gerar ID de venda
export const generateSaleId = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().slice(2, 10).replace(/-/g, ""); // YYMMDD
  const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, ""); // HHMMSS
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `${dateStr}${timeStr}${random}`;
};

// Validar quantidade
export const validateQuantity = (quantity: string | number): { valid: boolean; value: number; message: string } => {
  const numericQty = typeof quantity === "string" ? parseInt(quantity) : quantity;

  if (isNaN(numericQty)) {
    return { valid: false, value: 1, message: "Quantidade deve ser um número" };
  }

  if (numericQty < 1) {
    return { valid: false, value: 1, message: "Quantidade deve ser pelo menos 1" };
  }

  if (numericQty > 999) {
    return { valid: false, value: 999, message: "Quantidade muito alta" };
  }

  return { valid: true, value: numericQty, message: "Quantidade válida" };
};

// Truncar texto
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
};

// Calcular preço baseado no tipo de cliente
export const calculateCustomerPrice = (
  retailPrice: number,
  wholesalePrice: number,
  customerType: "retail" | "wholesale"
): number => {
  return customerType === "wholesale" ? wholesalePrice : retailPrice;
};

// Formatar número para display
export const formatNumber = (value: number, decimals: number = 2): string => {
  return value.toFixed(decimals);
};

// Validar estoque
export const validateStock = (currentStock: number, requestedQuantity: number): {
  valid: boolean;
  available: number;
  message: string
} => {
  if (currentStock <= 0) {
    return {
      valid: false,
      available: 0,
      message: "Produto sem estoque"
    };
  }

  if (requestedQuantity > currentStock) {
    return {
      valid: false,
      available: currentStock,
      message: `Apenas ${currentStock} unidades disponíveis`
    };
  }

  return {
    valid: true,
    available: currentStock,
    message: "Estoque suficiente"
  };
};

// Gerar texto do cupom fiscal
export const generateReceiptText = (saleData: PDVSaleData): string => {
  const { date, time } = formatDate(saleData.createdAt);

  let receipt = `
======================================
           HP MARCAS PERFUMES
======================================
CNPJ: 12.345.678/0001-90
Email: hpmarcas@gmail.com
======================================

CUPOM FISCAL NÃO OFICIAL

Data: ${date}        Hora: ${time}
Venda: ${saleData.id}
Operador: ${saleData.userName || "Sistema"}

Cliente: ${saleData.customer.name}
Tipo: ${saleData.customer.type === "wholesale" ? "Atacado" : "Varejo"}

======================================
PRODUTOS
======================================
`;

  saleData.items.forEach((item: PDVSaleItem, index: number) => {
    receipt += `
${(index + 1).toString().padStart(3, "0")} ${item.name}
    SKU: ${item.sku}
    ${item.quantity}x ${formatCurrency(item.price)} = ${formatCurrency(item.subtotal)}
`;
  });

  receipt += `
======================================
RESUMO
======================================
Subtotal:           ${formatCurrency(saleData.subtotal)}`;

  if (saleData.discountAmount > 0) {
    receipt += `
Desconto (${saleData.discountPercent.toFixed(1)}%):      -${formatCurrency(saleData.discountAmount)}`;
  }

  receipt += `
TOTAL:              ${formatCurrency(saleData.total)}

Pagamento: ${formatPaymentMethod(saleData.paymentMethod)}`;

  if (saleData.paymentMethod === "cash" && saleData.amountPaid) {
    receipt += `
Valor Recebido:     ${formatCurrency(saleData.amountPaid)}
Troco:              ${formatCurrency(saleData.change || 0)}`;
  }

  if (saleData.notes) {
    receipt += `
Observações: ${saleData.notes}`;
  }

  receipt += `

======================================
        OBRIGADO PELA PREFERÊNCIA!
======================================
Volte sempre!
Siga-nos nas redes sociais
@hpmarcasperfumes

======================================
`;

  return receipt;
};

// Constantes do sistema
export const PDV_CONSTANTS = {
  MIN_BARCODE_LENGTH: 8,
  MAX_BARCODE_LENGTH: 20,
  SCAN_TIMEOUT: 100,
  SCAN_SPEED_THRESHOLD: 50,
  MAX_QUANTITY: 999,
  MAX_PRICE: 999999.99,
  DEFAULT_WHOLESALE_DISCOUNT: 0.2, // 20%
  DEFAULT_COST_MARGIN: 0.6, // 60% do preço de venda
} as const;

// Tipos para o sistema PDV
export interface PDVProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  barcode: string | null;
  sku: string;
  retail_price: number;
  wholesale_price: number;
  stock: number;
  images: string[] | null;
}

export interface PDVSaleItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface PDVCustomer {
  id: string;
  name: string;
  type: "retail" | "wholesale";
  discount: number;
}

export interface PDVSaleData {
  items: PDVSaleItem[];
  customer: PDVCustomer;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  paymentMethod: string; // "cash", "credit", "debit", "pix", "transfer"
  notes: string;
  amountPaid?: number;
  change?: number;
  createdAt: string | Date;
  id: string;
  userName?: string; // Nome do operador
}

// Helpers para debugging
export const logPDVAction = (action: string, data?: unknown) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[PDV] ${action}`, data);
  }
};

export const formatPDVError = (error: unknown): string => {
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null) {
    if ("message" in error && typeof (error as { message?: unknown }).message === "string") {
      return (error as { message: string }).message;
    }
    if ("error" in error && typeof (error as { error?: unknown }).error === "string") {
      return (error as { error: string }).error;
    }
  }
  return "Erro desconhecido no sistema PDV";
};
