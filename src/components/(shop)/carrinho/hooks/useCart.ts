import { useState, useEffect, useCallback } from "react";
import { useAnonymousAuth } from "@/components/auth/AnonymousAuthProvider";
import { toast } from "sonner";
import { CART_STORAGE_KEY, getUserCartKey } from "../types";

// Declarar tipos inline para resolver problema TypeScript
interface CartStorageItem {
  productId: string;
  quantity: number;
  volume?: {
    size: string;
    unit: string;
    barcode?: string;
    price_adjustment?: number;
  };
}

interface UseCartReturn {
  cartItems: CartStorageItem[];
  addItem: (productId: string, quantity?: number, volume?: { size: string; unit: string; barcode?: string; price_adjustment?: number; }) => void;
  updateQuantity: (productId: string, quantity: number, volume?: { size: string; unit: string; }) => void;
  removeItem: (productId: string, volume?: { size: string; unit: string; }) => void;
  clearCart: () => void;
  getItemCount: () => number;
  loading: boolean;
  error: string | null;
}

// Função para encontrar item específico
const findItemByKey = (items: CartStorageItem[], productId: string, volume?: { size: string; unit: string; }) => {
  return items.find(item => {
    if (volume) {
      return item.productId === productId &&
             item.volume?.size === volume.size &&
             item.volume?.unit === volume.unit;
    }
    return item.productId === productId && !item.volume;
  });
};

export function useCart(): UseCartReturn {
  const [cartItems, setCartItems] = useState<CartStorageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAnonymousAuth();

  // Determinar chave do localStorage baseado no usuário
  const getStorageKey = useCallback(() => {
    return user ? getUserCartKey(user.id) : CART_STORAGE_KEY;
  }, [user]);

  // Carregar carrinho do localStorage
  const loadCart = useCallback(() => {
    try {
      setLoading(true);
      setError(null);

      const storageKey = getStorageKey();
      const savedCart = localStorage.getItem(storageKey);

      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(Array.isArray(parsedCart) ? parsedCart : []);
      } else {
        setCartItems([]);
      }
    } catch (err) {
      console.error("Erro ao carregar carrinho:", err);
      setError("Erro ao carregar carrinho");
      toast.error("Erro ao carregar carrinho");
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, [getStorageKey]);

  // Salvar carrinho no localStorage
  const saveCart = useCallback((items: CartStorageItem[]) => {
    try {
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch (err) {
      console.error("Erro ao salvar carrinho:", err);
      setError("Erro ao salvar carrinho");
      toast.error("Erro ao salvar carrinho");
    }
  }, [getStorageKey]);

  // Migrar carrinho anônimo para usuário logado
  const migrateAnonymousCart = useCallback(() => {
    if (!user) return;

    try {
      const anonymousCart = localStorage.getItem(CART_STORAGE_KEY);
      const userCart = localStorage.getItem(getUserCartKey(user.id));

      if (anonymousCart && !userCart) {
        // Migrar carrinho anônimo para usuário logado
        localStorage.setItem(getUserCartKey(user.id), anonymousCart);
        localStorage.removeItem(CART_STORAGE_KEY);

        // Recarregar carrinho com nova chave
        loadCart();
      }
    } catch (err) {
      console.error("Erro ao migrar carrinho:", err);
    }
  }, [user, loadCart]);

  // Carregar carrinho quando componente monta ou usuário muda
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Migrar carrinho quando usuário faz login
  useEffect(() => {
    if (user && !loading) {
      migrateAnonymousCart();
    }
  }, [user, loading, migrateAnonymousCart]);

  // Adicionar item ao carrinho
  const addItem = useCallback((productId: string, quantity: number = 1, volume?: { size: string; unit: string; barcode?: string; price_adjustment?: number; }) => {
    setCartItems(prevItems => {
      const existingItem = findItemByKey(prevItems, productId, volume);
      let newItems: CartStorageItem[];

      if (existingItem) {
        // Atualizar quantidade do item existente
        newItems = prevItems.map(item =>
          item === existingItem
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
        // toast.success(`Quantidade atualizada no carrinho`);
      } else {
        // Adicionar novo item
        const newItem: CartStorageItem = { productId, quantity };
        if (volume) {
          newItem.volume = volume;
        }
        newItems = [...prevItems, newItem];
        toast.success(`Produto adicionado ao carrinho`);
      }

      saveCart(newItems);
      return newItems;
    });
  }, [saveCart]);

  // Remover item do carrinho
  const removeItem = useCallback((productId: string, volume?: { size: string; unit: string; }) => {
    setCartItems(prevItems => {
      const itemToRemove = findItemByKey(prevItems, productId, volume);
      if (!itemToRemove) return prevItems;

      const newItems = prevItems.filter(item => item !== itemToRemove);
      saveCart(newItems);
      toast.success(`Produto removido do carrinho`);
      return newItems;
    });
  }, [saveCart]);

  // Atualizar quantidade de um item
  const updateQuantity = useCallback((productId: string, quantity: number, volume?: { size: string; unit: string; }) => {
    if (quantity <= 0) {
      removeItem(productId, volume);
      return;
    }

    setCartItems(prevItems => {
      const itemToUpdate = findItemByKey(prevItems, productId, volume);
      if (!itemToUpdate) return prevItems;

      const newItems = prevItems.map(item =>
        item === itemToUpdate
          ? { ...item, quantity }
          : item
      );

      saveCart(newItems);
      toast.success(`Quantidade atualizada`);
      return newItems;
    });
  }, [saveCart, removeItem]);



  // Limpar carrinho
  const clearCart = useCallback(() => {
    setCartItems([]);
    try {
      const storageKey = getStorageKey();
      localStorage.removeItem(storageKey);
    } catch (err) {
      console.error("Erro ao limpar carrinho:", err);
    }
  }, [getStorageKey]);

  // Obter contagem total de itens
  const getItemCount = useCallback(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  return {
    cartItems,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    getItemCount,
    loading,
    error,
  };
}
