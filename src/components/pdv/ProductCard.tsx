"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Package, ShoppingCart, AlertCircle, Layers } from "lucide-react";
import { VolumeSelector } from "./VolumeSelector";
import type { Product } from "@/types/pdv";
import type { ProductVolume, ProductWithVolumes } from "@/types/products";

interface ProductCardProps {
  product: Product & { volumes?: ProductVolume[] | null } | ProductWithVolumes;
  customerType: "retail" | "wholesale";
  onAddToCart: (product: Product, volume?: ProductVolume) => void;
  showStockWarning?: boolean;
  isLoading?: boolean;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  customerType,
  onAddToCart,
  showStockWarning = true,
  isLoading = false,
  className = "",
}) => {
  const [showVolumeSelector, setShowVolumeSelector] = useState(false);

  // Verificar se o produto tem volumes
  const hasVolumes = product.volumes && product.volumes.length > 0;

  // Obter preço baseado no tipo de cliente
  const getPrice = (product: Product) => {
    return customerType === "wholesale"
      ? product.wholesale_price
      : product.retail_price;
  };

  // Determinar cor do badge de estoque
  const getStockBadgeStyle = (stock: number) => {
    if (stock > 10) {
      return 'bg-green-50 text-green-600 border border-green-200';
    } else if (stock > 5) {
      return 'bg-yellow-50 text-yellow-600 border border-yellow-200';
    } else {
      return 'bg-red-50 text-red-600 border border-red-200';
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Se tem volumes, abrir selector
    if (hasVolumes) {
      setShowVolumeSelector(true);
    } else {
      onAddToCart(product as Product);
    }
  };

  const handleVolumeSelect = (product: Product, volume?: ProductVolume) => {
    onAddToCart(product, volume);
    setShowVolumeSelector(false);
  };

  return (
    <div
      className={`group p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 hover:shadow-md transition-all duration-200 ${className}`}
    >
      <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-start">
        {/* Ícone do produto */}
        <div className="flex-shrink-0">
          <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-100 transition-colors">
            <Package className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
          </div>
        </div>

        {/* Informações do produto */}
        <div className="min-w-0 space-y-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <h4 className="font-semibold text-sm sm:text-base text-gray-900 truncate group-hover:text-blue-900 cursor-help leading-tight">
                  {product.name}
                </h4>
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

          <p className="text-xs sm:text-sm text-gray-600">
            <span className="font-medium">{product.brand}</span> • SKU: {product.sku}
          </p>

          {/* Preço e badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-lg font-bold text-green-600 flex-shrink-0">
              R$ {getPrice(product as Product).toFixed(2)}
            </div>

            {/* Badge de estoque */}
            <div className={`text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap ${getStockBadgeStyle(product.stock)}`}>
              {product.stock > 0 ? `${product.stock} unid.` : 'Sem estoque'}
            </div>

            {/* Badge de volumes */}
            {hasVolumes && (
              <Badge variant="outline" className="text-xs gap-1">
                <Layers className="w-3 h-3" />
                {product.volumes?.length} tamanhos
              </Badge>
            )}
          </div>

          {/* Aviso de estoque baixo */}
          {showStockWarning && product.stock <= 5 && product.stock > 0 && (
            <div className="text-xs text-orange-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>Estoque baixo - apenas {product.stock} unidades restantes!</span>
            </div>
          )}
        </div>

        {/* Botão adicionar - sempre alinhado à direita */}
        <div className="flex-shrink-0 self-start">
          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={product.stock <= 0 || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white shadow-sm w-20 sm:w-24 h-8 text-xs flex items-center justify-center gap-1 transition-colors"
          >
            {isLoading ? (
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShoppingCart className="w-3 h-3" />
                <span className="hidden sm:inline">{hasVolumes ? 'Escolher' : 'Adicionar'}</span>
                <span className="sm:hidden">{hasVolumes ? 'Esc' : 'Add'}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Volume Selector Modal */}
      <VolumeSelector
        product={product as Product & { volumes?: ProductVolume[] | null }}
        customerType={customerType}
        open={showVolumeSelector}
        onClose={() => setShowVolumeSelector(false)}
        onVolumeSelect={handleVolumeSelect}
      />
    </div>
  );
};
