"use client";

import Link from "next/link";
import { useCategories } from "@/hooks/useCategories";
import type { ProductBreadcrumbProps } from "../types";

export const ProductBreadcrumb = ({ product }: ProductBreadcrumbProps) => {
  const { getCategoryById } = useCategories();
  const category = product.subcategory_id ? getCategoryById(product.subcategory_id) : null;
  const parentCategory = category?.parent_id ? getCategoryById(category.parent_id) : null;

  return (
    <nav className="mb-8">
      <div className="flex items-center space-x-2 text-sm">
        <Link href="/" className="text-gray-500 hover:text-gray-700">
          Início
        </Link>
        <span className="text-gray-300">/</span>
        <Link
          href="/produtos"
          className="text-gray-500 hover:text-gray-700"
        >
          Produtos
        </Link>
        
        {/* Show category hierarchy if available */}
        {category && (
          <>
            {/* Show parent category if it exists */}
            {parentCategory && (
              <>
                <span className="text-gray-300">/</span>
                <Link
                  href={`/produtos?subcategory_id=${parentCategory.id}`}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {parentCategory.name}
                </Link>
              </>
            )}
            <span className="text-gray-300">/</span>
            <Link
              href={`/produtos?subcategory_id=${category.id}`}
              className="text-gray-500 hover:text-gray-700"
            >
              {category.name}
            </Link>
          </>
        )}
        
        {/* Fallback to legacy category if no subcategory */}
        {!product.subcategory_id && product.category && (
          <>
            <span className="text-gray-300">/</span>
            <Link
              href={`/produtos?category=${encodeURIComponent(product.category)}`}
              className="text-gray-500 hover:text-gray-700"
            >
              {product.category}
            </Link>
          </>
        )}
        
        <span className="text-gray-300">/</span>
        <span className="text-gray-900">{product.name}</span>
      </div>
    </nav>
  );
};