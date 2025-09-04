"use client";

import { useAnonymousAuth } from "@/components/auth/AnonymousAuthProvider";
import {
  CartHeader,
  CartEmpty,
  CartItems,
  CartSummaryComponent,
  CartActions,
  CartSecurityInfo,
  useCartItems,
} from "@/components/(shop)/carrinho";
import { useCart } from "@/components/(shop)/carrinho/hooks/useCart";

export default function CartPage() {
  // Hooks do novo sistema de carrinho
  const { cartItems, updateQuantity, removeItem, loading: cartLoading } = useCart();
  const { displayItems, summary, loading: itemsLoading, error } = useCartItems(cartItems);
  const { user, customer } = useAnonymousAuth();

  const isAnonymous = !user;
  const loading = cartLoading || itemsLoading;

  // Estados de loading e erro
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando carrinho...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Erro ao carregar carrinho
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  // Estado vazio
  if (displayItems.length === 0) {
    return <CartEmpty />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <CartHeader 
          itemCount={summary.itemCount}
          isWholesale={customer?.type === "wholesale"}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de itens */}
          <CartItems
            items={displayItems}
            onUpdateQuantity={updateQuantity}
            onRemove={removeItem}
            loading={loading}
            className="lg:col-span-2"
          />

          {/* Sidebar do carrinho */}
          <div className="space-y-6">
            <CartSummaryComponent
              summary={summary}
              isAnonymous={isAnonymous}
              loading={loading}
            />
            
            <CartSecurityInfo />
            
            <CartActions />
          </div>
        </div>
      </div>
    </div>
  );
}
