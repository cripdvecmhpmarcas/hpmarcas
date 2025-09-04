"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CustomerUser } from "@/components/auth/CustomerAuthProvider";
import { User, Mail, Phone, UserCheck, Star } from "lucide-react";

interface ProfileHeaderProps {
  user: CustomerUser;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const getCustomerTypeBadge = (type: string) => {
    switch (type) {
      case "wholesale":
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800 gap-1">
            <Star className="w-3 h-3" />
            Atacado
          </Badge>
        );
      case "retail":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 gap-1">
            <UserCheck className="w-3 h-3" />
            Varejo
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Ativo
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            Inativo
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
              <h1 className="text-2xl font-bold text-gray-900 truncate">
                {user.customerProfile?.name || user.email || "Usuário"}
              </h1>
              <div className="flex flex-wrap gap-2">
                {user.customerProfile?.type && getCustomerTypeBadge(user.customerProfile.type)}
                {user.customerProfile?.status && getStatusBadge(user.customerProfile.status)}
              </div>
            </div>

            <div className="space-y-2">
              {user.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{user.email}</span>
                </div>
              )}

              {user.customerProfile?.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{user.customerProfile.phone}</span>
                </div>
              )}
            </div>
          </div>

          {user.customerProfile && (
            <div className="flex-shrink-0">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-lg font-semibold text-gray-900">
                    {user.customerProfile.total_purchases || 0}
                  </div>
                  <div className="text-xs text-gray-600">Compras</div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-lg font-semibold text-gray-900">
                    {formatCurrency(user.customerProfile.total_spent || 0)}
                  </div>
                  <div className="text-xs text-gray-600">Gasto Total</div>
                </div>
              </div>

              {user.customerProfile.last_purchase && (
                <div className="mt-3 text-center">
                  <div className="text-xs text-gray-500">
                    Última compra: {formatDate(user.customerProfile.last_purchase)}
                  </div>
                </div>
              )}

              {user.customerProfile.discount && user.customerProfile.discount > 0 && (
                <div className="mt-2 text-center">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {user.customerProfile.discount}% de desconto
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}