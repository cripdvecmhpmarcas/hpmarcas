// Funcionalidades:
// - Formas de pagamento(cash, cartão, PIX)
//   - Cálculo de troco(se dinheiro)
//     - Confirmar venda
//       - Salvar no banco de dados
// src/components/pdv/PaymentModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DollarSign,
  CreditCard,
  Smartphone,
  ArrowRightLeft,
  Receipt,
  AlertCircle,
  Check,
} from "lucide-react";
import { generateCashSuggestions, formatCurrency } from "@/lib/pdv-utils";
import type { PaymentModalProps, PaymentMethod } from "@/types/pdv";

export const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  onClose,
  items,
  customer,
  subtotal,
  discountPercent,
  discountAmount,
  total,
  notes,
  initialPaymentMethod,
  onConfirmSale,
}) => {
  // Estados
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(initialPaymentMethod || "cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [change, setChange] = useState(0);
  const [saleNotes, setSaleNotes] = useState(notes);
  const [salespersonName, setSalespersonName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Métodos de pagamento disponíveis
  const paymentMethods = [
    {
      id: "cash" as PaymentMethod,
      name: "Dinheiro",
      icon: DollarSign,
      color: "bg-green-500",
      description: "Pagamento em espécie",
      needsAmount: true,
    },
    {
      id: "credit" as PaymentMethod,
      name: "Cartão Crédito",
      icon: CreditCard,
      color: "bg-blue-500",
      description: "Cartão de crédito",
      needsAmount: false,
    },
    {
      id: "debit" as PaymentMethod,
      name: "Cartão Débito",
      icon: CreditCard,
      color: "bg-purple-500",
      description: "Cartão de débito",
      needsAmount: false,
    },
    {
      id: "pix" as PaymentMethod,
      name: "PIX",
      icon: Smartphone,
      color: "bg-teal-500",
      description: "Transferência instantânea",
      needsAmount: false,
    },
    {
      id: "transfer" as PaymentMethod,
      name: "Transferência",
      icon: ArrowRightLeft,
      color: "bg-indigo-500",
      description: "TED/DOC",
      needsAmount: false,
    },
  ];

  // Calcular troco quando valor pago muda
  useEffect(() => {
    if (selectedMethod === "cash" && amountPaid) {
      const paid = parseFloat(amountPaid);
      if (!isNaN(paid)) {
        const calculatedChange = paid - total;
        setChange(calculatedChange);
      } else {
        setChange(0);
      }
    } else {
      setChange(0);
    }
  }, [amountPaid, total, selectedMethod]);

  // Reset estados quando modal abre
  useEffect(() => {
    if (open) {
      setSelectedMethod(initialPaymentMethod || "cash");
      setAmountPaid(total.toFixed(2));
      setSaleNotes(notes);
      setSalespersonName("");
      setError(null);
      setLoading(false);
    }
  }, [open, total, notes, initialPaymentMethod]);

  // Confirmar venda
  const handleConfirmSale = async () => {
    setError(null);

    // Validações
    if (!salespersonName.trim()) {
      setError("Nome do vendedor é obrigatório");
      return;
    }

    if (selectedMethod === "cash") {
      const paid = parseFloat(amountPaid);
      if (isNaN(paid) || paid < total) {
        setError("Valor pago deve ser maior ou igual ao total da venda");
        return;
      }
    }

    setLoading(true);

    try {
      const paymentData = {
        method: selectedMethod,
        amountPaid: selectedMethod === "cash" ? parseFloat(amountPaid) : total,
        change: selectedMethod === "cash" ? change : 0,
        notes: saleNotes.trim() || undefined,
        salespersonName: salespersonName.trim(),
      };

      const result = await onConfirmSale(paymentData);

      if (result.success) {
        // Modal será fechado pelo componente pai
        return;
      } else {
        setError(result.error || "Erro ao processar venda");
      }
    } catch (err) {
      console.error("Erro ao confirmar venda:", err);
      setError("Erro inesperado ao processar venda");
    } finally {
      setLoading(false);
    }
  };

  // Sugestões de valores para dinheiro
  const cashSuggestions = generateCashSuggestions(total);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0">
        {/* Header fixo */}
        <div className="sticky top-0 bg-white border-b p-4 md:p-6 z-10">
          <DialogHeader>
            <DialogTitle className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <span className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-green-600" />
                Finalizar Venda
              </span>
              <Badge
                variant="secondary"
                className="ml-0 md:ml-2 text-lg md:text-xl px-3 py-2 font-bold whitespace-nowrap"
                style={{ minWidth: 120, justifyContent: "center" }}
              >
                {formatCurrency(total)}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Escolha a forma de pagamento e confirme os dados da venda
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Conteúdo com scroll */}
        <div className="p-4 md:p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Resumo da Venda ocupa toda a largura em mobile e 1/3 em desktop */}
            <div className="w-full md:w-1/3">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
                <h3 className="font-semibold text-gray-900">Resumo da Venda</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Cliente:</span>
                    <span className="font-medium break-all text-right">{customer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Itens:</span>
                    <span>{items.reduce((total, item) => total + item.quantity, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto ({discountPercent.toFixed(1)}%):</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="text-green-600 break-all text-right">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulário de Pagamento ocupa toda a largura em mobile e 2/3 em desktop */}
            <div className="w-full md:w-2/3 space-y-4">
              <h3 className="font-semibold text-gray-900">Forma de Pagamento</h3>

              {/* Seletor simples de forma de pagamento */}
              <div className="flex flex-wrap gap-3">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded border cursor-pointer transition-all
                      ${selectedMethod === method.id
                        ? "border-blue-500 bg-blue-50 font-semibold"
                        : "border-gray-200 bg-white hover:border-gray-300"}
                    `}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      value={method.id}
                      checked={selectedMethod === method.id}
                      onChange={() => setSelectedMethod(method.id)}
                      className="accent-blue-600"
                    />
                    <span className="flex items-center gap-1">
                      <span className={`p-1 rounded-full ${method.color} text-white`}>
                        <method.icon className="w-4 h-4" />
                      </span>
                      {method.name}
                    </span>
                  </label>
                ))}
              </div>

              {/* Campos específicos para dinheiro */}
              {selectedMethod === "cash" && (
                <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800">Pagamento em Dinheiro</h4>
                  <div>
                    <Label htmlFor="amount-paid">Valor Recebido</Label>
                    <Input
                      id="amount-paid"
                      type="number"
                      step="0.01"
                      min={total}
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      placeholder="0,00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Sugestões de Valores</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {cashSuggestions.map((suggestion) => (
                        <Button
                          key={suggestion}
                          variant="outline"
                          size="sm"
                          onClick={() => setAmountPaid(suggestion.toFixed(2))}
                          className="text-xs"
                        >
                          {formatCurrency(suggestion)}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className={`p-3 rounded border ${change >= 0 ? "bg-green-100 border-green-300" : "bg-red-100 border-red-300"}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Troco:</span>
                      <span className={`text-lg font-bold ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(Math.abs(change))}
                      </span>
                    </div>
                    {change < 0 && (
                      <div className="text-sm text-red-600 mt-1">
                        Valor insuficiente! Faltam {formatCurrency(Math.abs(change))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Nome do Vendedor */}
              <div>
                <Label htmlFor="salesperson-name" className="flex items-center gap-2">
                  <span>Nome do Vendedor</span>
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="salesperson-name"
                  type="text"
                  value={salespersonName}
                  onChange={(e) => setSalespersonName(e.target.value)}
                  placeholder="Digite o nome de quem está realizando a venda..."
                  className="mt-1"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este nome aparecerá no comprovante da venda
                </p>
              </div>

              {/* Observações */}
              <div>
                <Label htmlFor="sale-notes">Observações da Venda</Label>
                <Textarea
                  id="sale-notes"
                  value={saleNotes}
                  onChange={(e) => setSaleNotes(e.target.value)}
                  placeholder="Observações sobre a venda..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer fixo com botões */}
        <div className="sticky bottom-0 bg-white border-t p-6 z-10">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>

            <Button
              onClick={handleConfirmSale}
              disabled={
                loading ||
                !salespersonName.trim() ||
                (selectedMethod === "cash" && (change < 0 || !amountPaid))
              }
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                "Processando..."
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Confirmar Venda
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
