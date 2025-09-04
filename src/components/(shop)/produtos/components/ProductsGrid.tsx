import { ProductCard } from "./ProductCard";
import type { ProductsGridProps } from "../types";

export function ProductsGrid({ products, onAddToCart, className = "" }: ProductsGridProps) {
  return (
    <div className={`grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${className}`}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}