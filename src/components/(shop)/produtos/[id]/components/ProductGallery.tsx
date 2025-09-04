"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { useProductGallery } from "../hooks";
import { ProductBadges } from "./ProductBadges";
import type { ProductGalleryProps } from "../types";

interface ProductGalleryPropsExtended extends ProductGalleryProps {
  isWholesale: boolean;
  discount: number;
  stock: number;
}

export const ProductGallery = ({ 
  images, 
  name, 
  isWholesale, 
  discount, 
  stock 
}: ProductGalleryPropsExtended) => {
  const { 
    images: processedImages, 
    selectedIndex, 
    setSelectedIndex, 
    hasMultipleImages 
  } = useProductGallery(images);

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="aspect-square bg-white rounded-lg overflow-hidden shadow-sm border relative group">
        <Image
          width={600}
          height={600}
          src={processedImages[selectedIndex]}
          alt={name}
          className="w-full h-full object-cover"
          priority
        />

        {/* Share Button */}
        <Button
          variant="outline"
          size="sm"
          className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm"
        >
          <Share2 className="w-4 h-4" />
        </Button>

        {/* Badges */}
        <div className="absolute top-4 left-4">
          <ProductBadges 
            isWholesale={isWholesale} 
            discount={discount} 
            stock={stock} 
          />
        </div>
      </div>

      {/* Thumbnails */}
      {hasMultipleImages && (
        <div className="grid grid-cols-4 gap-2">
          {processedImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                selectedIndex === index
                  ? "border-gold-500 ring-2 ring-gold-200"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Image
                width={150}
                height={150}
                src={image}
                alt={`${name} - ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};