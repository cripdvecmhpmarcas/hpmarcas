"use client";

import { Shield, Truck, Package, Zap } from "lucide-react";
import type { ProductFeaturesProps } from "../types";

export const ProductFeatures = ({ className = "" }: ProductFeaturesProps) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Payment Info */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">
            Pagamento via PIX
          </h3>
        </div>
        <p className="text-blue-700 text-sm">
          Forma mais rápida e segura. Pagamento confirmado
          instantaneamente.
        </p>
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-gray-500" />
          <span>Produto Original</span>
        </div>
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-gray-500" />
          <span>Envio para todo Brasil</span>
        </div>
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-gray-500" />
          <span>Embalagem segura</span>
        </div>
      </div>
    </div>
  );
};