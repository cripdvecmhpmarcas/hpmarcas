// Funcionalidades:
// - Exibir dados da venda
//   - Botão imprimir
//     - Opção reenviar por email
//       - Fechar e nova venda
"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Receipt,
  Printer,
  Copy,
  Download,
  CheckCircle2,
  ShoppingBag
} from "lucide-react";
import { formatCurrency, formatPaymentMethod } from "@/lib/pdv-utils";
import {
  generateThermalReceiptText,
  printThermalReceipt,
  convertPDVDataToThermalReceipt
} from "@/lib/thermal-receipt-utils";
import type { ReceiptModalProps } from "@/types/pdv";

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  open,
  onClose,
  saleData,
  onNewSale,
}) => {
  const [copying, setCopying] = useState(false);
  const [printing, setPrinting] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Gerar texto do cupom usando função utilitária
  const generateReceiptText = () => {
    const thermalData = convertPDVDataToThermalReceipt(saleData);
    return generateThermalReceiptText(thermalData);
  };

  // Copiar cupom
  const handleCopy = async () => {
    setCopying(true);
    try {
      const receiptText = generateReceiptText();
      await navigator.clipboard.writeText(receiptText);
      setTimeout(() => setCopying(false), 2000);
    } catch (err) {
      console.error("Erro ao copiar:", err);
      setCopying(false);
    }
  };

  // Imprimir cupom usando função utilitária
  const handlePrint = () => {
    const thermalData = convertPDVDataToThermalReceipt(saleData);
    const receiptText = generateThermalReceiptText(thermalData);

    printThermalReceipt(
      receiptText,
      saleData.id,
      () => setPrinting(true),
      () => setPrinting(false)
    );
  };

  // Download como arquivo
  const handleDownload = () => {
    const receiptText = generateReceiptText();
    const blob = new Blob([receiptText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cupom-${saleData.id}-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Nova venda e fechar
  const handleNewSale = () => {
    onNewSale();
    onClose();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("pt-BR"),
      time: date.toLocaleTimeString("pt-BR"),
    };
  };

  const { date, time } = formatDate(saleData.createdAt);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col p-0">
        {/* Header fixo */}
        <div className="flex-shrink-0 bg-white border-b p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Venda Finalizada com Sucesso!
              <Badge variant="secondary" className="ml-2">
                #{saleData.id}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              A venda foi processada e salva no sistema. Você pode imprimir ou enviar o cupom não fiscal.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Conteúdo com scroll */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visualização do Cupom */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Cupom Não Fiscal
              </h3>

              <div
                ref={receiptRef}
                className="bg-white border rounded-lg p-4 font-mono text-sm h-80 overflow-y-auto"
                style={{ fontFamily: 'Courier New, monospace' }}
              >
                <div className="text-center mb-4">
                  <h2 className="font-bold">HP MARCAS PERFUMES</h2>
                  <p className="text-xs mt-1">Av. Presidente Vargas, 633 - Centro</p>
                  <p className="text-xs">Rio de Janeiro/RJ - CEP: 20071-004</p>
                </div>

                <div className="border-t border-dashed border-gray-300 my-3"></div>

                <div className="mb-4 text-xs">
                  <p className="text-center font-bold mb-2">CUPOM NAO FISCAL</p>
                  <div className="flex justify-between">
                    <span>Data: {date}</span>
                    <span>Hora: {time}</span>
                  </div>
                  <p>Venda: {saleData.id}</p>
                  <p>Operador: {saleData.userName || "Sistema"}</p>
                  {saleData.salespersonName && saleData.salespersonName !== "Não informado" && (
                    <p>Vendedor: {saleData.salespersonName}</p>
                  )}
                </div>

                <div className="border-t border-dashed border-gray-300 my-3"></div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs">
                    <span>Cliente:</span>
                    <span>{saleData.customer.name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Tipo:</span>
                    <span>{saleData.customer.type === "wholesale" ? "Atacado" : "Varejo"}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-300 my-3"></div>

                <div className="mb-4">
                  <p className="font-bold text-center mb-2">PRODUTOS</p>
                  <div className="space-y-2">
                    {saleData.items.map((item, index) => {
                      const itemName = item.displayName || item.name;
                      const volumeInfo = item.volume ? ` (${item.volume.size}${item.volume.unit})` : '';

                      return (
                        <div key={item.productId} className="text-xs">
                          <div className="flex justify-between">
                            <span>{String(index + 1).padStart(3, '0')} {itemName}{volumeInfo}</span>
                          </div>
                          <div className="ml-4 text-gray-600">
                            <p>SKU: {item.sku}</p>
                            <div className="flex justify-between">
                              <span>{item.quantity}x {formatCurrency(item.price)}</span>
                              <span>{formatCurrency(item.subtotal)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-300 my-3"></div>

                <div className="mb-4 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(saleData.subtotal)}</span>
                  </div>
                  {saleData.discountAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Desconto ({saleData.discountPercent.toFixed(1)}%):</span>
                      <span>-{formatCurrency(saleData.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold border-t border-gray-300 pt-1">
                    <span>TOTAL:</span>
                    <span>{formatCurrency(saleData.total)}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-300 my-3"></div>

                <div className="mb-4 text-xs">
                  <p>Pagamento: {formatPaymentMethod(saleData.paymentMethod)}</p>
                  {saleData.paymentMethod === "cash" && saleData.amountPaid && (
                    <>
                      <p>Valor Recebido: {formatCurrency(saleData.amountPaid)}</p>
                      <p>Troco: {formatCurrency(saleData.change || 0)}</p>
                    </>
                  )}
                  {saleData.notes && (
                    <p className="mt-2">Obs: {saleData.notes}</p>
                  )}
                </div>

                <div className="border-t border-dashed border-gray-300 my-3"></div>

                <div className="text-center text-xs">
                  <p className="font-bold">OBRIGADO PELA PREFERÊNCIA!</p>
                  <p>Volte sempre!</p>
                  <p className="mt-2">@hpmarcasperfumes</p>
                </div>
              </div>
            </div>

            {/* Resumo e Ações */}
            <div className="space-y-6">
              {/* Resumo da Venda */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    Resumo da Venda
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Total de Itens</p>
                      <p className="font-semibold">{saleData.items.reduce((acc, item) => acc + item.quantity, 0)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Valor Total</p>
                      <p className="font-semibold text-green-600">{formatCurrency(saleData.total)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Cliente</p>
                      <p className="font-semibold">{saleData.customer.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Operador</p>
                      <p className="font-semibold">{saleData.userName || "Sistema"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ações do Cupom */}
              <Card>
                <CardHeader>
                  <CardTitle>Ações do Cupom</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={handlePrint}
                    disabled={printing}
                    className="w-full"
                    variant="default"
                    size="lg"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    {printing ? "Preparando Impressão..." : "Imprimir Cupom"}
                  </Button>

                  <Button
                    onClick={handleCopy}
                    disabled={copying}
                    className="w-full"
                    variant="outline"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {copying ? "Copiado!" : "Copiar Texto"}
                  </Button>

                  <Button
                    onClick={handleDownload}
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download TXT
                  </Button>
                </CardContent>
              </Card>

              {/* Nova Venda */}
              <Card>
                <CardHeader>
                  <CardTitle>Próximos Passos</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleNewSale}
                    className="w-full h-12"
                    size="lg"
                  >
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    Nova Venda
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
