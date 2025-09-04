import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerLoginModal } from "@/components/auth/CustomerLoginModal";
import type { CartSummaryProps } from "../types";

export function CartSummary({ 
  summary, 
  isAnonymous, 
  loading = false,
  className = "" 
}: CartSummaryProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          Resumo do Pedido
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Detalhes do cálculo */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              Subtotal ({summary.itemCount}{" "}
              {summary.itemCount === 1 ? "item" : "itens"})
            </span>
            <span className="font-medium">
              R$ {summary.subtotal.toFixed(2)}
            </span>
          </div>

          {summary.totalDiscount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600">Desconto atacado</span>
              <span className="text-green-600 font-medium">
                -R$ {summary.totalDiscount.toFixed(2)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Frete</span>
            <span className="text-gray-500">Calculado no checkout</span>
          </div>

          <hr className="border-gray-200" />

          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-gold-600">
              R$ {summary.total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Botão de finalizar */}
        {isAnonymous ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 text-center">
              Faça login para finalizar sua compra com segurança
            </p>
            <CustomerLoginModal
              trigger={
                <Button
                  className="w-full hp-gradient text-white"
                  size="lg"
                  disabled={loading || summary.itemCount === 0}
                >
                  Fazer Login e Finalizar
                </Button>
              }
            />
            <p className="text-xs text-gray-500 text-center">
              Não tem conta? O login também permite criar uma nova conta
            </p>
          </div>
        ) : (
          <Link href="/checkout">
            <Button 
              className="w-full hp-gradient text-white" 
              size="lg"
              disabled={loading || summary.itemCount === 0}
            >
              Finalizar Compra
            </Button>
          </Link>
        )}

        {/* Informações adicionais */}
        {summary.hasWholesaleItems && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 font-medium text-center">
              Você está economizando com preços de atacado!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}