"use client";

import { Badge } from "@/components/ui/badge";
import type { ProductBadgesProps } from "../types";

export const ProductBadges = ({ isWholesale, discount, stock }: ProductBadgesProps) => {
  return (
    <div className="flex flex-col gap-2">
      {isWholesale && discount > 0 && (
        <Badge className="bg-green-600 text-white"> 
          Atacado {discount}% OFF
        </Badge>
      )}
      {stock <= 5 && stock > 0 && (
        <Badge className="bg-red-600 text-white">
          Últimas {stock} unidades
        </Badge>
      )}
      {stock === 0 && (
        <Badge className="bg-gray-600 text-white">
          Sem estoque
        </Badge>
      )}
    </div>
  );
};
