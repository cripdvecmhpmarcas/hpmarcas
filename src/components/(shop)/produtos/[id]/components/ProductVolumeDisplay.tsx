"use client";

// import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProductVolumeDisplayProps } from "../types";
import type { ProductVolume } from "@/types/products";

export const ProductVolumeDisplay = ({
  volumes,
  selectedVolume,
  onVolumeSelect,
  basePrice
}: ProductVolumeDisplayProps) => {
  // Parse volumes data
  const parseVolumes = (): ProductVolume[] | null => {
    try {
      let parsedVolumes;
      if (typeof volumes === "string") {
        parsedVolumes = JSON.parse(volumes);
      } else {
        parsedVolumes = volumes;
      }

      if (parsedVolumes && Array.isArray(parsedVolumes)) {
        return parsedVolumes;
      }
    } catch (error) {
      console.error("Error parsing volumes:", error);
    }
    return null;
  };

  const parsedVolumes = parseVolumes();

  if (!parsedVolumes || parsedVolumes.length === 0) {
    return null;
  }

  const calculatePrice = (volume: ProductVolume): number => {
    return basePrice + (volume.price_adjustment || 0);
  };

  return (
    <div>
      <h3 className="font-semibold mb-3">
        Tamanhos disponíveis:
      </h3>
      <div className="flex gap-2 flex-wrap">
        {parsedVolumes.map((volume: ProductVolume, index: number) => {
          const isSelected = selectedVolume ?
            (selectedVolume.size === volume.size && selectedVolume.unit === volume.unit) :
            false;
          const calculatedPrice = calculatePrice(volume);

          return (
            <Button
              key={index}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => onVolumeSelect?.(volume)}
              className={`px-3 py-2 transition-all ${isSelected
                  ? "bg-gold-600 text-white hover:bg-gold-700"
                  : "hover:bg-gold-50 hover:border-gold-300"
                }`}
            >
              <div className="text-center">
                <div className="font-medium">
                  {volume.size}{volume.unit}
                </div>
                <div className="text-sm">
                  R$ {calculatedPrice.toFixed(2)}
                </div>
              </div>
            </Button>
          );
        })}
      </div>

      {selectedVolume && (
        <div className="mt-3 p-3 bg-gold-50 rounded-lg border border-gold-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gold-700">
              Volume selecionado: {selectedVolume.size}{selectedVolume.unit}
            </span>
            {selectedVolume.barcode && (
              <span className="text-xs text-gray-500 font-mono">
                {selectedVolume.barcode}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
