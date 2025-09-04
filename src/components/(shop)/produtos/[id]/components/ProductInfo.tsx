"use client";

import { Badge } from "@/components/ui/badge";
import { useCategories } from "@/hooks/useCategories";
import type { ProductInfoProps } from "../types";

export const ProductInfo = ({ product }: ProductInfoProps) => {
  const { getCategoryPath } = useCategories();
  const categoryPath = product.subcategory_id ? getCategoryPath(product.subcategory_id) : null;

  return (
    <div className="space-y-4">
      {/* Brand and Category */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <Badge variant="outline" className="text-sm">
          {product.brand}
        </Badge>
        {categoryPath ? (
          <Badge variant="secondary" className="text-sm">
            {categoryPath}
          </Badge>
        ) : product.category ? (
          <Badge variant="secondary" className="text-sm">
            {product.category}
          </Badge>
        ) : null}
      </div>

      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2">
          {product.name}
        </h1>
        <p className="text-sm sm:text-base text-gray-600">SKU: {product.sku}</p>
      </div>

      {/* Description */}
      <div className="prose prose-gray max-w-none">
        <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
          {product.description}
        </p>
      </div>
    </div>
  );
};