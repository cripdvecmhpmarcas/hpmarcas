"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tables } from "@/types/database";
import { 
  MapPin, 
  Edit, 
  Trash2, 
  Star, 
  Home,
  Building2,
  Heart
} from "lucide-react";

type CustomerAddress = Tables<"customer_addresses">;

interface AddressCardProps {
  address: CustomerAddress;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}

export function AddressCard({ address, onEdit, onDelete, onSetDefault }: AddressCardProps) {
  const getIconForLabel = (label: string) => {
    switch (label.toLowerCase()) {
      case 'casa':
        return <Home className="w-4 h-4" />;
      case 'trabalho':
        return <Building2 className="w-4 h-4" />;
      case 'favorito':
        return <Heart className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const formatAddress = (address: CustomerAddress) => {
    const parts = [
      address.street && address.number ? `${address.street}, ${address.number}` : null,
      address.complement ? address.complement : null,
      address.neighborhood,
      address.city,
      address.state,
    ].filter(Boolean);

    return parts.join(", ");
  };

  const formatZipCode = (zipCode: string) => {
    return zipCode.replace(/(\d{5})(\d{3})/, "$1-$2");
  };

  return (
    <Card className={`relative transition-all hover:shadow-md ${address.is_default ? 'ring-2 ring-blue-200 bg-blue-50/30' : ''}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            {getIconForLabel(address.label)}
            <h3 className="font-semibold text-gray-900">{address.label}</h3>
            {address.is_default && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 gap-1">
                <Star className="w-3 h-3 fill-current" />
                Padrão
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="text-sm text-gray-600 min-w-0 flex-1">
              <p className="font-medium text-gray-900 mb-1">{address.name}</p>
              <p className="break-words">{formatAddress(address)}</p>
              <p className="mt-1">CEP: {formatZipCode(address.zip_code)}</p>
            </div>
          </div>

          {!address.is_default && (
            <div className="pt-2 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={onSetDefault}
                className="gap-2 text-xs"
              >
                <Star className="w-3 h-3" />
                Definir como padrão
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}