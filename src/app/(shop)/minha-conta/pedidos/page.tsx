"use client";

import { useState } from "react";
import { useCustomerAuth } from "@/components/auth/CustomerAuthProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, Filter } from "lucide-react";
import { useCustomerOrders } from "@/components/(shop)/minha-conta/pedidos/hooks/useCustomerOrders";
import { OrderCard } from "@/components/(shop)/minha-conta/pedidos/components/OrderCard";
import { OrderFilters } from "@/components/(shop)/minha-conta/pedidos/components/OrderFilters";
import { OrderDetails } from "@/components/(shop)/minha-conta/pedidos/components/OrderDetails";
import { Tables } from "@/types/database";

type Sale = Tables<"sales">;

interface OrderFiltersState {
  status: string;
  period: string;
  search: string;
}

export default function MeusPedidosPage() {
  const { user, loading: authLoading } = useCustomerAuth();
  const [selectedOrder, setSelectedOrder] = useState<Sale | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<OrderFiltersState>({
    status: "all",
    period: "all",
    search: "",
  });

  const { 
    orders, 
    loading: ordersLoading, 
    error,
    hasMore,
    loadMore,
    loadingMore
  } = useCustomerOrders({
    customerId: user?.customerProfile?.id,
    filters,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso restrito</h1>
          <p className="text-gray-600">Você precisa estar logado para acessar esta página.</p>
        </div>
      </div>
    );
  }

  const handleFilterChange = (newFilters: Partial<OrderFiltersState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  if (ordersLoading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Meus Pedidos</h1>
              <p className="text-gray-600 mt-1">
                Acompanhe o status dos seus pedidos
              </p>
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
          </div>

          {/* Filters */}
          {showFilters && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <OrderFilters
                  filters={filters}
                  onFiltersChange={handleFilterChange}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Orders List */}
        {error ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-red-600 mb-4">
                <ShoppingBag className="w-12 h-12 mx-auto mb-2" />
                <h3 className="text-lg font-semibold">Erro ao carregar pedidos</h3>
                <p className="text-sm text-gray-600 mt-1">{error}</p>
              </div>
              <Button onClick={() => window.location.reload()}>
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <ShoppingBag className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Nenhum pedido encontrado
                </h3>
                <p className="text-gray-600 mb-6">
                  {filters.status !== "all" || filters.period !== "all" || filters.search
                    ? "Nenhum pedido corresponde aos filtros selecionados."
                    : "Você ainda não fez nenhum pedido. Que tal começar agora?"}
                </p>
                <Button onClick={() => window.location.href = "/produtos"}>
                  Começar a Comprar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onViewDetails={() => setSelectedOrder(order)}
              />
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center pt-6">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="gap-2"
                >
                  {loadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    "Carregar mais pedidos"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <OrderDetails
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )}
      </div>
    </div>
  );
}