"use client";

import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

interface ProductQuantitySelectorProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  maxQuantity: number;
  disabled?: boolean;
}

export const ProductQuantitySelector = ({ 
  quantity, 
  onIncrement, 
  onDecrement, 
  maxQuantity,
  disabled = false
}: ProductQuantitySelectorProps) => {
  return (
    <div className="flex items-center gap-4 mb-4">
      <span className="text-sm font-medium">Quantidade:</span>
      <div className="flex items-center border rounded-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDecrement}
          disabled={disabled || quantity <= 1}
          className="h-10 w-10"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="px-4 py-2 text-center min-w-[60px] font-medium">
          {quantity}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onIncrement}
          disabled={disabled || quantity >= maxQuantity}
          className="h-10 w-10"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};