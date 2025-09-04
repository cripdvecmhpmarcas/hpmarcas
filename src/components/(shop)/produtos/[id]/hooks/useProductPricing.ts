"use client";

import { useMemo } from "react";
import type { UseProductPricingReturn, ProductWithDetails } from "../types";

export const useProductPricing = (
  product: ProductWithDetails | null,
  selectedVolume?: { price_adjustment?: number } | null
): UseProductPricingReturn => {
  // Para guest mode, sempre usar retail price
  // TODO: Implementar wholesale pricing apenas após login

  const currentPrice = useMemo(() => {
    if (!product) return 0;
    
    // Preço base sempre retail para guest mode
    let basePrice = product.retail_price;
    
    // Adicionar price_adjustment do volume se selecionado
    if (selectedVolume?.price_adjustment) {
      basePrice += selectedVolume.price_adjustment;
    }
    
    return basePrice;
  }, [product, selectedVolume]);

  const originalPrice = useMemo(() => {
    if (!product) return 0;
    return product.retail_price;
  }, [product]);

  const isWholesale = useMemo(() => {
    // Para guest mode, nunca é wholesale
    // TODO: Implementar após login
    return false;
  }, []);

  const discount = useMemo(() => {
    // Para guest mode, discount baseado apenas no volume
    if (!product || !selectedVolume?.price_adjustment || selectedVolume.price_adjustment >= 0) {
      return 0;
    }
    
    // Se price_adjustment for negativo, é desconto
    const discountAmount = Math.abs(selectedVolume.price_adjustment);
    return Math.round((discountAmount / originalPrice) * 100);
  }, [product, selectedVolume, originalPrice]);

  const priceDisplay = useMemo(() => ({
    formatted: `R$ ${currentPrice.toFixed(2)}`,
    originalFormatted: `R$ ${originalPrice.toFixed(2)}`,
    hasDiscount: discount > 0,
    discountPercent: discount,
  }), [currentPrice, originalPrice, discount]);

  return {
    currentPrice,
    originalPrice,
    discount,
    isWholesale,
    priceDisplay,
  };
};