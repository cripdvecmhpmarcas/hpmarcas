"use client";

import { Badge } from "@/components/ui/badge";
import type { ProductPricingProps } from "../types";

export const ProductPricing = ({ 
  product, 
  currentPrice, 
  originalPrice, 
  discount, 
  isWholesale 
}: ProductPricingProps) => {
  const hasDiscount = isWholesale && originalPrice !== currentPrice && discount > 0;

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg border">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 mb-4">
        <div className="text-center sm:text-left">
          {hasDiscount && (
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <span className="text-base sm:text-lg text-gray-500 line-through">
                R$ {originalPrice.toFixed(2)}
              </span>
              <Badge className="bg-green-600 text-white text-xs">
                -{discount}%
              </Badge>
            </div>
          )}
          <div className="text-xl sm:text-3xl font-bold text-gold-600">
            R$ {currentPrice.toFixed(2)}
          </div>
          {isWholesale && (
            <p className="text-xs sm:text-sm text-green-600 font-medium">
              Preço especial atacado
            </p>
          )}
        </div>

        <div className="text-center sm:text-right">
          <p className="text-xs sm:text-sm text-gray-500">Estoque disponível</p>
          <p className="font-semibold text-base sm:text-lg">
            {product.stock} unidades
          </p>
        </div>
      </div>
    </div>
  );
};