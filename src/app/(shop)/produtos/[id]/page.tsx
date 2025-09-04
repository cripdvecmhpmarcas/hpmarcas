"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  ProductBreadcrumb,
  ProductGallery,
  ProductInfo,
  ProductVolumeDisplay,
  ProductPricing,
  ProductActions,
  ProductFeatures,
  ProductRelated,
  ProductReviews,
  useProduct,
  useProductPricing,
  useProductActions,
} from "@/components/(shop)/produtos/[id]";
import type { ProductVolume } from "@/types/products";

// Skeleton loading component
const ProductSkeleton = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32 mb-8"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="aspect-square bg-gray-200 rounded-lg"></div>
            <div className="grid grid-cols-4 gap-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-gray-200 rounded"
                ></div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Product not found component
const ProductNotFound = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Produto não encontrado
      </h1>
      <p className="text-gray-600 mb-8">
        O produto que você está procurando não existe ou foi removido.
      </p>
      <Button onClick={() => window.history.back()}>
        Voltar
      </Button>
    </div>
  </div>
);

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  // Estado para volume selecionado
  const [selectedVolume, setSelectedVolume] = useState<ProductVolume | null>(null);
  
  // Hooks especializados
  const { product, loading, error } = useProduct(params.id as string);
  const { currentPrice, originalPrice, discount, isWholesale } = useProductPricing(product, selectedVolume);
  const {
    quantity,
    setQuantity,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    incrementQuantity,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    decrementQuantity,
    handleAddToCart,
    isInCart,
    canAddToCart,
  } = useProductActions(product, currentPrice, selectedVolume);

  // Loading state
  if (loading) {
    return <ProductSkeleton />;
  }

  // Error or not found state
  if (error || !product) {
    return <ProductNotFound />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        {/* Breadcrumb Navigation */}
        <ProductBreadcrumb product={product} />

        {/* Back Button */}
        <div className="mb-3 sm:mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </div>

        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 mb-8 sm:mb-16">
          {/* Product Gallery */}
          <ProductGallery
            images={product.images}
            name={product.name}
            isWholesale={isWholesale}
            discount={discount}
            stock={product.stock}
          />

          {/* Product Information */}
          <div className="space-y-6">
            <ProductInfo product={product} />
            
            <ProductVolumeDisplay 
              volumes={product.volumes as ProductVolume[] | null}
              selectedVolume={selectedVolume}
              onVolumeSelect={setSelectedVolume}
              basePrice={product.retail_price}
            />
            
            <ProductPricing
              product={product}
              currentPrice={currentPrice}
              originalPrice={originalPrice}
              discount={discount}
              isWholesale={isWholesale}
            />
            
            <ProductActions
              product={product}
              quantity={quantity}
              onQuantityChange={setQuantity}
              onAddToCart={handleAddToCart}
              isInCart={isInCart}
              canAddToCart={canAddToCart}
            />
            
            <ProductFeatures />
          </div>
        </div>

        {/* Related Products */}
        <ProductRelated 
          categoryId={product.category} 
          excludeId={product.id} 
        />

        {/* Product Reviews */}
        <ProductReviews productId={product.id} />
      </div>
    </div>
  );
}