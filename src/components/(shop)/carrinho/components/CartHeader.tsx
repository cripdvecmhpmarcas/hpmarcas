import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CartHeaderProps } from "../types";

export function CartHeader({ itemCount, isWholesale, className = "" }: CartHeaderProps) {
  return (
    <div className={`mb-4 sm:mb-8 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
        <Link href="/produtos">
          <Button variant="outline" size="sm" className="gap-2 w-fit">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Continuar Comprando</span>
            <span className="sm:hidden">Continuar</span>
          </Button>
        </Link>
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
            Carrinho de Compras
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {itemCount} {itemCount === 1 ? "item" : "itens"} no carrinho
          </p>
        </div>
      </div>

      {isWholesale && (
        <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm sm:text-base text-green-800 font-medium text-center sm:text-left">
            Preços de atacado aplicados! Você está economizando em todos os produtos.
          </p>
        </div>
      )}
    </div>
  );
}