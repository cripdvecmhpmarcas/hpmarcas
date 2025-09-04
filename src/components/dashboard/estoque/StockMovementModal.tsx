"use client";

import React, { useState, useEffect } from "react";
import { X, Search, Package, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useSupabaseAdmin } from "@/hooks/useSupabaseAdmin";
import { useToast } from "@/hooks/useToast";
import { useStockMovements } from "./hooks/useStockMovements";
import {
  StockMovementType,
  StockMovementReason,
  STOCK_MOVEMENT_TYPES,
  STOCK_MOVEMENT_REASONS,
} from "@/types/stock";

export interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  brand?: string;
  category?: string;
  barcode?: string;
}

interface StockMovementModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: {
    product?: Product;
    type?: StockMovementType;
    reason?: StockMovementReason;
  };
}

const StockMovementModal: React.FC<StockMovementModalProps> = ({
  open,
  onClose,
  onSuccess,
  initialData,
}) => {
  const { toast } = useToast();
  const { createMovement } = useStockMovements();
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    initialData?.product || null
  );
  const [showProductSearch, setShowProductSearch] = useState(
    !initialData?.product
  );
  const [isSearching, setIsSearching] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    type: initialData?.type || ("entry" as StockMovementType),
    reason: initialData?.reason || ("purchase" as StockMovementReason),
    quantity: "",
    notes: "",
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const supabase = useSupabaseAdmin();

  // Search products
  const searchProducts = React.useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setProducts([]);
        return;
      }

      setIsSearching(true);
      try {
        let data = null;

        // Se a query parece ser um barcode (apenas números), tentar busca exata primeiro
        const isNumericQuery = /^\d+$/.test(query.trim());

        if (isNumericQuery) {
          // Busca exata por barcode primeiro
          const barcodeResult = await supabase
            .from("products")
            .select(
              `
            id,
            name,
            sku,
            stock,
            brand,
            category,
            barcode
          `
            )
            .eq("barcode", query.trim())
            .limit(1);

          if (barcodeResult.error) throw barcodeResult.error;

          if (barcodeResult.data && barcodeResult.data.length > 0) {
            data = barcodeResult.data;
          }
        }

        // Se não encontrou por barcode ou não é numérico, fazer busca geral
        if (!data || data.length === 0) {
          const generalResult = await supabase
            .from("products")
            .select(
              `
            id,
            name,
            sku,
            stock,
            brand,
            category,
            barcode
          `
            )
            .or(
              `name.ilike.%${query}%,sku.ilike.%${query}%,brand.ilike.%${query}%,barcode.ilike.%${query}%`
            )
            .order("name")
            .limit(10);

          if (generalResult.error) throw generalResult.error;
          data = generalResult.data;
        }

        setProducts(data || []);

        // Mostrar feedback se nenhum produto foi encontrado
        if (!data || data.length === 0) {
          toast({
            title: "Nenhum produto encontrado",
            description: `Não foi encontrado nenhum produto com "${query}". Verifique a busca e tente novamente.`,
            variant: "default",
          });
        }
      } catch (error) {
        console.error("Error searching products:", error);
        toast({
          title: "Erro ao buscar produtos",
          description: "Não foi possível buscar os produtos. Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setIsSearching(false);
      }
    },
    [toast, supabase]
  );

  // Handle keydown to prevent barcode scanner Enter submission
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Cancelar o Enter do bipador
      e.stopPropagation();

      // Se há um termo de busca, forçar a busca imediatamente
      if (searchTerm.trim()) {
        searchProducts(searchTerm.trim());
      }
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchProducts(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchProducts, searchTerm]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setFormData({
        type: "entry",
        reason: "purchase",
        quantity: "",
        notes: "",
      });
      setSelectedProduct(null);
      setSearchTerm("");
      setProducts([]);
      setShowProductSearch(true);
      setErrors({});
    }
  }, [open]);

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedProduct) {
      newErrors.product = "Selecione um produto";
    }

    if (!formData.type) {
      newErrors.type = "Selecione o tipo de movimentação";
    }

    if (!formData.reason) {
      newErrors.reason = "Selecione o motivo da movimentação";
    }

    if (!formData.quantity || Number(formData.quantity) <= 0) {
      newErrors.quantity = "Quantidade deve ser maior que zero";
    }

    // Check if quantity is valid for the operation
    if (selectedProduct && formData.type === "exit" && formData.quantity) {
      const requestedQuantity = Number(formData.quantity);
      if (requestedQuantity > selectedProduct.stock) {
        newErrors.quantity = `Quantidade não disponível em estoque (disponível: ${selectedProduct.stock})`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await createMovement({
        product_id: selectedProduct!.id,
        type: formData.type,
        quantity: Number(formData.quantity),
        reason: formData.reason,
        notes: formData.notes || undefined,
      });

      toast({
        title: "Sucesso",
        description: "Movimentação criada com sucesso!",
        variant: "default",
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      // Erro já tratado no hook
      console.error("Erro ao criar movimentação:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get available reasons based on type
  const getAvailableReasons = () => {
    return Object.entries(STOCK_MOVEMENT_REASONS).filter(([key]) => {
      if (formData.type === "entry") {
        return ["purchase", "return", "adjustment", "transfer"].includes(key);
      } else if (formData.type === "exit") {
        return [
          "sale",
          "damage",
          "loss",
          "theft",
          "transfer",
          "other",
        ].includes(key);
      } else if (formData.type === "adjustment") {
        return ["adjustment"].includes(key);
      }
      return true;
    });
  };

  const formatProductInfo = (product: Product) => {
    const parts = [product.name];
    if (product.brand) parts.push(product.brand);
    if (product.category) parts.push(product.category);
    return parts.join(" - ");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Nova Movimentação de Estoque
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Selection */}
          <div className="space-y-4">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Search className="h-4 w-4" />
              Produto
            </Label>

            {showProductSearch && !selectedProduct && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produto por nome, SKU, marca ou código de barras..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="pl-10"
                  />
                </div>

                {isSearching && (
                  <div className="text-sm text-muted-foreground">
                    Buscando produtos...
                  </div>
                )}

                {products.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {products.map((product) => (
                      <Card
                        key={product.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowProductSearch(false);
                        }}
                      >
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium">
                                {formatProductInfo(product)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                SKU: {product.sku}
                              </div>
                            </div>
                            <Badge variant="secondary">
                              {product.stock} unidades
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedProduct && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-lg">
                        {formatProductInfo(selectedProduct)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        SKU: {selectedProduct.sku}
                      </div>
                      <div className="text-sm font-medium mt-1">
                        Estoque Atual: {selectedProduct.stock} unidades
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedProduct(null);
                        setShowProductSearch(true);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {errors.product && (
              <div className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.product}
              </div>
            )}
          </div>

          <Separator />

          {/* Movement Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tipo de Movimentação</Label>
            <Select
              value={formData.type}
              onValueChange={(value: StockMovementType) => {
                setFormData((prev) => ({
                  ...prev,
                  type: value,
                  reason: "purchase",
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STOCK_MOVEMENT_TYPES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${key === "in"
                            ? "bg-green-500"
                            : key === "out"
                              ? "bg-red-500"
                              : "bg-blue-500"
                          }`}
                      />
                      {value}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <div className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.type}
              </div>
            )}
          </div>

          {/* Movement Reason */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Motivo</Label>
            <Select
              value={formData.reason}
              onValueChange={(value: StockMovementReason) => {
                setFormData((prev) => ({ ...prev, reason: value }));
              }}
              disabled={!formData.type}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableReasons().map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.reason && (
              <div className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.reason}
              </div>
            )}
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quantidade (unidades)</Label>
            <Input
              type="number"
              min="1"
              step="1"
              value={formData.quantity}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, quantity: e.target.value }))
              }
              placeholder="Digite a quantidade"
            />
            {errors.quantity && (
              <div className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.quantity}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Observações (Opcional)
            </Label>
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Adicione observações sobre esta movimentação..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Registrando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Registrar Movimentação
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StockMovementModal;
export { StockMovementModal };
