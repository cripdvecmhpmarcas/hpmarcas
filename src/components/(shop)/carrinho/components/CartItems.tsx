import { CartItem } from "./CartItem";
import type { CartItemsProps } from "../types";

export function CartItems({ 
  items, 
  onUpdateQuantity, 
  onRemove, 
  loading = false,
  className = "" 
}: CartItemsProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {items.map((item) => {
        // Criar key única incluindo volume
        const itemKey = item.volume 
          ? `${item.productId}_${item.volume.size}${item.volume.unit}`
          : item.productId;
        
        return (
          <CartItem
            key={itemKey}
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            onRemove={onRemove}
            loading={loading}
          />
        );
      })}
    </div>
  );
}