"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tables } from "@/types/database";
import {
  Calendar,
  Package,
  Eye,
  CreditCard,
  Truck
} from "lucide-react";
import { OrderStatus } from "./OrderStatus";

type Sale = Tables<"sales">;

interface OrderCardProps {
  order: Sale;
  onViewDetails: () => void;
}

export function OrderCard({ order, onViewDetails }: OrderCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "pix":
        return "PIX";
      case "credit_card":
        return "Cartão de Crédito";
      case "debit_card":
        return "Cartão de Débito";
      case "bank_slip":
        return "Boleto";
      case "cash":
        return "Dinheiro";
      default:
        return method || "Não informado";
    }
  };

  const getPaymentStatusBadge = (status: string | null) => {
    if (!status) {
      return <Badge variant="secondary">Não informado</Badge>;
    }

    switch (status) {
      case "approved":
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Pago</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case "cancelled":
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-500" />
              <span className="font-semibold text-gray-900">
                Pedido #{order.id.slice(-8)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              {formatDate(order.created_at)}
            </div>
          </div>

          <div className="text-right space-y-2">
            <OrderStatus status={order.status} />
            <div className="text-lg font-bold text-gray-900">
              {formatCurrency(order.total)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="w-4 h-4 text-gray-500" />
            <div>
              <div className="font-medium">Pagamento</div>
              <div className="text-gray-600 flex items-center gap-2">
                {getPaymentMethodLabel(order.payment_method)}
                {getPaymentStatusBadge(order.payment_status)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Truck className="w-4 h-4 text-gray-500" />
            <div>
              <div className="font-medium">Entrega</div>
              <div className="text-gray-600">
                {order.shipping_method || "A definir"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Package className="w-4 h-4 text-gray-500" />
            <div>
              <div className="font-medium">Cliente</div>
              <div className="text-gray-600 truncate">
                {order.customer_name}
              </div>
            </div>
          </div>
        </div>

        {/* Tracking Number */}
        {order.tracking_number && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-blue-900 mb-1">
              Código de Rastreamento
            </div>
            <div className="text-sm text-blue-700 font-mono">
              {order.tracking_number}
            </div>
          </div>
        )}

        {/* Estimated Delivery */}
        {order.estimated_delivery && (
          <div className="mb-4 text-sm text-gray-600">
            <span className="font-medium">Previsão de entrega:</span>{" "}
            {new Date(order.estimated_delivery).toLocaleDateString("pt-BR")}
          </div>
        )}

        {/* Notes */}
        {order.notes && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-900 mb-1">
              Observações
            </div>
            <div className="text-sm text-gray-700">
              {order.notes}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Atualizado em {formatDate(order.updated_at)}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onViewDetails}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            Ver Detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
