import Image from "next/image";
import { Trash2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { CartItemProps } from "../types";

export function CartItem({ 
  item, 
  onUpdateQuantity, 
  onRemove, 
  loading = false,
  className = "" 
}: CartItemProps) {
  const isOutOfStock = item.stockStatus === "out_of_stock";
  const isLowStock = item.stockStatus === "low_stock";

  return (
    <Card className={`overflow-hidden ${loading ? "opacity-50" : ""} ${className}`}>
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row sm:items-center">
          {/* Imagem do produto */}
          <div className="w-20 h-20 sm:w-32 sm:h-32 flex-shrink-0 mx-auto sm:mx-0">
            {item.images?.[0] ? (
              <Image
                width={128}
                height={128}
                src={item.images[0]}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <div className="text-center text-gray-500">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2" />
                    <polyline points="21,15 16,10 5,21" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Informações do produto */}
          <div className="flex-1 p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
              <div className="flex-1 mb-3 sm:mb-0">
                <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">
                  {item.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-2">
                  SKU: {item.sku}
                </p>

                <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
                  {item.isWholesale && (
                    <Badge className="bg-green-600 text-white text-xs">
                      Preço Atacado
                    </Badge>
                  )}
                  
                  {isOutOfStock && (
                    <Badge variant="destructive" className="text-xs">
                      Sem Estoque
                    </Badge>
                  )}
                  
                  {isLowStock && (
                    <Badge className="bg-orange-600 text-white text-xs">
                      Últimas unidades
                    </Badge>
                  )}
                </div>
              </div>

              {/* Preço */}
              <div className="text-center sm:text-right sm:ml-4">
                {item.hasDiscount && (
                  <p className="text-xs sm:text-sm text-gray-500 line-through">
                    R$ {item.originalPrice.toFixed(2)}
                  </p>
                )}
                <p className="text-base sm:text-lg font-bold text-gold-600">
                  R$ {item.currentPrice.toFixed(2)}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">por unidade</p>
              </div>
            </div>

            {/* Controles de quantidade e remoção */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  Quantidade:
                </span>
                <div className="flex items-center border rounded-lg w-fit mx-auto sm:mx-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUpdateQuantity(item.productId, item.quantity - 1, item.volume)}
                    disabled={item.quantity <= 1 || loading || isOutOfStock}
                    className="h-9 w-9 p-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-3 py-2 text-center min-w-[60px] font-medium">
                    {item.quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUpdateQuantity(item.productId, item.quantity + 1, item.volume)}
                    disabled={loading || isOutOfStock || item.quantity >= item.stock}
                    className="h-9 w-9 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Subtotal e remover */}
              <div className="flex items-center justify-between sm:gap-4">
                <div className="text-center sm:text-right">
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">
                    R$ {(item.currentPrice * item.quantity).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Total do item
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(item.productId, item.volume)}
                  disabled={loading}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 h-9 w-9 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Remover item</span>
                </Button>
              </div>
            </div>

            {/* Informações de estoque */}
            {!isOutOfStock && (
              <div className="mt-3 text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                Estoque disponível: {item.stock} unidades
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}