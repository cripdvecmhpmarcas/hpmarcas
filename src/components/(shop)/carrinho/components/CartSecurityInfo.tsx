import { Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { CartSecurityInfoProps } from "../types";

export function CartSecurityInfo({ className = "" }: CartSecurityInfoProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* PIX Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Pagamento PIX
              </h3>
              <p className="text-sm text-gray-600">Rápido e seguro</p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
              <span>Pagamento confirmado na hora</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
              <span>Sem taxas adicionais</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
              <span>Máxima segurança</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações de segurança */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">
            Compra 100% Segura
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
              <span>Produtos 100% originais</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
              <span>Envio seguro e rastreável</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
              <span>Suporte via WhatsApp</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}