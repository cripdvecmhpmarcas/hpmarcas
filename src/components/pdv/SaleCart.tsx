// src/components/pdv/SaleCart.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Calculator,
  DollarSign,
  CreditCard,
  CheckCircle,
  Receipt,
  ArrowRightLeft,
  Scan,
  AlertCircle,
  Settings,
} from "lucide-react";
import { formatCurrency } from "@/lib/pdv-utils";
import type { SaleCartProps } from "@/types/pdv";

export const SaleCart: React.FC<SaleCartProps> = ({
  items,
  subtotal,
  discountPercent,
  discountAmount,
  total,
  paymentMethod,
  notes,
  loading,
  showDataRecoveredBanner = false,
  onUpdateQuantity,
  onRemoveItem,
  onApplyDiscount,
  onApplyItemDiscount,
  onRemoveItemDiscount,
  onApplyManualPriceAdjustment,
  onRemoveManualPriceAdjustment,
  onSetPaymentMethod,
  onSetNotes,
  onOpenPaymentModal,
  onClearSale,
}) => {
  // Estados locais
  const [discountInput, setDiscountInput] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "amount">(
    "percent"
  );
  const [editingQuantity, setEditingQuantity] = useState<string | null>(null);
  const [tempQuantity, setTempQuantity] = useState("");
  const [stockValidationErrors, setStockValidationErrors] = useState<
    Record<string, string>
  >({});

  // Estados para desconto individual
  const [editingItemDiscount, setEditingItemDiscount] = useState<string | null>(
    null
  );
  const [itemDiscountInput, setItemDiscountInput] = useState("");
  const [itemDiscountType, setItemDiscountType] = useState<
    "percent" | "amount"
  >("percent");

  // Estados para ajuste manual de preços
  const [editingPriceAdjustment, setEditingPriceAdjustment] = useState<string | null>(
    null
  );
  const [priceAdjustmentInput, setPriceAdjustmentInput] = useState("");

  // Aplicar desconto
  const handleApplyDiscount = () => {
    const value = parseFloat(discountInput);
    if (!isNaN(value) && value >= 0) {
      onApplyDiscount(discountType, value);
      setDiscountInput("");
    }
  };

  // Editar quantidade inline com validação de estoque
  const startEditingQuantity = (productId: string, currentQuantity: number) => {
    setEditingQuantity(productId);
    setTempQuantity(currentQuantity.toString());
    // Limpar erro anterior
    setStockValidationErrors((prev) => ({ ...prev, [productId]: "" }));
  };

  const finishEditingQuantity = async () => {
    if (editingQuantity) {
      const newQuantity = parseInt(tempQuantity);
      const currentItem = items.find(
        (item) => item.productId === editingQuantity
      );

      if (isNaN(newQuantity) || newQuantity < 1) {
        setStockValidationErrors((prev) => ({
          ...prev,
          [editingQuantity]: "Quantidade deve ser maior que 0",
        }));
        return;
      }

      if (
        currentItem?.availableStock &&
        newQuantity > currentItem.availableStock
      ) {
        setStockValidationErrors((prev) => ({
          ...prev,
          [editingQuantity]: `Estoque disponível: ${currentItem.availableStock} unidades`,
        }));
        return;
      }

      // Atualizar quantidade se passou na validação
      await onUpdateQuantity(editingQuantity, newQuantity);
      setEditingQuantity(null);
      setTempQuantity("");
      setStockValidationErrors((prev) => ({ ...prev, [editingQuantity]: "" }));
    }
  };

  const cancelEditingQuantity = () => {
    if (editingQuantity) {
      setStockValidationErrors((prev) => ({ ...prev, [editingQuantity]: "" }));
    }
    setEditingQuantity(null);
    setTempQuantity("");
  };

  // Funções auxiliares para controle de quantidade
  const handleIncreaseQuantity = async (
    productId: string,
    currentQuantity: number,
    availableStock?: number
  ) => {
    if (availableStock && currentQuantity >= availableStock) {
      setStockValidationErrors((prev) => ({
        ...prev,
        [productId]: `Estoque máximo: ${availableStock} unidades`,
      }));
      // Limpar erro após 3 segundos
      setTimeout(() => {
        setStockValidationErrors((prev) => ({ ...prev, [productId]: "" }));
      }, 3000);
      return;
    }
    await onUpdateQuantity(productId, currentQuantity + 1);
  };

  const handleDecreaseQuantity = async (
    productId: string,
    currentQuantity: number
  ) => {
    if (currentQuantity > 1) {
      await onUpdateQuantity(productId, currentQuantity - 1);
    }
  };

  // Aplicar desconto individual
  const handleApplyItemDiscount = (productId: string) => {
    const value = parseFloat(itemDiscountInput);
    if (!isNaN(value) && value >= 0) {
      onApplyItemDiscount(productId, itemDiscountType, value);
      setItemDiscountInput("");
      setEditingItemDiscount(null);
    }
  };

  // Remover desconto individual
  const handleRemoveItemDiscount = (productId: string) => {
    onRemoveItemDiscount(productId);
  };

  // Iniciar edição de desconto individual
  const startEditingItemDiscount = (productId: string) => {
    setEditingItemDiscount(productId);
    setItemDiscountInput("");
    setItemDiscountType("percent");
  };

  // Cancelar edição de desconto individual
  const cancelEditingItemDiscount = () => {
    setEditingItemDiscount(null);
    setItemDiscountInput("");
  };

  // Aplicar ajuste manual de preço
  const handleApplyPriceAdjustment = (productId: string) => {
    const adjustmentAmount = parseFloat(priceAdjustmentInput);

    if (!isNaN(adjustmentAmount) && adjustmentAmount > 0) {
      onApplyManualPriceAdjustment(productId, adjustmentAmount);
      setEditingPriceAdjustment(null);
      setPriceAdjustmentInput("");
    }
  };

  // Remover ajuste manual de preço
  const handleRemovePriceAdjustment = (productId: string) => {
    onRemoveManualPriceAdjustment(productId);
  };

  // Iniciar edição de ajuste manual de preço
  const startEditingPriceAdjustment = (productId: string) => {
    setEditingPriceAdjustment(productId);
    setPriceAdjustmentInput("");
  };

  // Cancelar edição de ajuste manual de preço
  const cancelEditingPriceAdjustment = () => {
    setEditingPriceAdjustment(null);
    setPriceAdjustmentInput("");
  };

  // Métodos de pagamento disponíveis
  const paymentMethods = [
    {
      value: "cash",
      label: "Dinheiro",
      icon: DollarSign,
      color: "bg-green-500",
    },
    {
      value: "credit",
      label: "Cartão Crédito",
      icon: CreditCard,
      color: "bg-blue-500",
    },
    {
      value: "debit",
      label: "Cartão Débito",
      icon: CreditCard,
      color: "bg-purple-500",
    },
    { value: "pix", label: "PIX", icon: CheckCircle, color: "bg-teal-500" },
    {
      value: "transfer",
      label: "Transferência",
      icon: ArrowRightLeft,
      color: "bg-indigo-500",
    },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header do Carrinho */}
      <div className="bg-white p-4 border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Carrinho de Venda
              </h3>
              {items.length > 0 && (
                <p className="text-sm text-gray-500">
                  {items.reduce((total, item) => total + item.quantity, 0)}{" "}
                  itens • {items.length} produtos
                </p>
              )}
            </div>
          </div>

          {items.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Limpar carrinho?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação removerá todos os produtos do carrinho de venda.
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onClearSale}>
                    Limpar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Banner de Dados Recuperados */}
      {showDataRecoveredBanner && items.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 p-3">
          <div className="flex items-center gap-2 text-blue-800">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">
              Carrinho recuperado! Os itens anteriores foram restaurados
              automaticamente.
            </span>
          </div>
        </div>
      )}

      {/* Conteúdo do Carrinho - Nova estrutura com scroll otimizado */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {items.length === 0 ? (
          // Carrinho vazio - ocupa todo o espaço disponível
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8">
            <div className="p-6 bg-gray-100 rounded-full mb-6">
              <ShoppingCart className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-700">
              Carrinho vazio
            </h3>
            <p className="text-center text-gray-600 leading-relaxed max-w-sm">
              Escaneie o código de barras dos produtos ou use a busca manual
              para adicionar itens à venda
            </p>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 text-center flex items-center justify-center gap-1">
                <Scan className="w-4 h-4" />
                <strong>Dica:</strong> Use o leitor de código de barras para
                agilizar o processo
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Área de scroll apenas para a lista de produtos */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-3">
                {items.map((item, index) => (
                  <div
                    key={item.productId}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Informações do Produto */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <span className="text-sm font-bold text-gray-600">
                              #{index + 1}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {item.displayName || item.name}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                              SKU: {item.sku}
                              {item.volume && (
                                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                  {item.volume.size}
                                  {item.volume.unit}
                                </span>
                              )}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-lg font-bold text-green-600">
                                {formatCurrency(item.price)}
                              </span>
                              <span className="text-sm text-gray-500">
                                por unidade
                              </span>
                            </div>
                            {/* Indicador de estoque */}
                            {item.availableStock !== undefined && (
                              <div
                                className={`text-xs mt-2 flex items-center gap-1 ${item.availableStock <= 5
                                    ? "text-red-600"
                                    : item.availableStock <= 10
                                      ? "text-orange-600"
                                      : "text-gray-600"
                                  }`}
                              >
                                <AlertCircle className="w-3 h-3" />
                                Estoque: {item.availableStock} unidades
                              </div>
                            )}
                            {/* Erro de validação */}
                            {stockValidationErrors[item.productId] && (
                              <div className="text-xs text-red-600 mt-1 flex items-center gap-1 bg-red-50 p-2 rounded border border-red-200">
                                <AlertCircle className="w-3 h-3" />
                                {stockValidationErrors[item.productId]}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Controles e Total */}
                      <div className="flex flex-col items-end gap-3">
                        {/* Subtotal do Item */}
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Subtotal</p>
                          <p className="text-xl font-bold text-gray-900">
                            {formatCurrency(item.subtotal)}
                          </p>
                        </div>

                        {/* Controles de Quantidade */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleDecreaseQuantity(
                                item.productId,
                                item.quantity
                              )
                            }
                            disabled={loading || item.quantity <= 1}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>

                          {editingQuantity === item.productId ? (
                            <div className="relative">
                              <Input
                                value={tempQuantity}
                                onChange={(e) =>
                                  setTempQuantity(e.target.value)
                                }
                                onBlur={finishEditingQuantity}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    finishEditingQuantity();
                                  if (e.key === "Escape")
                                    cancelEditingQuantity();
                                }}
                                className="w-16 h-8 text-center text-sm"
                                autoFocus
                                type="number"
                                min="1"
                                max={item.availableStock}
                              />
                              {item.availableStock && (
                                <div className="absolute -bottom-5 left-0 text-xs text-gray-500 whitespace-nowrap">
                                  Máx: {item.availableStock}
                                </div>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() =>
                                startEditingQuantity(
                                  item.productId,
                                  item.quantity
                                )
                              }
                              className="w-16 h-8 text-center text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors font-medium"
                              title="Clique para editar a quantidade"
                            >
                              {item.quantity}
                            </button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleIncreaseQuantity(
                                item.productId,
                                item.quantity,
                                item.availableStock
                              )
                            }
                            disabled={
                              loading ||
                              (item.availableStock !== undefined &&
                                item.quantity >= item.availableStock)
                            }
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveItem(item.productId)}
                            disabled={loading}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Seção de Desconto Individual */}
                    <div className="mt-4 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calculator className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-semibold text-gray-900">
                            Desconto Individual
                          </span>
                        </div>

                        {/* Botão para remover desconto */}
                        {item.itemDiscountAmount &&
                          item.itemDiscountAmount > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleRemoveItemDiscount(item.productId)
                              }
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              Remover Desconto
                            </Button>
                          )}
                      </div>

                      {/* Edição de Desconto Individual */}
                      {editingItemDiscount === item.productId ? (
                        <div className="flex gap-3 mt-2">
                          <Select
                            value={itemDiscountType}
                            onValueChange={(value: "percent" | "amount") =>
                              setItemDiscountType(value)
                            }
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percent">%</SelectItem>
                              <SelectItem value="amount">R$</SelectItem>
                            </SelectContent>
                          </Select>

                          <Input
                            type="number"
                            value={itemDiscountInput}
                            onChange={(e) =>
                              setItemDiscountInput(e.target.value)
                            }
                            placeholder={
                              itemDiscountType === "percent"
                                ? "Ex: 10"
                                : "Ex: 50,00"
                            }
                            className="flex-1"
                            min="0"
                            step={
                              itemDiscountType === "percent" ? "0.1" : "0.01"
                            }
                          />

                          <Button
                            onClick={() =>
                              handleApplyItemDiscount(item.productId)
                            }
                            disabled={!itemDiscountInput || loading}
                            className="px-6"
                          >
                            Aplicar
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={cancelEditingItemDiscount}
                            className="text-gray-600 border-gray-300 hover:bg-gray-50"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-2">
                          {item.itemDiscountAmount &&
                            item.itemDiscountAmount > 0 ? (
                            <div className="text-sm text-green-600">
                              Desconto aplicado:{" "}
                              {item.itemDiscountPercent &&
                                item.itemDiscountPercent > 0
                                ? `${item.itemDiscountPercent.toFixed(1)}%`
                                : formatCurrency(item.itemDiscountAmount)}
                            </div>
                          ) : (
                            <Button
                              onClick={() =>
                                startEditingItemDiscount(item.productId)
                              }
                              className="w-full mt-2"
                              variant="outline"
                              size="sm"
                            >
                              Adicionar Desconto
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Seção de Ajuste Manual de Preço */}
                    <div className="mt-4 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-semibold text-gray-900">
                            Ajuste Manual de Preço
                          </span>
                        </div>

                        {/* Botão para remover ajuste de preço */}
                        {item.manualPriceAdjustment &&
                          item.manualPriceAdjustment > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleRemovePriceAdjustment(item.productId)
                              }
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              Remover Ajuste
                            </Button>
                          )}
                      </div>

                      {/* Edição de Ajuste de Preço */}
                      {editingPriceAdjustment === item.productId ? (
                        <div className="flex gap-3 mt-2">
                          <Input
                            type="number"
                            value={priceAdjustmentInput}
                            onChange={(e) =>
                              setPriceAdjustmentInput(e.target.value)
                            }
                            placeholder="Ex: 10,00"
                            className="flex-1"
                            min="0"
                            step="0.01"
                          />

                          <Button
                            onClick={() =>
                              handleApplyPriceAdjustment(item.productId)
                            }
                            disabled={!priceAdjustmentInput || loading}
                            className="px-6"
                          >
                            Aplicar
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={cancelEditingPriceAdjustment}
                            className="text-gray-600 border-gray-300 hover:bg-gray-50"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-2">
                          {item.manualPriceAdjustment &&
                            item.manualPriceAdjustment > 0 ? (
                            <div className="text-sm text-orange-600">
                              Ajuste aplicado: +{formatCurrency(item.manualPriceAdjustment)}
                            </div>
                          ) : (
                            <Button
                              onClick={() =>
                                startEditingPriceAdjustment(item.productId)
                              }
                              className="w-full mt-2"
                              variant="outline"
                              size="sm"
                            >
                              Adicionar Ajuste de Preço
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer fixo com controles essenciais - SEMPRE VISÍVEL */}
            <div className="bg-white border-t border-gray-200 p-4 space-y-4 flex-shrink-0 shadow-lg">
              {/* Sistema de Desconto */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  <Label className="text-sm font-semibold text-gray-900">
                    Aplicar Desconto
                  </Label>
                </div>

                <div className="flex gap-3">
                  <Select
                    value={discountType}
                    onValueChange={(value: "percent" | "amount") =>
                      setDiscountType(value)
                    }
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">%</SelectItem>
                      <SelectItem value="amount">R$</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    placeholder={
                      discountType === "percent" ? "Ex: 10" : "Ex: 50,00"
                    }
                    className="flex-1"
                    min="0"
                    step={discountType === "percent" ? "0.1" : "0.01"}
                  />

                  <Button
                    onClick={handleApplyDiscount}
                    disabled={!discountInput || loading}
                    className="px-6"
                  >
                    Aplicar
                  </Button>
                </div>
              </div>

              {/* Resumo Financeiro */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto ({discountPercent.toFixed(1)}%):</span>
                    <span className="font-medium">
                      -{formatCurrency(discountAmount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-xl font-bold border-t pt-3 text-gray-900">
                  <span>Total:</span>
                  <span className="text-green-600">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              {/* Método de Pagamento */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-900">
                  Método de Pagamento
                </Label>

                <div className="grid grid-cols-3 lg:grid-cols-5 gap-2">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    const isSelected = paymentMethod === method.value;
                    return (
                      <Button
                        key={method.value}
                        variant={isSelected ? "default" : "outline"}
                        onClick={() =>
                          onSetPaymentMethod(
                            method.value as
                            | "cash"
                            | "credit"
                            | "debit"
                            | "pix"
                            | "transfer"
                          )
                        }
                        className={`h-16 flex flex-col gap-1 text-xs transition-all ${isSelected
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "hover:bg-gray-50"
                          }`}
                        disabled={loading}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{method.label}</span>
                      </Button>
                    );
                  })}
                </div>

                {paymentMethod && (
                  <div className="text-sm text-green-600 bg-green-50 p-2 rounded border border-green-200">
                    ✓ Método selecionado:{" "}
                    <strong>
                      {
                        paymentMethods.find((m) => m.value === paymentMethod)
                          ?.label
                      }
                    </strong>
                  </div>
                )}
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label
                  htmlFor="sale-notes"
                  className="text-sm font-semibold text-gray-900"
                >
                  Observações
                </Label>
                <Input
                  id="sale-notes"
                  value={notes}
                  onChange={(e) => onSetNotes(e.target.value)}
                  placeholder="Observações sobre a venda..."
                  className="bg-white"
                />
              </div>

              {/* Botão Finalizar */}
              <Button
                onClick={() => onOpenPaymentModal()}
                disabled={items.length === 0 || !paymentMethod || loading}
                className="w-full h-14 text-lg font-semibold bg-green-600 hover:bg-green-700 transition-colors disabled:bg-gray-400"
                size="lg"
              >
                <Receipt className="w-6 h-6 mr-3" />
                {loading ? (
                  "Validando estoque..."
                ) : (
                  <>
                    Finalizar Venda
                    <span className="ml-2 bg-green-500 px-3 py-1 rounded-full text-sm">
                      {formatCurrency(total)}
                    </span>
                  </>
                )}
              </Button>

              {/* Aviso sobre validação de estoque */}
              <div className="text-xs text-center text-gray-500 bg-yellow-50 p-2 rounded border border-yellow-200 flex items-center justify-center gap-1">
                <AlertCircle className="w-4 h-4 text-yellow-500" />O estoque
                será validado antes da finalização da venda
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
