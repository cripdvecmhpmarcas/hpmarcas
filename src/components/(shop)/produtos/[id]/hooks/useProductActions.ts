"use client";

import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import type { UseProductActionsReturn, ProductWithDetails } from "../types";
import type { ProductVolume } from "@/types/products";

// Importar o hook inline para evitar conflitos de tipo
import { useCart as useCartHook } from "@/components/(shop)/carrinho/hooks/useCart";

export const useProductActions = (
  product: ProductWithDetails | null,
  currentPrice: number,
  selectedVolume?: ProductVolume | null
): UseProductActionsReturn => {
  const [quantity, setQuantity] = useState(1);
  const { addItem, cartItems } = useCartHook();

  const maxQuantity = useMemo(() => {
    return product?.stock || 0;
  }, [product?.stock]);

  const isInCart = useMemo(() => {
    if (!product) return false;
    return cartItems.some((item) => item.productId === product.id);
  }, [product, cartItems]);

  const canAddToCart = useMemo(() => {
    if (!product) return false;
    return product.stock > 0 && quantity <= product.stock;
  }, [product, quantity]);

  const incrementQuantity = useCallback(() => {
    if (quantity < maxQuantity) {
      setQuantity((prev) => prev + 1);
    }
  }, [quantity, maxQuantity]);

  const decrementQuantity = useCallback(() => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  }, [quantity]);

  const handleSetQuantity = useCallback((newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  }, [maxQuantity]);

  const handleAddToCart = useCallback(() => {
    if (!product || !canAddToCart) return;

    try {
      // Passar volume se selecionado
      const volumeData = selectedVolume ? {
        size: selectedVolume.size,
        unit: selectedVolume.unit,
        barcode: selectedVolume.barcode,
        price_adjustment: selectedVolume.price_adjustment
      } : undefined;

      addItem(product.id, quantity, volumeData);
      
      // Reset quantity after adding
      setQuantity(1);
    } catch (error) {
      toast.error("Erro ao adicionar produto ao carrinho");
      console.error("Erro ao adicionar ao carrinho:", error);
    }
  }, [product, canAddToCart, addItem, quantity, selectedVolume]);

  return {
    quantity,
    setQuantity: handleSetQuantity,
    incrementQuantity,
    decrementQuantity,
    handleAddToCart,
    isInCart,
    canAddToCart,
    maxQuantity,
  };
};
