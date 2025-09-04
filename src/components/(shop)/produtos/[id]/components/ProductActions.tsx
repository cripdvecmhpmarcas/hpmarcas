"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart } from "lucide-react";
import { ProductQuantitySelector } from "./ProductQuantitySelector";
import type { ProductActionsProps } from "../types";

export const ProductActions = ({ 
  product, 
  quantity, 
  onQuantityChange, 
  onAddToCart, 
  isInCart, 
  canAddToCart 
}: ProductActionsProps) => {
  const handleIncrement = () => {
    onQuantityChange(quantity + 1);
  };

  const handleDecrement = () => {
    onQuantityChange(quantity - 1);
  };

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      <ProductQuantitySelector
        quantity={quantity}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        maxQuantity={product.stock}
        disabled={product.stock === 0}
      />

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={onAddToCart}
          className="w-full hp-gradient text-white py-3"
          size="lg"
          disabled={!canAddToCart}
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          {isInCart ? "Adicionar Mais" : "Adicionar ao Carrinho"}
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="gap-2">
            <Heart className="w-4 h-4" />
            Favoritar
          </Button>
          <Link href="/carrinho">
            <Button variant="outline" className="w-full gap-2">
              Ver Carrinho
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};