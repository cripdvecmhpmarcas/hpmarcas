"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Receipt,
  User,
  Calendar,
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useSaleReceipt } from "./hooks/useSaleReceipt";
import { useSupabaseAdmin } from "@/hooks/useSupabaseAdmin";
import {
  generateThermalReceiptText,
  printThermalReceipt,
  convertSaleDataToThermalReceipt
} from "@/lib/thermal-receipt-utils";
import {
  SaleWithDetails,
  SALE_STATUSES,
  PAYMENT_METHODS,
  CUSTOMER_TYPES,
} from "@/types/sales";

export interface SaleDetailsModalProps {
  saleId: string | null;
  open: boolean;
  onClose: () => void;
}

export const SaleDetailsModal: React.FC<SaleDetailsModalProps> = ({
  saleId,
  open,
  onClose,
}) => {
  const [saleData, setSaleData] = useState<SaleWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  const {
    generateReceipt,
    downloadPDF,
    loading: receiptLoading,
    error: receiptError,
  } = useSaleReceipt();

  const supabase = useSupabaseAdmin();

  // Função para buscar dados da venda
  const fetchSaleData = useCallback(async (id: string) => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            id,
            quantity,
            unit_price,
            total_price,
            product_name,
            product_sku,
            product_id,
            created_at,
            sale_id,
            products (
              id,
              name,
              sku,
              cost,
              retail_price,
              wholesale_price,
              category,
              volumes
            )
          ),
          customers (
            id,
            name,
            email,
            phone,
            type,
            cpf_cnpj
          )
        `)
        .eq('id', id)
        .single();

      if (fetchError || !data) {
        throw new Error('Venda não encontrada');
      }

      // Processar dados para calcular lucros
      const saleItems = data.sale_items?.map((item: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        const product = item.products;
        const costPrice = product?.cost || 0;
        const profitPerUnit = item.unit_price - costPrice;
        const totalProfit = profitPerUnit * item.quantity;

        return {
          ...item,
          product,
          profit_per_unit: profitPerUnit,
          total_profit: totalProfit,
        };
      }) || [];

      const totalProfit = saleItems.reduce((sum, item) => sum + (item.total_profit || 0), 0);
      const profitMargin = data.total > 0 ? (totalProfit / data.total) * 100 : 0;

      const processedSale: SaleWithDetails = {
        ...data,
        sale_items: saleItems,
        customer: data.customers as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        total_profit: totalProfit,
        profit_margin: profitMargin,
        items_count: saleItems.length,
      };

      setSaleData(processedSale);
    } catch (err) {
      console.error('Error fetching sale data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados da venda';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Carregar dados quando modal abre
  useEffect(() => {
    if (open && saleId) {
      fetchSaleData(saleId);
    } else {
      setSaleData(null);
      setError(null);
    }
  }, [open, saleId, fetchSaleData]);

  // Funções utilitárias
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProfitColor = (margin: number) => {
    if (margin >= 30) return 'text-green-600';
    if (margin >= 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Handlers para ações
  const handlePrintReceipt = async () => {
    if (!saleData) return;

    try {
      const thermalData = convertSaleDataToThermalReceipt(saleData);
      const receiptText = generateThermalReceiptText(thermalData);

      printThermalReceipt(
        receiptText,
        saleData.id,
        () => setPrinting(true),
        () => setPrinting(false),
        true // isReprint = true para mostrar 2ª VIA
      );
    } catch (error) {
      console.error("Erro ao imprimir cupom:", error);
    }
  };

  const handleDownloadPDF = async () => {
    if (!saleId) return;
    await generateReceipt(saleId);
    await downloadPDF();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] overflow-hidden p-0 flex flex-col">
        {/* Header fixo */}
        <div className="flex-shrink-0 bg-white border-b p-4 md:p-6 z-10">
          <DialogHeader>
            <DialogTitle className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <span className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                Detalhes da Venda
              </span>
              {saleData && (
                <>
                  <Badge variant="outline" className="text-sm">
                    #{saleData.id.slice(-8).toUpperCase()}
                  </Badge>
                  <Badge
                    className={`text-sm ${getStatusColor(saleData.status)}`}
                    variant="secondary"
                  >
                    {SALE_STATUSES[saleData.status as keyof typeof SALE_STATUSES] || saleData.status}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="ml-0 md:ml-2 text-lg md:text-xl px-3 py-2 font-bold"
                  >
                    {formatCurrency(saleData.total)}
                  </Badge>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Informações completas da venda incluindo breakdown financeiro e análise de lucro
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4 md:p-6 space-y-6">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2">Carregando dados da venda...</span>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{error}</span>
              </div>
            )}

            {saleData && (
              <>
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Data e Hora
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-medium">{formatDate(saleData.created_at)}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Cliente
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-medium">{saleData.customer_name}</p>
                      <p className="text-sm text-gray-600">
                        {CUSTOMER_TYPES[saleData.customer_type as keyof typeof CUSTOMER_TYPES]}
                      </p>
                      {saleData.customer?.cpf_cnpj && (
                        <p className="text-sm text-gray-600">{saleData.customer.cpf_cnpj}</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Pagamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-medium">
                        {PAYMENT_METHODS[saleData.payment_method as keyof typeof PAYMENT_METHODS] || saleData.payment_method}
                      </p>
                      {saleData.salesperson_name && (
                        <p className="text-sm text-gray-600">Vendedor: {saleData.salesperson_name}</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Breakdown Financeiro */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Breakdown Financeiro
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Subtotal</p>
                        <p className="text-lg font-semibold">{formatCurrency(saleData.subtotal)}</p>
                      </div>
                      {saleData.discount_amount && saleData.discount_amount > 0 && (
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Desconto</p>
                          <p className="text-lg font-semibold text-green-600">
                            -{formatCurrency(saleData.discount_amount)}
                          </p>
                          <p className="text-xs text-gray-500">
                            ({formatPercentage(saleData.discount_percent || 0)})
                          </p>
                        </div>
                      )}
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Total Final</p>
                        <p className="text-xl font-bold text-blue-600">{formatCurrency(saleData.total)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Lucro Líquido</p>
                        <p className={`text-xl font-bold ${getProfitColor(saleData.profit_margin || 0)}`}>
                          {formatCurrency(saleData.total_profit || 0)}
                        </p>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          {(saleData.profit_margin || 0) >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                          <span className={`text-sm ${getProfitColor(saleData.profit_margin || 0)}`}>
                            {formatPercentage(saleData.profit_margin || 0)}
                          </span>
                        </div>
                        <Progress
                          value={Math.min(Math.max(saleData.profit_margin || 0, 0), 100)}
                          className="mt-2 h-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Análise por Item */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Análise por Item
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full border rounded-lg bg-white">
                      <div className="overflow-x-auto">
                        <Table className="min-w-[800px]">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[200px]">Produto</TableHead>
                              <TableHead className="text-center min-w-[60px]">Qtd</TableHead>
                              <TableHead className="text-right min-w-[100px]">Preço Unit.</TableHead>
                              <TableHead className="text-right min-w-[100px]">Custo Unit.</TableHead>
                              <TableHead className="text-right min-w-[100px]">Lucro Unit.</TableHead>
                              <TableHead className="text-right min-w-[100px]">Total</TableHead>
                              <TableHead className="text-right min-w-[110px]">Lucro Total</TableHead>
                              <TableHead className="text-center min-w-[80px]">Margem</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {saleData.sale_items.map((item) => {
                              const profitMargin = item.unit_price > 0 ?
                                ((item.profit_per_unit || 0) / item.unit_price) * 100 : 0;

                              return (
                                <TableRow key={item.id}>
                                  <TableCell className="min-w-[200px]">
                                    <div>
                                      <p className="font-medium text-sm">{item.product_name}</p>
                                      <p className="text-xs text-gray-600">{item.product_sku}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center min-w-[60px]">{item.quantity}</TableCell>
                                  <TableCell className="text-right min-w-[100px] text-sm">{formatCurrency(item.unit_price)}</TableCell>
                                  <TableCell className="text-right min-w-[100px] text-sm">
                                    {formatCurrency(item.product?.cost || 0)}
                                  </TableCell>
                                  <TableCell className={`text-right min-w-[100px] text-sm ${getProfitColor(profitMargin)}`}>
                                    {formatCurrency(item.profit_per_unit || 0)}
                                  </TableCell>
                                  <TableCell className="text-right font-medium min-w-[100px] text-sm">
                                    {formatCurrency(item.total_price)}
                                  </TableCell>
                                  <TableCell className={`text-right font-medium min-w-[110px] text-sm ${getProfitColor(profitMargin)}`}>
                                    {formatCurrency(item.total_profit || 0)}
                                  </TableCell>
                                  <TableCell className="text-center min-w-[80px]">
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${getProfitColor(profitMargin)}`}
                                    >
                                      {formatPercentage(profitMargin)}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Comparação de Preços */}
                <Card>
                  <CardHeader>
                    <CardTitle>Comparação de Preços</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full border rounded-lg bg-white">
                      <div className="overflow-x-auto">
                        <Table className="min-w-[700px]">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[200px]">Produto</TableHead>
                              <TableHead className="text-right min-w-[120px]">Preço Vendido</TableHead>
                              <TableHead className="text-right min-w-[120px]">Preço Varejo</TableHead>
                              <TableHead className="text-right min-w-[120px]">Preço Atacado</TableHead>
                              <TableHead className="text-center min-w-[140px]">Diferença</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {saleData.sale_items.map((item) => {
                              const retailPrice = item.product?.retail_price || 0;
                              const wholesalePrice = item.product?.wholesale_price || 0;
                              const soldPrice = item.unit_price;

                              const retailDiff = retailPrice > 0 ? ((soldPrice - retailPrice) / retailPrice) * 100 : 0;
                              const wholesaleDiff = wholesalePrice > 0 ? ((soldPrice - wholesalePrice) / wholesalePrice) * 100 : 0;

                              return (
                                <TableRow key={item.id}>
                                  <TableCell className="min-w-[200px]">
                                    <div>
                                      <p className="font-medium text-sm">{item.product_name}</p>
                                      <p className="text-xs text-gray-600">{item.product_sku}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right font-medium min-w-[120px] text-sm">
                                    {formatCurrency(soldPrice)}
                                  </TableCell>
                                  <TableCell className="text-right min-w-[120px] text-sm">
                                    {formatCurrency(retailPrice)}
                                  </TableCell>
                                  <TableCell className="text-right min-w-[120px] text-sm">
                                    {formatCurrency(wholesalePrice)}
                                  </TableCell>
                                  <TableCell className="text-center min-w-[140px]">
                                    <div className="space-y-1">
                                      <Badge
                                        variant="outline"
                                        className={`text-xs ${retailDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                      >
                                        Varejo: {retailDiff >= 0 ? '+' : ''}{formatPercentage(retailDiff)}
                                      </Badge>
                                      <Badge
                                        variant="outline"
                                        className={`text-xs ${wholesaleDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                      >
                                        Atacado: {wholesaleDiff >= 0 ? '+' : ''}{formatPercentage(wholesaleDiff)}
                                      </Badge>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Observações */}
                {saleData.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Observações</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{saleData.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer com ações */}
        <div className="flex-shrink-0 bg-white border-t p-4 md:p-6 z-10">
          {(receiptError) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-red-800 text-sm">{receiptError}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 md:flex-none"
            >
              Fechar
            </Button>

            <Separator orientation="vertical" className="hidden md:block h-6" />

            <Button
              variant="outline"
              onClick={handlePrintReceipt}
              disabled={printing || !saleData}
              className="flex items-center gap-2"
            >
              <Receipt className="w-4 h-4" />
              {printing ? "Imprimindo..." : "Imprimir 2ª Via"}
            </Button>

            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              disabled={receiptLoading || !saleId}
              className="flex items-center gap-2"
            >
              <Receipt className="w-4 h-4" />
              PDF
            </Button>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
