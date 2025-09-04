// Import unified CartDisplayItem
import type { CartDisplayItem } from '@/types/checkout'

// Item básico para armazenamento no localStorage (apenas dados essenciais)
export interface CartStorageItem {
  productId: string;
  quantity: number;
  volume?: {
    size: string;
    unit: string;
    barcode?: string;
    price_adjustment?: number;
  };
}

// Re-export unified CartDisplayItem from checkout types
export type { CartDisplayItem } from '@/types/checkout'

// Resumo do carrinho para exibição
export interface CartSummary {
  itemCount: number;
  subtotal: number;
  total: number;
  hasWholesaleItems: boolean;
  totalDiscount: number;
}

// Props dos componentes
export interface CartHeaderProps {
  itemCount: number;
  isWholesale: boolean;
  className?: string;
}

export interface CartEmptyProps {
  className?: string;
}

export interface CartItemProps {
  item: CartDisplayItem;
  onUpdateQuantity: (productId: string, quantity: number, volume?: { size: string; unit: string; }) => void;
  onRemove: (productId: string, volume?: { size: string; unit: string; }) => void;
  loading?: boolean;
  className?: string;
}

export interface CartItemsProps {
  items: CartDisplayItem[];
  onUpdateQuantity: (productId: string, quantity: number, volume?: { size: string; unit: string; }) => void;
  onRemove: (productId: string, volume?: { size: string; unit: string; }) => void;
  loading?: boolean;
  className?: string;
}

export interface CartSummaryProps {
  summary: CartSummary;
  isAnonymous: boolean;
  loading?: boolean;
  className?: string;
}

export interface CartActionsProps {
  className?: string;
}

export interface CartSecurityInfoProps {
  className?: string;
}

// Return types dos hooks
export interface UseCartReturn {
  cartItems: CartStorageItem[];
  addItem: (productId: string, quantity?: number, volume?: { size: string; unit: string; barcode?: string; price_adjustment?: number; }) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  getItemCount: () => number;
  loading: boolean;
  error: string | null;
}

export interface UseCartItemsReturn {
  displayItems: CartDisplayItem[];
  summary: CartSummary;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Configurações
export const CART_STORAGE_KEY = "cart";
export const getUserCartKey = (userId: string) => `cart_${userId}`;

export const STOCK_THRESHOLDS = {
  LOW_STOCK: 5,
  OUT_OF_STOCK: 0,
} as const;
