"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Package } from "lucide-react";
import { formatCurrency } from "@/lib/pdv-utils";
import type { Product, ProductVolume } from "@/types/products";

// Tipo para volumes que podem estar no formato antigo ou novo
type VolumeData = ProductVolume | {
  size: string;
  price: number;
  unit?: string;
  barcode?: string;
};

interface VolumeOption {
  volume?: ProductVolume;
  label: string;
  price: number;
  barcode: string;
  isDefault: boolean;
}

interface VolumeSelectorProps {
  product: Product & { volumes?: ProductVolume[] | null };
  customerType: "retail" | "wholesale";
  open: boolean;
  onClose: () => void;
  onVolumeSelect: (product: Product, volume?: ProductVolume) => void;
}

export const VolumeSelector: React.FC<VolumeSelectorProps> = ({
  product,
  customerType,
  open,
  onClose,
  onVolumeSelect,
}) => {
  // Calcular preço base do produto
  const getBasePrice = () => {
    return customerType === "wholesale" ? product.wholesale_price : product.retail_price;
  };

  // Calcular preço de um volume específico (suporte a formato antigo e novo)
  const getVolumePrice = (volume: ProductVolume) => {
    const basePrice = getBasePrice();

    // Verificar se é formato antigo com 'price' (usando type assertion)
    const volumeWithPrice = volume as VolumeData;
    if ('price' in volumeWithPrice && typeof volumeWithPrice.price === 'number') {
      return volumeWithPrice.price;
    }

    // Formato novo com price_adjustment
    const adjustment = volume.price_adjustment || 0;

    if (adjustment === 0) {
      return basePrice;
    }

    // Se o ajuste for positivo, é um percentual (ex: 150 = +150%)
    // Se for negativo, é um desconto (ex: -10 = -10%)
    if (adjustment > 0 && adjustment > 100) {
      return basePrice * (adjustment / 100);
    } else {
      return basePrice + (basePrice * adjustment / 100);
    }
  };

  // Criar opção para o produto padrão (sem volume específico)
  const getDefaultOption = (): VolumeOption => {
    return {
      label: "Tamanho Padrão",
      price: getBasePrice(),
      barcode: product.barcode,
      isDefault: true,
    };
  };

  // Criar opções para os volumes disponíveis
  const getVolumeOptions = (): VolumeOption[] => {
    if (!product.volumes || product.volumes.length === 0) {
      return [];
    }

    return product.volumes.map((volume) => {
      // Lidar com formato antigo e novo
      let label = '';
      let volumeData: ProductVolume;

      if ('price' in volume && typeof volume.price === 'number') {
        // Formato antigo: { size: "100ml", price: 189.9 }
        const sizeStr = volume.size || '';
        const sizeMatch = sizeStr.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/);

        label = sizeStr;
        volumeData = {
          size: sizeMatch ? sizeMatch[1] : sizeStr,
          unit: sizeMatch ? sizeMatch[2] : 'ml',
          barcode: volume.barcode || product.barcode,
          price_adjustment: 0
        };
      } else {
        // Formato novo: { size: "100", unit: "ml", price_adjustment: 20 }
        label = `${volume.size}${volume.unit}`;
        volumeData = volume;
      }

      return {
        volume: volumeData,
        label,
        price: getVolumePrice(volume),
        barcode: volume.barcode || product.barcode,
        isDefault: false,
      };
    });
  };

  const allOptions = [getDefaultOption(), ...getVolumeOptions()];

  const handleSelect = (option: VolumeOption) => {
    if (option.isDefault) {
      onVolumeSelect(product);
    } else {
      onVolumeSelect(product, option.volume);
    }
    onClose();
  };

  const handleDirectAdd = () => {
    // Se só tem uma opção (padrão), adiciona direto
    if (allOptions.length === 1) {
      onVolumeSelect(product);
      onClose();
      return;
    }

    // Se tem volumes, mostra o primeiro como padrão
    if (allOptions.length > 1) {
      onVolumeSelect(product);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Selecionar Tamanho
          </DialogTitle>
          <DialogDescription>
            {product.name} - Escolha o tamanho desejado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {allOptions.map((option, index) => (
            <Button
              key={index}
              variant="outline"
              className="w-full h-auto p-4 justify-between hover:bg-blue-50"
              onClick={() => handleSelect(option)}
            >
              <div className="flex items-center gap-3">
                <div className="text-left">
                  <div className="font-medium">{option.label}</div>
                  {option.barcode && (
                    <div className="text-xs text-muted-foreground font-mono">
                      {option.barcode}
                    </div>
                  )}
                </div>
                {option.isDefault && (
                  <Badge variant="secondary" className="text-xs">
                    Padrão
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <div className="font-bold text-green-600">
                  {formatCurrency(option.price)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {customerType === "wholesale" ? "Atacado" : "Varejo"}
                </div>
              </div>
            </Button>
          ))}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleDirectAdd} className="flex-1">
            <Check className="w-4 h-4 mr-2" />
            Adicionar Padrão
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
