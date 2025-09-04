import { useState, useEffect, useCallback, useMemo } from "react";
import { useSupabasePublic } from "@/hooks/useSupabasePublic";
import { useAnonymousAuth } from "@/components/auth/AnonymousAuthProvider";
import type { Product } from "@/types/products";
import type {
  CartStorageItem,
  CartDisplayItem,
  CartSummary,
  UseCartItemsReturn
} from "../types";
import { STOCK_THRESHOLDS } from "../types";

export function useCartItems(cartItems: CartStorageItem[]): UseCartItemsReturn {
  const [displayItems, setDisplayItems] = useState<CartDisplayItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { supabase } = useSupabasePublic();
  const { customer } = useAnonymousAuth();

  // Calcular preço baseado no tipo de cliente e volume
  const calculatePrice = useCallback((product: Product, volume?: { size: string; unit: string; barcode?: string; price_adjustment?: number; }) => {
    const isWholesale = customer?.type === "wholesale";
    let basePrice = isWholesale ? product.wholesale_price : product.retail_price;
    const originalPrice = product.retail_price;

    // Aplicar ajuste de preço do volume
    if (volume?.price_adjustment) {
      basePrice += volume.price_adjustment;
    }

    const currentPrice = basePrice;
    const hasDiscount = isWholesale && currentPrice !== originalPrice;
    const discountPercent = hasDiscount
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : 0;

    return {
      currentPrice,
      originalPrice,
      isWholesale,
      hasDiscount,
      discountPercent,
    };
  }, [customer]);

  // Determinar status do estoque
  const getStockStatus = useCallback((stock: number): "in_stock" | "low_stock" | "out_of_stock" => {
    if (stock <= STOCK_THRESHOLDS.OUT_OF_STOCK) return "out_of_stock";
    if (stock <= STOCK_THRESHOLDS.LOW_STOCK) return "low_stock";
    return "in_stock";
  }, []);

  // Buscar dados dos produtos
  const fetchProductData = useCallback(async () => {
    if (cartItems.length === 0) {
      setDisplayItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const productIds = cartItems.map(item => item.productId);

      const { data: products, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .in("id", productIds)
        .eq("status", "active");

      if (fetchError) {
        throw new Error(`Erro ao buscar produtos: ${fetchError.message}`);
      }

      // Mapear produtos encontrados para CartDisplayItem
      const foundProducts = products || [];
      const displayItemsData: CartDisplayItem[] = [];

      cartItems.forEach(cartItem => {
        const product = foundProducts.find((p: Product) => p.id === cartItem.productId);

        if (product) {
          const pricing = calculatePrice(product, cartItem.volume);
          const stockStatus = getStockStatus(product.stock);

          // Criar nome para exibição incluindo volume se presente
          let displayName = product.name;
          if (cartItem.volume) {
            displayName = `${product.name} - ${cartItem.volume.size}${cartItem.volume.unit}`;
          }

          displayItemsData.push({
            productId: cartItem.productId,
            quantity: cartItem.quantity,
            name: displayName,
            sku: product.sku,
            images: product.images,
            brand: product.brand,
            description: product.description,
            stock: product.stock,
            // Dados de envio para cálculo de frete
            weight: product.weight,
            length: product.length,
            width: product.width,
            height: product.height,
            stockStatus,
            isAvailable: stockStatus !== "out_of_stock",
            volume: cartItem.volume ? {
              ...cartItem.volume,
              displayName: `${cartItem.volume.size}${cartItem.volume.unit}`
            } : undefined,
            ...pricing,
            // Campos de compatibilidade:
            id: cartItem.productId,
            price: pricing.currentPrice,
            total: pricing.currentPrice * cartItem.quantity,
            stock_quantity: product.stock,
            is_wholesale: pricing.isWholesale,
          });
        } else {
          // Produto não encontrado (foi deletado ou inativo)
          console.warn(`Produto ${cartItem.productId} não encontrado ou inativo`);
        }
      });

      setDisplayItems(displayItemsData);
    } catch (err) {
      console.error("Erro ao buscar dados dos produtos:", err);
      setError(err instanceof Error ? err.message : "Erro ao carregar produtos do carrinho");
      setDisplayItems([]);
    } finally {
      setLoading(false);
    }
  }, [cartItems, supabase, calculatePrice, getStockStatus]);

  // Calcular resumo do carrinho
  const summary = useMemo((): CartSummary => {
    const itemCount = displayItems.reduce((total, item) => total + item.quantity, 0);
    const subtotal = displayItems.reduce((total, item) => total + (item.currentPrice * item.quantity), 0);
    const hasWholesaleItems = displayItems.some(item => item.isWholesale);
    const totalDiscount = displayItems.reduce((total, item) => {
      if (item.hasDiscount) {
        return total + ((item.originalPrice - item.currentPrice) * item.quantity);
      }
      return total;
    }, 0);

    return {
      itemCount,
      subtotal,
      total: subtotal, // Por enquanto igual ao subtotal, pode incluir frete futuramente
      hasWholesaleItems,
      totalDiscount,
    };
  }, [displayItems]);

  // Recarregar dados quando cartItems mudam
  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);

  // Função para forçar refresh dos dados
  const refresh = useCallback(async () => {
    await fetchProductData();
  }, [fetchProductData]);

  return {
    displayItems,
    summary,
    loading,
    error,
    refresh,
  };
}
