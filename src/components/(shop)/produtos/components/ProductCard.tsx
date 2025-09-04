import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useCategories } from "@/hooks/useCategories";
import type { ProductCardProps } from "../types";

export function ProductCard({ product, onAddToCart, className = "" }: ProductCardProps) {
  const { getCategoryPath } = useCategories();

  const handleCardClick = (e: React.MouseEvent) => {
    // Impede a navegação se o clique foi no botão de adicionar ao carrinho
    if ((e.target as HTMLElement).closest('[data-cart-button]')) {
      e.preventDefault();
      return;
    }
  };

  return (
    <Link href={`/produtos/${product.id}`} onClick={handleCardClick}>
      <Card className={`group hover:shadow-lg transition-all duration-300 border-0 shadow-md cursor-pointer ${className}`}>
        <CardContent className="p-0">
          <div className="relative">
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

            {product.isWholesale && (
              <Badge className="absolute top-2 left-2 bg-green-600 text-white">
                Atacado
              </Badge>
            )}

            {product.stockStatus === "low_stock" && (
              <Badge className="absolute top-2 right-2 bg-red-600 text-white">
                Últimas unidades
              </Badge>
            )}
          </div>

          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {product.brand}
              </Badge>
              {product.subcategory_id && (
                <Badge variant="secondary" className="text-xs">
                  {getCategoryPath(product.subcategory_id)}
                </Badge>
              )}
              {!product.subcategory_id && product.category && (
                <Badge variant="secondary" className="text-xs">
                  {product.category}
                </Badge>
              )}
            </div>

            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
              {product.name}
            </h3>

            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {product.description.substring(0, 80)}...
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  {product.hasDiscount && (
                    <span className="text-sm text-gray-500 line-through">
                      R$ {product.originalPrice.toFixed(2)}
                    </span>
                  )}
                  <div className="text-lg font-bold text-gold-600">
                    R$ {product.displayPrice.toFixed(2)}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Estoque: {product.stock}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  Ver Detalhes
                </Button>
                <Button
                  data-cart-button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onAddToCart(product);
                  }}
                  className="hp-gradient text-white"
                  disabled={product.stockStatus === "out_of_stock"}
                >
                  <ShoppingCart className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
