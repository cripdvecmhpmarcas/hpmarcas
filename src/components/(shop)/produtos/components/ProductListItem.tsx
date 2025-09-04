import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useCategories } from "@/hooks/useCategories";
import type { ProductListItemProps } from "../types";

export function ProductListItem({ product, onAddToCart, className = "" }: ProductListItemProps) {
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
      <Card className={`group hover:shadow-lg transition-all duration-300 border-0 shadow-md flex cursor-pointer ${className}`}>
        <CardContent className="p-0">
          <div className="flex p-4 gap-4">
            <div className="relative w-32 h-32 flex-shrink-0">
              {product.images?.[0] ? (
                <Image
                  width={128}
                  height={128}
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-lg">
                  <div className="text-center text-gray-500">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2" />
                      <polyline points="21,15 16,10 5,21" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                </div>
              )}
              {product.isWholesale && (
                <Badge className="absolute top-1 left-1 bg-green-600 text-white text-xs">
                  Atacado
                </Badge>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
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
                    <h3 className="font-semibold text-gray-900 line-clamp-1">
                      {product.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    {product.hasDiscount && (
                      <span className="text-sm text-gray-500 line-through block">
                        R$ {product.originalPrice.toFixed(2)}
                      </span>
                    )}
                    <div className="text-lg font-bold text-gold-600">
                      R$ {product.displayPrice.toFixed(2)}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {product.description}
                </p>

                <p className="text-sm text-gray-500">
                  SKU: {product.sku} • Estoque: {product.stock}
                </p>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  className="flex-1"
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
                  className="hp-gradient text-white px-6"
                  disabled={product.stockStatus === "out_of_stock"}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
