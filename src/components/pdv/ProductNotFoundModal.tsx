// Funcionalidades:
// - 3 opções: Vincular, Cadastro Completo, Cadastro Rápido
//   - Listar produtos sem código para vincular
//     - Formulários de cadastro

// src/components/pdv/ProductNotFoundModal.tsx
"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Link,
  Package,
  Zap,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Product } from "@/types/pdv";
import { useSupabaseAdmin } from "@/hooks/useSupabaseAdmin";

interface ProductNotFoundModalProps {
  open: boolean;
  onClose: () => void;
  barcode: string;
  onProductCreated: (product: Product) => void;
  onProductLinked: (product: Product) => void;
  customerType: "retail" | "wholesale";
}


interface QuickProductData {
  name: string;
  brand: string;
  category: string;
  retail_price: string;
  wholesale_price: string;
  volume: string;
}

export const ProductNotFoundModal: React.FC<ProductNotFoundModalProps> = ({
  open,
  onClose,
  barcode,
  onProductCreated,
  onProductLinked,
  customerType,
}) => {
  // Cliente Supabase
  const supabase = useSupabaseAdmin();

  // Estados
  const [activeTab, setActiveTab] = useState("link");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estados para busca de produtos existentes
  const [searchTerm, setSearchTerm] = useState("");
  const [existingProducts, setExistingProducts] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Estados para cadastro rápido
  const [quickProduct, setQuickProduct] = useState<QuickProductData>({
    name: "",
    brand: "",
    category: "",
    retail_price: "",
    wholesale_price: "",
    volume: "",
  });

  // Estados para cadastro completo
  const [fullProduct, setFullProduct] = useState({
    name: "",
    brand: "",
    category: "",
    description: "",
    retail_price: "",
    wholesale_price: "",
    cost: "",
    stock: "1",
    min_stock: "5",
    volume: "",
    sku: "",
  });

  // Categorias predefinidas
  const categories = [
    "Perfume Masculino",
    "Perfume Feminino",
    "Perfume Unissex",
    "Cosmético",
    "Hidratante",
    "Shampoo",
    "Condicionador",
    "Sabonete",
    "Desodorante",
    "Cuidados Pessoais",
    "Acessório",
    "Outro",
  ];

  // Buscar produtos existentes sem código
  const searchExistingProducts = useCallback(async (term: string) => {
    if (!term.trim()) {
      setExistingProducts([]);
      return;
    }

    setSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("status", "active")
        .is("barcode", null) // Apenas produtos sem código
        .or(`name.ilike.%${term}%,brand.ilike.%${term}%,sku.ilike.%${term}%`)
        .limit(10);

      if (error) throw error;
      setExistingProducts(
        (data || []).map((item) => ({
          ...item,
          volumes: item.volumes as import("@/types").Json,
        }))
      );
    } catch (err) {
      console.error("Erro ao buscar produtos:", err);
      setError("Erro ao buscar produtos existentes");
    } finally {
      setSearchLoading(false);
    }
  }, [supabase]);

  // Vincular código a produto existente
  const linkBarcodeToProduct = async (product: Product) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("products")
        .update({ barcode })
        .eq("id", product.id);

      if (error) throw error;

      const updatedProduct = { ...product, barcode };
      setSuccess(`Código vinculado ao produto "${product.name}" com sucesso!`);

      setTimeout(() => {
        onProductLinked(updatedProduct);
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Erro ao vincular código:", err);
      setError("Erro ao vincular código ao produto");
    } finally {
      setLoading(false);
    }
  };

  // Criar produto rápido
  const createQuickProduct = async () => {
    if (!quickProduct.name.trim() || !quickProduct.retail_price) {
      setError("Nome e preço são obrigatórios");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const retailPrice = parseFloat(quickProduct.retail_price);
      const wholesalePrice = quickProduct.wholesale_price
        ? parseFloat(quickProduct.wholesale_price)
        : retailPrice * 0.8; // 20% desconto default

      // Gerar SKU automático
      const sku = `PRD-${Date.now().toString().slice(-6)}`;

      const productData = {
        name: quickProduct.name,
        brand: quickProduct.brand || "Sem Marca",
        category: quickProduct.category || "Produto",
        description: `${quickProduct.name}${quickProduct.volume ? ` - ${quickProduct.volume}` : ""
          } (Cadastro rápido PDV)`,
        barcode,
        sku,
        retail_price: retailPrice,
        wholesale_price: wholesalePrice,
        cost: retailPrice * 0.6, // 40% do preço de venda
        stock: 1,
        min_stock: 1,
        volumes: quickProduct.volume
          ? JSON.stringify([{ size: quickProduct.volume, price: retailPrice }])
          : null,
        status: "active",
      };

      const { data, error } = await supabase
        .from("products")
        .insert(productData)
        .select()
        .single();

      if (error) throw error;

      setSuccess(`Produto "${quickProduct.name}" cadastrado com sucesso!`);

      setTimeout(() => {
        onProductCreated(data as Product);
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Erro ao criar produto:", err);
      setError("Erro ao cadastrar produto");
    } finally {
      setLoading(false);
    }
  };

  // Criar produto completo
  const createFullProduct = async () => {
    if (
      !fullProduct.name.trim() ||
      !fullProduct.retail_price ||
      !fullProduct.wholesale_price
    ) {
      setError("Nome, preço varejo e atacado são obrigatórios");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const sku =
        fullProduct.sku.trim() || `PRD-${Date.now().toString().slice(-6)}`;

      const productData = {
        name: fullProduct.name,
        brand: fullProduct.brand || "Sem Marca",
        category: fullProduct.category || "Produto",
        description: fullProduct.description || fullProduct.name,
        barcode,
        sku,
        retail_price: parseFloat(fullProduct.retail_price),
        wholesale_price: parseFloat(fullProduct.wholesale_price),
        cost: fullProduct.cost
          ? parseFloat(fullProduct.cost)
          : parseFloat(fullProduct.retail_price) * 0.6,
        stock: parseInt(fullProduct.stock),
        min_stock: parseInt(fullProduct.min_stock),
        volumes: fullProduct.volume
          ? JSON.stringify([
            {
              size: fullProduct.volume,
              price: parseFloat(fullProduct.retail_price),
            },
          ])
          : null,
        status: "active",
      };

      const { data, error } = await supabase
        .from("products")
        .insert(productData)
        .select()
        .single();

      if (error) throw error;

      setSuccess(`Produto "${fullProduct.name}" cadastrado completamente!`);

      setTimeout(() => {
        onProductCreated(data as Product);
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Erro ao criar produto completo:", err);
      setError("Erro ao cadastrar produto completo");
    } finally {
      setLoading(false);
    }
  };

  // Reset estados ao fechar
  const handleClose = () => {
    setActiveTab("link");
    setError(null);
    setSuccess(null);
    setSearchTerm("");
    setExistingProducts([]);
    setQuickProduct({
      name: "",
      brand: "",
      category: "",
      retail_price: "",
      wholesale_price: "",
      volume: "",
    });
    setFullProduct({
      name: "",
      brand: "",
      category: "",
      description: "",
      retail_price: "",
      wholesale_price: "",
      cost: "",
      stock: "1",
      min_stock: "5",
      volume: "",
      sku: "",
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0">
        {/* Header fixo */}
        <div className="sticky top-0 bg-white border-b p-6 z-10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Produto Não Encontrado
            </DialogTitle>
            <DialogDescription>
              O código{" "}
              <Badge variant="outline" className="font-mono">
                {barcode}
              </Badge>{" "}
              não foi encontrado no sistema. Escolha uma das opções abaixo para
              continuar:
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Conteúdo com scroll */}
        <div className="flex-1 flex flex-col">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col"
          >
            <div className="p-6 pb-0">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="link" className="flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  Vincular Existente
                </TabsTrigger>
                <TabsTrigger value="quick" className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Cadastro Rápido
                </TabsTrigger>
                <TabsTrigger value="full" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Cadastro Completo
                </TabsTrigger>
              </TabsList>

              {/* Status Messages */}
              {error && (
                <Alert className="border-red-200 bg-red-50 mt-4">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50 mt-4">
                  <CheckCircle className="w-4 h-4" />
                  <AlertDescription className="text-green-800">
                    {success}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Tab 1: Vincular a Produto Existente */}
            <TabsContent
              value="link"
              className="flex-1 flex flex-col px-6 pb-0"
            >
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                <div>
                  <Label>Buscar Produto Existente</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="Digite nome, marca ou SKU..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        searchExistingProducts(e.target.value);
                      }}
                    />
                    {searchLoading && (
                      <Loader2 className="w-4 h-4 animate-spin self-center" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Mostrando apenas produtos que ainda não têm código de barras
                  </p>
                </div>

                <div className="min-h-[300px]">
                  {existingProducts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {searchTerm
                        ? "Nenhum produto encontrado"
                        : "Digite para buscar produtos"}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {existingProducts.map((product) => (
                        <div
                          key={product.id}
                          className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-gray-500">
                                {product.brand} • SKU: {product.sku}
                              </div>
                              <div className="text-sm">
                                <span className="text-green-600 font-medium">
                                  R${" "}
                                  {(customerType === "wholesale"
                                    ? product.wholesale_price
                                    : product.retail_price
                                  ).toFixed(2)}
                                </span>
                                <span className="text-gray-500 ml-2">
                                  Estoque: {product.stock}
                                </span>
                              </div>
                            </div>
                            <Button
                              onClick={() => linkBarcodeToProduct(product)}
                              disabled={loading}
                              size="sm"
                            >
                              {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                "Vincular"
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer da aba Vincular */}
              <div className="border-t bg-white p-4">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                  className="w-full"
                >
                  Fechar
                </Button>
              </div>
            </TabsContent>

            {/* Tab 2: Cadastro Rápido */}
            <TabsContent
              value="quick"
              className="flex-1 flex flex-col px-6 pb-0"
            >
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Cadastro Rápido:</strong> Preencha apenas os campos
                    essenciais. Você pode completar as informações depois.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome do Produto *</Label>
                    <Input
                      value={quickProduct.name}
                      onChange={(e) =>
                        setQuickProduct((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Ex: Perfume Azzaro Chrome"
                    />
                  </div>

                  <div>
                    <Label>Marca</Label>
                    <Input
                      value={quickProduct.brand}
                      onChange={(e) =>
                        setQuickProduct((prev) => ({
                          ...prev,
                          brand: e.target.value,
                        }))
                      }
                      placeholder="Ex: Azzaro"
                    />
                  </div>

                  <div>
                    <Label>Categoria</Label>
                    <Select
                      value={quickProduct.category}
                      onValueChange={(value: string) =>
                        setQuickProduct((prev) => ({
                          ...prev,
                          category: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Volume/Tamanho</Label>
                    <Input
                      value={quickProduct.volume}
                      onChange={(e) =>
                        setQuickProduct((prev) => ({
                          ...prev,
                          volume: e.target.value,
                        }))
                      }
                      placeholder="Ex: 100ml, 50g, Único"
                    />
                  </div>

                  <div>
                    <Label>Preço Varejo (R$) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={quickProduct.retail_price}
                      onChange={(e) =>
                        setQuickProduct((prev) => ({
                          ...prev,
                          retail_price: e.target.value,
                        }))
                      }
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label>Preço Atacado (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={quickProduct.wholesale_price}
                      onChange={(e) =>
                        setQuickProduct((prev) => ({
                          ...prev,
                          wholesale_price: e.target.value,
                        }))
                      }
                      placeholder="Deixe vazio para 20% de desconto automático"
                    />
                  </div>
                </div>
              </div>

              {/* Footer da aba Cadastro Rápido */}
              <div className="border-t bg-white p-4">
                <div className="flex gap-2">
                  <Button
                    onClick={createQuickProduct}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Zap className="w-4 h-4 mr-2" />
                    )}
                    Cadastrar e Adicionar à Venda
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Tab 3: Cadastro Completo */}
            <TabsContent
              value="full"
              className="flex-1 flex flex-col px-6 pb-0"
            >
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Cadastro Completo:</strong> Preencha todas as
                    informações do produto. Ele ficará 100% cadastrado no
                    sistema.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome do Produto *</Label>
                    <Input
                      value={fullProduct.name}
                      onChange={(e) =>
                        setFullProduct((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Nome completo do produto"
                    />
                  </div>

                  <div>
                    <Label>Marca</Label>
                    <Input
                      value={fullProduct.brand}
                      onChange={(e) =>
                        setFullProduct((prev) => ({
                          ...prev,
                          brand: e.target.value,
                        }))
                      }
                      placeholder="Marca do produto"
                    />
                  </div>

                  <div>
                    <Label>Categoria</Label>
                    <Select
                      value={fullProduct.category}
                      onValueChange={(value: string) =>
                        setFullProduct((prev) => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>SKU</Label>
                    <Input
                      value={fullProduct.sku}
                      onChange={(e) =>
                        setFullProduct((prev) => ({
                          ...prev,
                          sku: e.target.value,
                        }))
                      }
                      placeholder="Deixe vazio para gerar automático"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label>Descrição</Label>
                    <Input
                      value={fullProduct.description}
                      onChange={(e) =>
                        setFullProduct((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Descrição detalhada do produto"
                    />
                  </div>

                  <div>
                    <Label>Volume/Tamanho</Label>
                    <Input
                      value={fullProduct.volume}
                      onChange={(e) =>
                        setFullProduct((prev) => ({
                          ...prev,
                          volume: e.target.value,
                        }))
                      }
                      placeholder="Ex: 100ml, 50g, Único"
                    />
                  </div>

                  <div>
                    <Label>Preço Varejo (R$) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={fullProduct.retail_price}
                      onChange={(e) =>
                        setFullProduct((prev) => ({
                          ...prev,
                          retail_price: e.target.value,
                        }))
                      }
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label>Preço Atacado (R$) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={fullProduct.wholesale_price}
                      onChange={(e) =>
                        setFullProduct((prev) => ({
                          ...prev,
                          wholesale_price: e.target.value,
                        }))
                      }
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label>Custo (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={fullProduct.cost}
                      onChange={(e) =>
                        setFullProduct((prev) => ({
                          ...prev,
                          cost: e.target.value,
                        }))
                      }
                      placeholder="Deixe vazio para 60% do preço varejo"
                    />
                  </div>

                  <div>
                    <Label>Estoque Inicial</Label>
                    <Input
                      type="number"
                      value={fullProduct.stock}
                      onChange={(e) =>
                        setFullProduct((prev) => ({
                          ...prev,
                          stock: e.target.value,
                        }))
                      }
                      placeholder="1"
                    />
                  </div>

                  <div>
                    <Label>Estoque Mínimo</Label>
                    <Input
                      type="number"
                      value={fullProduct.min_stock}
                      onChange={(e) =>
                        setFullProduct((prev) => ({
                          ...prev,
                          min_stock: e.target.value,
                        }))
                      }
                      placeholder="5"
                    />
                  </div>
                </div>
              </div>

              {/* Footer da aba Cadastro Completo */}
              <div className="border-t bg-white p-4">
                <div className="flex gap-2">
                  <Button
                    onClick={createFullProduct}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Package className="w-4 h-4 mr-2" />
                    )}
                    Cadastrar Produto Completo
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
