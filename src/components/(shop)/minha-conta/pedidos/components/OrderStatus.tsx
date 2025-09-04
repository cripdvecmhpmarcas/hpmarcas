"use client";

import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle,
  AlertCircle
} from "lucide-react";

interface OrderStatusProps {
  status: string;
  className?: string;
}

export function OrderStatus({ status, className = "" }: OrderStatusProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "Pendente",
          icon: Clock,
          className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        };
      case "processing":
        return {
          label: "Processando",
          icon: Package,
          className: "bg-blue-100 text-blue-800 border-blue-200",
        };
      case "shipped":
        return {
          label: "Enviado",
          icon: Truck,
          className: "bg-purple-100 text-purple-800 border-purple-200",
        };
      case "delivered":
        return {
          label: "Entregue",
          icon: CheckCircle,
          className: "bg-green-100 text-green-800 border-green-200",
        };
      case "cancelled":
        return {
          label: "Cancelado",
          icon: XCircle,
          className: "bg-red-100 text-red-800 border-red-200",
        };
      case "returned":
        return {
          label: "Devolvido",
          icon: AlertCircle,
          className: "bg-orange-100 text-orange-800 border-orange-200",
        };
      default:
        return {
          label: status || "Desconhecido",
          icon: AlertCircle,
          className: "bg-gray-100 text-gray-800 border-gray-200",
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge className={`gap-1 ${config.className} ${className}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}