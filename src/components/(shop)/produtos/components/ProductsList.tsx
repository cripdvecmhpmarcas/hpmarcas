import { ProductListItem } from "./ProductListItem";
import type { ProductsListProps } from "../types";

export function ProductsList({ products, onAddToCart, className = "" }: ProductsListProps) {
  return (
    <div className={`grid gap-6 grid-cols-1 ${className}`}>
      {products.map((product) => (
        <ProductListItem
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}