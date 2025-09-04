import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CartEmptyProps } from "../types";

export function CartEmpty({ className = "" }: CartEmptyProps) {
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-12 h-12 text-gray-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Seu carrinho está vazio
        </h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Que tal dar uma olhada em nossos produtos incríveis? Temos perfumes
          e cosméticos importados esperando por você!
        </p>
        <div className="space-y-4">
          <Link href="/produtos">
            <Button size="lg" className="hp-gradient text-white px-8">
              <ShoppingBag className="w-5 h-5 mr-2" />
              Descobrir Produtos
            </Button>
          </Link>
          <div className="flex justify-center gap-4 text-sm">
            <Link
              href="/produtos"
              className="text-gold-600 hover:text-gold-700 transition-colors"
            >
              Perfumes Femininos
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              href="/produtos"
              className="text-gold-600 hover:text-gold-700 transition-colors"
            >
              Perfumes Masculinos
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              href="/produtos"
              className="text-gold-600 hover:text-gold-700 transition-colors"
            >
              Cosméticos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}