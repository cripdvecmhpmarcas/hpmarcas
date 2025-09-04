"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Edit,
  Eye,
  Package,
  DollarSign,
  Barcode,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSupabaseAdmin } from "@/hooks/useSupabaseAdmin";
import { ProductWithVolumes, ProductVolume } from "@/types/products";
import { formatCurrency } from "@/lib/pdv-utils";
import { useCallback } from "react";

interface ViewProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ViewProductPage({ params }: ViewProductPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const [product, setProduct] = useState<ProductWithVolumes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useSupabaseAdmin();


  const loadProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Produto não encontrado");

      // Process volumes
      let volumes: ProductVolume[] | null = null;
      if (data.volumes) {
        try {
          volumes = Array.isArray(data.volumes)
            ? data.volumes
            : JSON.parse(data.volumes as string);
        } catch (e) {
          console.warn("Error parsing volumes:", e);
          volumes = null;
        }
      }

      setProduct({
        ...data,
        volumes,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar produto";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => {
    loadProduct();
  }, [id, loadProduct, supabase]);



  const getStockStatus = () => {
    if (!product) return "in_stock";
    if (product.stock === 0) return "out_of_stock";
    if (product.stock < product.min_stock) return "low_stock";
    return "in_stock";
  };

  const getStockBadge = () => {
    const status = getStockStatus();
    const config = {
      in_stock: {
        label: "Em Estoque",
        variant: "default" as const,
        icon: CheckCircle,
      },
      low_stock: {
        label: "Estoque Baixo",
        variant: "destructive" as const,
        icon: AlertTriangle,
      },
      out_of_stock: {
        label: "Sem Estoque",
        variant: "secondary" as const,
        icon: XCircle,
      },
    };

    const { label, variant, icon: Icon } = config[status];
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const calculateMargin = (cost: number, price: number) => {
    if (cost === 0) return 0;
    return ((price - cost) / cost) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Package className="h-8 w-8 mx-auto mb-2 animate-pulse" />
          <p>Carregando produto...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.push("/dashboard/produtos")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Produtos
          </Button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Produto não encontrado</h2>
          <p className="text-muted-foreground mb-4">
            O produto solicitado não existe ou foi removido.
          </p>
          <Button onClick={() => router.push("/dashboard/produtos")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Produtos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/produtos")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">{product.brand}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(`/dashboard/produtos/${product.id}/editar`)
            }
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          {/* <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button> */}
        </div>
      </div>

      {/* Status and Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  variant={
                    product.status === "active" ? "default" : "secondary"
                  }
                >
                  {product.status === "active" ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Estoque</p>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{product.stock}</span>
                  {getStockBadge()}
                </div>
              </div>
              <AlertTriangle className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Categoria</p>
                <p className="font-semibold">{product.category}</p>
              </div>
              <Eye className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes do Produto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Descrição</Label>
              <p className="text-muted-foreground">
                {product.description || "Sem descrição"}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Marca</Label>
              <p>{product.brand}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SKU and Barcode */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Barcode className="h-5 w-5" />
            <CardTitle>Identificação</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">SKU</Label>
              <p className="font-mono">{product.sku}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Código de Barras</Label>
              <p className="font-mono">{product.barcode || "Não informado"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            <CardTitle>Preços e Margens</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Custo</p>
              <p className="text-2xl font-bold">
                {formatCurrency(product.cost)}
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">
                Preço Atacado
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(product.wholesale_price)}
              </p>
              <p className="text-xs text-muted-foreground">
                Margem:{" "}
                {calculateMargin(product.cost, product.wholesale_price).toFixed(
                  1
                )}
                %
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Preço Varejo</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(product.retail_price)}
              </p>
              <p className="text-xs text-muted-foreground">
                Margem:{" "}
                {calculateMargin(product.cost, product.retail_price).toFixed(1)}
                %
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Details */}
      <Card>
        <CardHeader>
          <CardTitle>Informações de Estoque</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium">Quantidade Atual</Label>
              <p className="text-xl font-semibold">{product.stock} unidades</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Estoque Mínimo</Label>
              <p className="text-xl font-semibold">
                {product.min_stock} unidades
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Valor Total</Label>
              <p className="text-xl font-semibold">
                {formatCurrency(product.stock * product.cost)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Volumes */}
      {product.volumes && product.volumes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Volumes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {product.volumes.map((volume, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 border rounded"
                >
                  <Badge variant="outline">
                    {volume.size}
                    {volume.unit}
                  </Badge>
                  {volume.barcode && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {volume.barcode}
                    </span>
                  )}
                  {(volume.price_adjustment || 0) !== 0 && (
                    <span className="text-xs text-muted-foreground">
                      {(volume.price_adjustment || 0) > 0 ? "+" : ""}
                      {formatCurrency(volume.price_adjustment || 0)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Images */}
      {product.images && product.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Imagens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {product.images.map((image, index) => (
                <Image
                  key={index}
                  src={image}
                  alt={`${product.name} - ${index + 1}`}
                  width={200}
                  height={128}
                  className="w-full h-32 object-cover rounded border"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Label({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <label className={className}>{children}</label>;
}
