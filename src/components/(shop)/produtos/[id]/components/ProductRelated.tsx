"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { useRelatedProducts } from "../hooks";
import { useProductPricing } from "../hooks/useProductPricing";
import type { ProductRelatedProps, ProductWithDetails } from "../types";

export const ProductRelated = ({ categoryId, excludeId }: ProductRelatedProps) => {
  const { relatedProducts, loading, error } = useRelatedProducts(categoryId, excludeId);

  if (loading) {
    return (
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Produtos Relacionados
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error || relatedProducts.length === 0) {
    return null;
  }

  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Produtos Relacionados
        </h2>
        <Link
          href={`/categoria/${categoryId
            .toLowerCase()
            .replace(/\s+/g, "-")}`}
        >
          <Button variant="outline">
            Ver mais da categoria
            <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {relatedProducts.map((relatedProduct) => {
          return (
            <RelatedProductCard
              key={relatedProduct.id}
              product={relatedProduct}
            />
          );
        })}
      </div>
    </section>
  );
};

// Componente interno para produto relacionado
const RelatedProductCard = ({ product }: { product: ProductWithDetails }) => {
  const { currentPrice } = useProductPricing(product);

  const handleCardClick = (e: React.MouseEvent) => {
    // Impede a navegação se o clique foi em um elemento interativo
    if ((e.target as HTMLElement).closest('button')) {
      e.preventDefault();
      return;
    }
  };

  return (
    <Link href={`/produtos/${product.id}`} onClick={handleCardClick}>
      <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
        <CardContent className="p-0">
          <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
            {product.images?.[0] ? (
              <Image
                width={300}
                height={300}
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <div className="text-center text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-2 bg-gray-300 rounded-lg flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2" />
                      <polyline points="21,15 16,10 5,21" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                  <span className="text-sm">Sem imagem</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4">
            <Badge variant="outline" className="mb-2 text-xs">
              {product.brand}
            </Badge>

            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
              {product.name}
            </h3>

            <div className="flex items-center justify-between">
              <div className="text-lg font-bold text-gold-600">
                R$ {currentPrice.toFixed(2)}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                Ver
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
