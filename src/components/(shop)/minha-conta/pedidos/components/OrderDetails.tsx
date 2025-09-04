"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tables } from "@/types/database";
import { useSupabaseCustomer } from "@/hooks/useSupabaseCustomer";
import {
  Package,
  Calendar,
  CreditCard,
  MapPin,
  Truck,
  User,
  FileText
} from "lucide-react";
import { OrderStatus } from "./OrderStatus";

type Sale = Tables<"sales">;
type SaleItem = Tables<"sale_items">;
type Product = Tables<"products">;
type CustomerAddress = Tables<"customer_addresses">;

interface OrderDetailsProps {
  order: Sale;
  onClose: () => void;
}

interface OrderItem extends SaleItem {
  product?: Product;
}

export function OrderDetails({ order, onClose }: OrderDetailsProps) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [shippingAddress, setShippingAddress] = useState<CustomerAddress | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useSupabaseCustomer();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);

        // Buscar itens do pedido
        const { data: itemsData } = await supabase
          .from("sale_items")
          .select(`
            *,
            product:products(*)
          `)
          .eq("sale_id", order.id);

        if (itemsData) {
          setItems(itemsData);
        }

        // Buscar endereço de entrega se existir
        if (order.shipping_address_id) {
          const { data: addressData } = await supabase
            .from("customer_addresses")
            .select("*")
            .eq("id", order.shipping_address_id)
            .single();

          if (addressData) {
            setShippingAddress(addressData);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar detalhes do pedido:", error);
      } finally {
        setLoading(false);
      }
    };

    if (order) {
      fetchOrderDetails();
    }
  }, [order, supabase]);

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
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Detalhes do Pedido #{order.id.slice(-8)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Status and Basic Info */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="font-medium">Data do Pedido</div>
                      <div className="text-sm text-gray-600">
                        {formatDate(order.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="font-medium">Cliente</div>
                      <div className="text-sm text-gray-600">
                        {order.customer_name}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="font-medium mb-2">Status do Pedido</div>
                    <OrderStatus status={order.status} />
                  </div>

                  <div>
                    <div className="font-medium mb-2">Total</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(order.total)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Itens do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="w-16 h-16 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-200 last:border-b-0">
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                        {item.product?.images && item.product.images.length > 0 ? (
                          <Image
                            src={item.product.images[0]}
                            alt={item.product_name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-gray-400" />
                        )}
                      </div>

                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {item.product_name}
                        </h4>
                        <div className="text-sm text-gray-600">
                          SKU: {item.product_sku}
                        </div>
                        <div className="text-sm text-gray-600">
                          Quantidade: {item.quantity}
                        </div>
                        <div className="text-sm font-medium">
                          Preço unitário: {formatCurrency(item.unit_price)}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-gray-900">
                          {formatCurrency(item.total_price)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Informações de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="font-medium mb-2">Método de Pagamento</div>
                  <div className="text-gray-600">
                    {getPaymentMethodLabel(order.payment_method)}
                  </div>
                </div>

                <div>
                  <div className="font-medium mb-2">Status do Pagamento</div>
                  {getPaymentStatusBadge(order.payment_status)}
                </div>

                {order.payment_external_id && (
                  <div className="md:col-span-2">
                    <div className="font-medium mb-2">ID da Transação</div>
                    <div className="text-sm font-mono text-gray-600">
                      {order.payment_external_id}
                    </div>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>

                {order.discount_amount && order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto:</span>
                    <span>-{formatCurrency(order.discount_amount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Frete:</span>
                  <span>{formatCurrency(order.shipping_cost || 0)}</span>
                </div>

                <Separator />

                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Informações de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="font-medium mb-2">Método de Entrega</div>
                  <div className="text-gray-600">
                    {order.shipping_method || "A definir"}
                  </div>
                </div>

                {order.tracking_number && (
                  <div>
                    <div className="font-medium mb-2">Código de Rastreamento</div>
                    <div className="text-sm font-mono text-gray-600">
                      {order.tracking_number}
                    </div>
                  </div>
                )}

                {order.estimated_delivery && (
                  <div>
                    <div className="font-medium mb-2">Previsão de Entrega</div>
                    <div className="text-gray-600">
                      {new Date(order.estimated_delivery).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                )}
              </div>

              {shippingAddress && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <div className="font-medium mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Endereço de Entrega
                    </div>
                    <div className="text-gray-600 space-y-1">
                      <div>{shippingAddress.name}</div>
                      <div>
                        {shippingAddress.street}, {shippingAddress.number}
                        {shippingAddress.complement && `, ${shippingAddress.complement}`}
                      </div>
                      <div>
                        {shippingAddress.neighborhood}, {shippingAddress.city} - {shippingAddress.state}
                      </div>
                      <div>CEP: {shippingAddress.zip_code}</div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Observações
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-gray-600">
                  {order.notes}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
