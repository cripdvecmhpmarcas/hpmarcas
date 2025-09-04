// src/types/pdv.ts
import { Tables } from './database';
import type { ProductVolume, ProductWithVolumes } from './products';

// Tipos baseados no schema do Supabase para o PDV
export type Product = Tables<'products'>;
export type Customer = Tables<'customers'>;
export type Sale = Tables<'sales'>;
export type SaleItem = Tables<'sale_items'>;
export type Profile = Tables<'profiles'>;

// Tipos específicos do PDV
export type PaymentMethod = "cash" | "credit" | "debit" | "pix" | "transfer";

export interface PDVSaleItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  subtotal: number;
  availableStock?: number;
  // Suporte a volumes
  volume?: ProductVolume;
  displayName?: string; // Nome para exibição incluindo volume (ex: "Perfume XYZ - 500ml")
  // Desconto individual no item
  itemDiscountPercent?: number;
  itemDiscountAmount?: number;
  originalSubtotal?: number; // Subtotal original antes do desconto
  // Ajuste manual de preço
  manualPriceAdjustment?: number; // Valor adicional em reais aplicado ao total do item
  originalPrice?: number; // Preço original por unidade antes do ajuste
}

export interface PDVCustomer {
  id: string;
  name: string;
  type: "retail" | "wholesale";
  discount: number;
}

// Estrutura mínima para persistir no localStorage
export interface PDVCartPersistItem {
  productId: string;
  quantity: number;
  volume?: ProductVolume; // Incluir volume no localStorage
  // Desconto individual no item
  itemDiscountPercent?: number;
  itemDiscountAmount?: number;
  // Ajuste manual de preço
  manualPriceAdjustment?: number;
}

export interface PDVCartPersistData {
  items: PDVCartPersistItem[];
  discountPercent: number;
  discountAmount: number;
  notes: string;
  paymentMethod: PaymentMethod | null;
}

export interface PDVSaleData {
  items: PDVSaleItem[];
  customer: PDVCustomer;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  paymentMethod: PaymentMethod | null;
  notes: string;
}

export interface PDVPaymentData {
  method: PaymentMethod;
  amountPaid?: number;
  change?: number;
  notes?: string;
  salespersonName?: string;
}

export interface PDVReceiptData {
  id: string;
  items: PDVSaleItem[];
  customer: PDVCustomer;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  paymentMethod: string;
  amountPaid?: number;
  change?: number;
  notes?: string;
  createdAt: string;
  userName?: string;
  salespersonName?: string;
}

// Interfaces para os componentes
export interface ProductSearchProps {
  onProductFound: (product: Product | ProductWithVolumes, volume?: ProductVolume) => void;
  onProductNotFound: (barcode: string) => void;
  customerType: "retail" | "wholesale";
  disabled?: boolean;
  autoFocus?: boolean;
}

export interface SaleCartProps {
  items: PDVSaleItem[];
  customer: PDVCustomer;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  paymentMethod: PaymentMethod | null;
  notes: string;
  loading: boolean;
  showDataRecoveredBanner?: boolean;
  onUpdateQuantity: (productId: string, quantity: number) => Promise<{ success: boolean; error?: string }>;
  onRemoveItem: (productId: string) => void;
  onApplyDiscount: (type: "percent" | "amount", value: number) => void;
  onApplyItemDiscount: (productId: string, type: "percent" | "amount", value: number) => void;
  onRemoveItemDiscount: (productId: string) => void;
  onSetPaymentMethod: (method: PaymentMethod) => void;
  onSetNotes: (notes: string) => void;
  onOpenPaymentModal: () => void;
  onClearSale: () => void;
  // Nova função para ajuste manual de preços
  onApplyManualPriceAdjustment: (productId: string, adjustmentAmount: number) => void;
  onRemoveManualPriceAdjustment: (productId: string) => void;
}

export interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  items: PDVSaleItem[];
  customer: PDVCustomer;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  notes: string;
  initialPaymentMethod?: PaymentMethod | null;
  onConfirmSale: (paymentData: PDVPaymentData) => Promise<{ success: boolean; saleId?: string; error?: string }>;
}

export interface ReceiptModalProps {
  open: boolean;
  onClose: () => void;
  saleData: PDVReceiptData;
  onNewSale: () => void;
}

export interface ProductNotFoundModalProps {
  open: boolean;
  onClose: () => void;
  barcode: string;
  onProductCreated: (product: Product) => void;
  onProductLinked: (product: Product) => void;
  customerType: "retail" | "wholesale";
}

// Tipos para dados de inserção no banco
export interface SaleInsertData {
  customer_id: string;
  customer_name: string;
  customer_type: string;
  subtotal: number;
  discount_percent?: number;
  discount_amount?: number;
  total: number;
  payment_method: string;
  notes?: string;
  user_id: string;
  user_name: string;
  salesperson_name?: string;
  status?: string;
}

export interface SaleItemInsertData {
  sale_id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}
