"use client";

import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle } from "lucide-react";
import type { Product } from "@/types/pdv";

interface ProductFeedbackCardProps {
  product: Product;
  customerType: "retail" | "wholesale";
  className?: string;
}

export const ProductFeedbackCard: React.FC<ProductFeedbackCardProps> = ({
  product,
  customerType,
  className = "",
}) => {
  // Obter preço baseado no tipo de cliente
  const getPrice = (product: Product) => {
    return customerType === "wholesale"
      ? product.wholesale_price
      : product.retail_price;
  };

  // Determinar cor do badge de estoque
  const getStockBadgeStyle = (stock: number) => {
    if (stock > 10) {
      return 'bg-green-100 text-green-700 border border-green-200';
    } else if (stock > 5) {
      return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
    } else {
      return 'bg-red-100 text-red-700 border border-red-200';
    }
  };

  return (
    <div className={`mt-3 p-4 bg-white rounded-lg border border-green-200 shadow-sm ${className}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="font-semibold text-gray-900 truncate cursor-help text-base">
              {product.name}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-sm z-50">
            <div className="text-sm">
              <p className="font-medium">{product.name}</p>
              <p className="text-xs text-gray-300 mt-1">
                Marca: {product.brand} • Categoria: {product.category}
              </p>
              <p className="text-xs text-gray-300">
                SKU: {product.sku} • Código: {product.barcode}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="text-sm text-gray-600 mt-1">
        <span className="font-medium">{product.brand}</span> • SKU: {product.sku}
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="text-lg font-bold text-green-600">
          Preço {customerType === "wholesale" ? "Atacado" : "Varejo"}: R$ {getPrice(product).toFixed(2)}
        </div>

        <div className={`text-sm px-3 py-1 rounded-full font-medium ${getStockBadgeStyle(product.stock)}`}>
          Estoque: {product.stock} unidades
        </div>
      </div>

      {product.stock <= 10 && product.stock > 0 && (
        <div className="mt-2 text-sm text-orange-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          <span>Estoque baixo - apenas {product.stock} unidades restantes!</span>
        </div>
      )}
    </div>
  );
};
