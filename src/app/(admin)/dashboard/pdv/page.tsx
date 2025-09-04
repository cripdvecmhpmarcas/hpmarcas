"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePDV } from "@/hooks/usePDV";
import { ProductSearch } from "@/components/pdv/ProductSearch";
import { SaleCart } from "@/components/pdv/SaleCart";
import { ProductNotFoundModal } from "@/components/pdv/ProductNotFoundModal";
import { PaymentModal } from "@/components/pdv/PaymentModal";
import { ReceiptModal } from "@/components/pdv/ReceiptModal";
import { useAdminAuthContext } from "@/components/auth/admin/AdminAuthProvider";
import { useSupabaseAdmin } from "@/hooks/useSupabaseAdmin";
import {
  ShoppingCart,
  Users,
  AlertCircle,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle2,
  Package,
} from "lucide-react";
import { Product } from "@/types/pdv";
import type { PDVPaymentData, PDVReceiptData } from "@/types/pdv";
import type { ProductVolume, ProductWithVolumes } from "@/types/products";

export default function PDVPage() {
  const { profile } = useAdminAuthContext();
  const {
    saleData,
    loading,
    error,
    addItemToSale,
    updateItemQuantity,
    removeItemFromSale,
    updateCustomer,
    toggleWholesaleMode,
    applyDiscount,
    applyItemDiscount,
    removeItemDiscount,
    applyManualPriceAdjustment,
    removeManualPriceAdjustment,
    setPaymentMethod,
    setNotes,
    finalizeSale,
    clearSale,
    isReady,
    itemCount,
    clearPersistedData,
    wasDataRecovered,
    markRecoveryBannerShown,
  } = usePDV();

  // Estados para modal de produto não encontrado
  const [showProductNotFoundModal, setShowProductNotFoundModal] =
    useState(false);
  const [productNotFoundBarcode, setProductNotFoundBarcode] = useState("");

  // Estados para modal de pagamento
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Estados para modal de cupom fiscal
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastSaleData, setLastSaleData] = useState<PDVReceiptData | null>(null);

  // Estados para feedback de sucesso
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estado para mostrar banner de dados recuperados
  const [showDataRecoveredBanner, setShowDataRecoveredBanner] = useState(false);

  // Estados para estatísticas reais
  const [todayStats, setTodayStats] = useState({
    sales: 0,
    revenue: 0,
    avgTicket: 0,
    loading: true,
  });

  // Handler para produto selecionado com volume específico
  const handleProductWithVolumeSelected = async (
    product: Product | ProductWithVolumes,
    volume?: ProductVolume
  ) => {
    // Converter ProductWithVolumes para Product se necessário
    const productForSale = product as Product;
    const result = await addItemToSale(productForSale, 1, volume);
    if (result.success) {
      const volumeText = volume ? ` - ${volume.size}${volume.unit}` : "";
      setSuccessMessage(
        `Produto "${product.name}${volumeText}" adicionado ao carrinho!`
      );
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      setSuccessMessage(`Erro: ${result.error}`);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  // Handler para produto não encontrado
  const handleProductNotFound = (barcode: string) => {
    setProductNotFoundBarcode(barcode);
    setShowProductNotFoundModal(true);
  };

  // Handler para produto criado/vinculado via modal
  const handleProductCreatedOrLinked = async (product: Product) => {
    const result = await addItemToSale(product, 1);
    setShowProductNotFoundModal(false);
    if (result.success) {
      setSuccessMessage(
        `Produto "${product.name}" criado e adicionado ao carrinho!`
      );
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      setSuccessMessage(`Erro: ${result.error}`);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  // Handler para abrir modal de pagamento
  const handleOpenPaymentModal = useCallback(() => {
    if (saleData.items.length === 0) {
      setSuccessMessage("Adicione produtos ao carrinho primeiro");
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }
    setShowPaymentModal(true);
  }, [saleData.items.length, setSuccessMessage, setShowPaymentModal]);

  // Handler para confirmar venda via modal de pagamento
  const handleConfirmSale = async (paymentData: PDVPaymentData) => {
    const result = await finalizeSale(paymentData.salespersonName);

    if (result.success) {
      setShowPaymentModal(false);

      // Recarregar estatísticas após venda bem-sucedida
      fetchTodayStats();

      // Preparar dados para o cupom fiscal
      const saleDataForReceipt: PDVReceiptData = {
        id: result.saleId || `SALE-${Date.now()}`,
        items: saleData.items,
        customer: saleData.customer,
        subtotal: saleData.subtotal,
        discountPercent: saleData.discountPercent,
        discountAmount: saleData.discountAmount,
        total: saleData.total,
        paymentMethod: paymentData.method,
        amountPaid: paymentData.amountPaid,
        change: paymentData.change,
        notes: paymentData.notes || saleData.notes,
        createdAt: new Date().toISOString(),
        userName: profile?.name || "Operador PDV",
        salespersonName: paymentData.salespersonName,
      };

      setLastSaleData(saleDataForReceipt);
      setShowReceiptModal(true);

      return result;
    } else {
      return result; // Erro será tratado pelo modal
    }
  };

  // Handler para nova venda
  const handleNewSale = () => {
    clearSale();
    setShowReceiptModal(false);
    setLastSaleData(null);
    setSuccessMessage("Pronto para nova venda!");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const supabase = useSupabaseAdmin();

  // Buscar estatísticas do dia
  const fetchTodayStats = useCallback(async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      ).toISOString();
      const endOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1
      ).toISOString();

      // Buscar vendas do dia
      const { data: sales, error } = await supabase
        .from("sales")
        .select("total, created_at")
        .gte("created_at", startOfDay)
        .lt("created_at", endOfDay)
        .eq("status", "completed");

      if (error) {
        console.error("Erro ao buscar estatísticas:", error);
        return;
      }

      const totalSales = sales?.length || 0;
      const totalRevenue =
        sales?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
      const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

      setTodayStats({
        sales: totalSales,
        revenue: totalRevenue,
        avgTicket,
        loading: false,
      });
    } catch (err) {
      console.error("Erro ao buscar estatísticas:", err);
      setTodayStats((prev) => ({ ...prev, loading: false }));
    }
  }, [supabase]);

  // Carregar estatísticas ao montar componente e atualizar após vendas
  useEffect(() => {
    fetchTodayStats();
  }, [fetchTodayStats]);

  // Detectar dados recuperados e mostrar banner (apenas na inicialização)
  useEffect(() => {
    if (wasDataRecovered() && saleData.items.length > 0) {
      setShowDataRecoveredBanner(true);
      // Marcar que o banner foi mostrado para não exibir novamente
      markRecoveryBannerShown();

      // Esconder banner após 10 segundos
      const timer = setTimeout(() => {
        setShowDataRecoveredBanner(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [wasDataRecovered, markRecoveryBannerShown, saleData.items.length]);

  // Fechar modal
  const handleCloseModal = () => {
    setShowProductNotFoundModal(false);
    setProductNotFoundBarcode("");
  };

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // F1 - Nova venda
      if (e.key === "F1") {
        e.preventDefault();
        if (saleData.items.length > 0) {
          clearSale();
          setSuccessMessage("🔄 Nova venda iniciada!");
          setTimeout(() => setSuccessMessage(null), 2000);
        }
      }

      // F2 - Abrir pagamento
      if (e.key === "F2") {
        e.preventDefault();
        if (saleData.items.length > 0) {
          handleOpenPaymentModal();
        }
      }

      // F3 - Alternar modo atacado/varejo
      if (e.key === "F3") {
        e.preventDefault();
        toggleWholesaleMode();
        const newMode =
          saleData.customer.type === "wholesale" ? "Varejo" : "Atacado";
        setSuccessMessage(`🔄 Modo ${newMode} ativado!`);
        setTimeout(() => setSuccessMessage(null), 2000);
      }

      // Esc - Fechar modais
      if (e.key === "Escape") {
        if (showPaymentModal) setShowPaymentModal(false);
        if (showProductNotFoundModal) handleCloseModal();
      }

      // Ctrl+Shift+C - Limpar dados persistidos (desenvolvimento)
      if (e.key === "C" && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        clearPersistedData();
        setSuccessMessage("Dados persistidos limpos!");
        setTimeout(() => setSuccessMessage(null), 2000);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    clearSale,
    handleOpenPaymentModal,
    saleData.items.length,
    saleData.customer.type,
    showPaymentModal,
    showProductNotFoundModal,
    clearPersistedData,
    toggleWholesaleMode,
  ]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl flex items-center justify-center shadow-lg">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Ponto de Venda (PDV)
              </h1>
              <p className="text-sm text-gray-600">
                {itemCount > 0
                  ? `${itemCount} ${itemCount === 1 ? "item" : "itens"
                  } no carrinho • Total: R$ ${saleData.total.toFixed(2)}`
                  : "Sistema pronto para vendas"}
              </p>
            </div>
          </div>

          {/* Estatísticas Rápidas */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {todayStats.loading ? (
                  <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto"></div>
                ) : (
                  todayStats.sales
                )}
              </div>
              <div className="text-xs text-gray-600">Vendas Hoje</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {todayStats.loading ? (
                  <div className="w-6 h-6 border-2 border-green-300 border-t-green-600 rounded-full animate-spin mx-auto"></div>
                ) : (
                  `R$ ${todayStats.revenue.toFixed(2)}`
                )}
              </div>
              <div className="text-xs text-gray-600">Faturamento</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {todayStats.loading ? (
                  <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                ) : (
                  `R$ ${todayStats.avgTicket.toFixed(2)}`
                )}
              </div>
              <div className="text-xs text-gray-600">Ticket Médio</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {profile?.name || "Operador"}
              </div>
              <div className="text-xs text-gray-600">Usuário Ativo</div>
            </div>
          </div>

          {/* Ações Rápidas */}
          {saleData.items.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-lg px-3 py-1 border-gold-300 text-gold-700"
              >
                <TrendingUp className="w-4 h-4 mr-1" />
                R$ {saleData.total.toFixed(2)}
              </Badge>
              <Button
                variant="outline"
                onClick={clearSale}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                size="sm"
              >
                Nova Venda
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Coluna Esquerda - Controles */}
        <div className="space-y-6">
          {/* Busca de Produtos */}
          <Card className="shadow-lg border-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                </div>
                Buscar Produto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProductSearch
                onProductFound={handleProductWithVolumeSelected}
                onProductNotFound={handleProductNotFound}
                customerType={saleData.customer.type}
                disabled={loading}
                autoFocus={true}
              />
              {/* Modal de Cupom Fiscal */}
              {lastSaleData && (
                <ReceiptModal
                  open={showReceiptModal}
                  onClose={() => setShowReceiptModal(false)}
                  saleData={lastSaleData}
                  onNewSale={handleNewSale}
                />
              )}
            </CardContent>
          </Card>

          {/* Informações do Cliente */}
          <Card className="shadow-lg border-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customer-name">Nome do Cliente</Label>
                <Input
                  id="customer-name"
                  value={saleData.customer.name}
                  onChange={(e) => updateCustomer({ name: e.target.value })}
                  placeholder="Nome do cliente"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Tipo de Cliente</Label>
                <Select
                  value={saleData.customer.type}
                  onValueChange={(value: "retail" | "wholesale") =>
                    updateCustomer({ type: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        Varejo (Preço Normal)
                      </div>
                    </SelectItem>
                    <SelectItem value="wholesale">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        Atacado (Preço Especial)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {saleData.customer.type === "wholesale" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-800">
                    <Zap className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Preços de atacado ativos
                    </span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    {saleData.items.length > 0
                      ? `${saleData.items.length} item(s) com preço de atacado aplicado`
                      : "Produtos adicionados receberão preço de atacado"}
                  </p>
                </div>
              )}

              {saleData.customer.type === "retail" &&
                saleData.items.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Preços de varejo aplicados
                      </span>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      {saleData.items.length} item(s) com preço normal
                    </p>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Atalhos Rápidos */}
          <Card className="shadow-lg border-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-gray-600" />
                </div>
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant={
                  saleData.customer.type === "wholesale" ? "default" : "outline"
                }
                className={`w-full justify-start h-10 ${saleData.customer.type === "wholesale"
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : ""
                  }`}
                onClick={() => toggleWholesaleMode()}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                {saleData.customer.type === "wholesale"
                  ? "Desativar Atacado"
                  : "Ativar Atacado"}
                <span className="text-xs opacity-70 ml-auto">F3</span>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-10"
                onClick={() => applyDiscount("percent", 10)}
                disabled={saleData.items.length === 0}
              >
                <Package className="w-4 h-4 mr-2" />
                Desconto 10%
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-10"
                onClick={() => {
                  setSuccessMessage(
                    "⌨️ Atalhos: F1=Nova Venda, F2=Pagamento, F3=Atacado/Varejo, Esc=Fechar"
                  );
                  setTimeout(() => setSuccessMessage(null), 4000);
                }}
              >
                <Clock className="w-4 h-4 mr-2" />
                Ver Atalhos (F1, F2, F3)
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Central e Direita - Carrinho de Venda */}
        <div className="lg:col-span-2">
          <Card className="h-full shadow-lg border-0">
            <SaleCart
              items={saleData.items}
              customer={saleData.customer}
              subtotal={saleData.subtotal}
              discountPercent={saleData.discountPercent}
              discountAmount={saleData.discountAmount}
              total={saleData.total}
              paymentMethod={saleData.paymentMethod}
              notes={saleData.notes}
              loading={loading}
              showDataRecoveredBanner={showDataRecoveredBanner}
              onUpdateQuantity={updateItemQuantity}
              onRemoveItem={removeItemFromSale}
              onApplyDiscount={applyDiscount}
              onApplyItemDiscount={applyItemDiscount}
              onRemoveItemDiscount={removeItemDiscount}
              onApplyManualPriceAdjustment={applyManualPriceAdjustment}
              onRemoveManualPriceAdjustment={removeManualPriceAdjustment}
              onSetPaymentMethod={setPaymentMethod}
              onSetNotes={setNotes}
              onOpenPaymentModal={handleOpenPaymentModal}
              onClearSale={clearSale}
            />
          </Card>
        </div>
      </div>

      {/* Modal de Produto Não Encontrado */}
      <ProductNotFoundModal
        open={showProductNotFoundModal}
        onClose={handleCloseModal}
        barcode={productNotFoundBarcode}
        onProductCreated={handleProductCreatedOrLinked}
        onProductLinked={handleProductCreatedOrLinked}
        customerType={saleData.customer.type}
      />

      {/* Modal de Pagamento */}
      <PaymentModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        items={saleData.items}
        customer={saleData.customer}
        subtotal={saleData.subtotal}
        discountPercent={saleData.discountPercent}
        discountAmount={saleData.discountAmount}
        total={saleData.total}
        notes={saleData.notes}
        initialPaymentMethod={saleData.paymentMethod}
        onConfirmSale={handleConfirmSale}
      />

      {/* Alertas de Status */}
      {error && (
        <Alert className="mx-6 mb-6 border-red-200 bg-red-50">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription className="text-red-800">
            <strong>Erro:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="mx-6 mb-6 border-green-200 bg-green-50">
          <CheckCircle2 className="w-4 h-4" />
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Status Bar */}
      <div className="bg-white border-t px-6 py-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>Sistema PDV v1.0</span>
            <span>•</span>
            <span>Operador: {profile?.name || "Sistema"}</span>
            <span>•</span>
            <span>{new Date().toLocaleString("pt-BR")}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>F1: Nova Venda</span>
            <span>•</span>
            <span>F2: Pagamento</span>
            <span>•</span>
            <span>ESC: Fechar</span>
          </div>
        </div>
      </div>

      {/* Status de Conexão (para debug) */}
      {process.env.NODE_ENV === "development" && (
        <div className="mx-6 mb-6 text-xs bg-gray-100 p-2 rounded">
          <div>Debug Info:</div>
          <div>Itens: {saleData.items.length}</div>
          <div>Total: R$ {saleData.total.toFixed(2)}</div>
          <div>Pagamento: {saleData.paymentMethod || "Não selecionado"}</div>
          <div>Ready: {isReady ? "Sim" : "Não"}</div>
          <div>
            Modal Produto: {showProductNotFoundModal ? "Aberto" : "Fechado"}
          </div>
          <div>Modal Pagamento: {showPaymentModal ? "Aberto" : "Fechado"}</div>
        </div>
      )}
    </div>
  );
}
