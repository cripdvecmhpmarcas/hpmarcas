import { useMemo } from "react";
import { 
  useCart as useNewCart, 
  useCartItems 
} from "@/components/(shop)/carrinho";

// Manter interface antiga para compatibilidade
interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  sku: string;
}

interface UseCartReturn {
  items: CartItem[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addItem: (product: any, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  loading: boolean;
}

export const useCart = (): UseCartReturn => {
  // Usar o novo sistema de carrinho internamente
  const { 
    cartItems, 
    addItem: addNewItem, 
    removeItem: removeNewItem, 
    updateQuantity: updateNewQuantity, 
    clearCart: clearNewCart, 
    getItemCount: getNewItemCount, 
    loading: cartLoading 
  } = useNewCart();
  
  const { displayItems, summary, loading: itemsLoading } = useCartItems(cartItems);

  const loading = cartLoading || itemsLoading;

  // Converter displayItems para formato antigo para compatibilidade
  const items: CartItem[] = useMemo(() => {
    return displayItems.map(item => ({
      productId: item.productId,
      name: item.name,
      price: item.currentPrice,
      quantity: item.quantity,
      image: item.images?.[0] || "",
      sku: item.sku,
    }));
  }, [displayItems]);

  // Implementar addItem com lógica adaptada
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addItem = (product: any, quantity: number = 1) => {
    const productId = product.productId || product.id;
    addNewItem(productId, quantity);
  };

  const removeItem = (productId: string) => {
    removeNewItem(productId);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    updateNewQuantity(productId, quantity);
  };

  const clearCart = () => {
    clearNewCart();
  };

  const getTotal = () => {
    return summary.total;
  };

  const getItemCount = () => {
    return getNewItemCount();
  };

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotal,
    getItemCount,
    loading,
  };
};
