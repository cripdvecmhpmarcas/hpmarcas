// Funcionalidades:
// - Gerenciar carrinho de venda
// - Buscar produtos por código de barras
// - Calcular totais e descontos
// - Finalizar venda (salvar no banco)
// - Controlar estado da venda
// src/hooks/usePDV.ts
"use client";

import { useState, useCallback, useEffect } from "react";
import { useSupabaseAdmin } from "@/hooks/useSupabaseAdmin";
import { useAdminAuthContext } from "@/components/auth/admin/AdminAuthProvider";
import {
  roundToTwoDecimals,
  safeAdd,
  safeSubtract,
  safeMultiply,
  calculatePercentage,
} from "@/lib/pdv-utils";
import type {
  Product,
  PDVSaleData,
  PDVSaleItem,
  PDVCustomer,
  PaymentMethod,
  SaleInsertData,
  SaleItemInsertData,
  PDVCartPersistData,
} from "@/types/pdv";
import type { ProductVolume } from "@/types/products";

export const usePDV = () => {
  const { user, profile } = useAdminAuthContext();

  // Cliente Supabase
  const supabase = useSupabaseAdmin();

  // Chave para o localStorage
  const PDV_CART_KEY = "pdv-cart-data";

  // Cliente padrão do sistema (será buscado uma vez e reutilizado)
  const [defaultCustomer, setDefaultCustomer] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Função para carregar dados do localStorage
  const loadCartFromStorage = useCallback((): PDVCartPersistData | null => {
    try {
      if (typeof window === "undefined") return null;

      const savedData = localStorage.getItem(PDV_CART_KEY);
      if (!savedData) return null;

      const parsedData = JSON.parse(savedData);

      // Validar se os dados são válidos
      if (
        parsedData &&
        typeof parsedData === "object" &&
        Array.isArray(parsedData.items)
      ) {
        return parsedData as PDVCartPersistData;
      }

      return null;
    } catch (error) {
      console.error("Erro ao carregar carrinho do localStorage:", error);
      // Limpar dados corrompidos
      if (typeof window !== "undefined") {
        localStorage.removeItem(PDV_CART_KEY);
      }
      return null;
    }
  }, [PDV_CART_KEY]);

  // Função para salvar dados no localStorage
  const saveCartToStorage = useCallback(
    (data: PDVSaleData) => {
      try {
        if (typeof window === "undefined") return;

        // Salvar apenas se há itens no carrinho ou há configurações importantes
        if (
          data.items.length > 0 ||
          data.discountAmount > 0 ||
          data.notes.trim()
        ) {
          const persistData: PDVCartPersistData = {
            items: data.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              volume: item.volume,
              itemDiscountPercent: item.itemDiscountPercent,
              itemDiscountAmount: item.itemDiscountAmount,
              manualPriceAdjustment: item.manualPriceAdjustment,
            })),
            discountPercent: data.discountPercent,
            discountAmount: data.discountAmount,
            notes: data.notes,
            paymentMethod: data.paymentMethod,
          };
          localStorage.setItem(PDV_CART_KEY, JSON.stringify(persistData));
        } else {
          // Limpar localStorage se carrinho está vazio
          localStorage.removeItem(PDV_CART_KEY);
        }
      } catch (error) {
        console.error("Erro ao salvar carrinho no localStorage:", error);
      }
    },
    [PDV_CART_KEY]
  );

  // Função para restaurar carrinho do localStorage buscando dados atualizados do banco
  const restoreCartFromStorage =
    useCallback(async (): Promise<PDVSaleData | null> => {
      const persistedData = loadCartFromStorage();
      if (!persistedData || persistedData.items.length === 0) {
        return null;
      }

      try {
        // Buscar dados atualizados de todos os produtos
        const productIds = persistedData.items.map((item) => item.productId);

        const { data: products, error } = await supabase
          .from("products")
          .select("id, name, sku, retail_price, stock, status")
          .in("id", productIds);

        if (error) {
          console.error(
            "Erro ao buscar produtos para restaurar carrinho:",
            error
          );
          return null;
        }

        // Mapear produtos com quantidades e validar disponibilidade
        const validItems: PDVSaleItem[] = [];
        for (const persistItem of persistedData.items) {
          const product = products?.find((p) => p.id === persistItem.productId);

          if (product && product.status === "active" && product.stock > 0) {
            // Ajustar quantidade se necessário (não pode exceder estoque)
            const quantity = Math.min(persistItem.quantity, product.stock);

            // Aplicar ajuste manual de preço se existir
            let adjustedPrice = product.retail_price;
            let priceAdjustmentPerUnit = 0;

            if (persistItem.manualPriceAdjustment && persistItem.manualPriceAdjustment > 0) {
              // O ajuste manual é aplicado ao total do item, então dividimos pela quantidade
              priceAdjustmentPerUnit = persistItem.manualPriceAdjustment / quantity;
              adjustedPrice = product.retail_price + priceAdjustmentPerUnit;
            }

            // Recalcular subtotal com preço ajustado
            const adjustedSubtotal = roundToTwoDecimals(
              safeMultiply(adjustedPrice, quantity)
            );

            // Aplicar desconto individual se existir (sobre o preço já ajustado)
            let itemSubtotal = adjustedSubtotal;
            let itemDiscountAmount = 0;

            if (
              persistItem.itemDiscountPercent &&
              persistItem.itemDiscountPercent > 0
            ) {
              itemDiscountAmount = roundToTwoDecimals(
                safeMultiply(
                  adjustedSubtotal,
                  persistItem.itemDiscountPercent / 100
                )
              );
              itemSubtotal = safeSubtract(adjustedSubtotal, itemDiscountAmount);
            } else if (
              persistItem.itemDiscountAmount &&
              persistItem.itemDiscountAmount > 0
            ) {
              itemDiscountAmount = Math.min(
                persistItem.itemDiscountAmount,
                adjustedSubtotal
              );
              itemSubtotal = safeSubtract(adjustedSubtotal, itemDiscountAmount);
            }

            validItems.push({
              productId: product.id,
              name: product.name,
              sku: product.sku,
              price: adjustedPrice, // Usar preço ajustado
              quantity: quantity,
              subtotal: itemSubtotal,
              availableStock: product.stock,
              volume: persistItem.volume,
              itemDiscountPercent: persistItem.itemDiscountPercent,
              itemDiscountAmount:
                itemDiscountAmount > 0 ? itemDiscountAmount : undefined,
              originalSubtotal:
                itemDiscountAmount > 0 ? adjustedSubtotal : undefined,
              manualPriceAdjustment: persistItem.manualPriceAdjustment,
              originalPrice: persistItem.manualPriceAdjustment ? product.retail_price : undefined,
            });
          }
        }

        // Se não há itens válidos, retornar null
        if (validItems.length === 0) {
          return null;
        }

        // Calcular subtotal
        const subtotal = roundToTwoDecimals(
          validItems.reduce((sum, item) => safeAdd(sum, item.subtotal), 0)
        );

        // Calcular total com desconto
        let total = subtotal;
        if (persistedData.discountPercent > 0) {
          const discountAmount = roundToTwoDecimals(
            calculatePercentage(subtotal, persistedData.discountPercent)
          );
          total = Math.max(0, safeSubtract(subtotal, discountAmount));
        } else if (persistedData.discountAmount > 0) {
          total = Math.max(
            0,
            safeSubtract(subtotal, persistedData.discountAmount)
          );
        }

        return {
          items: validItems,
          customer: {
            id: "",
            name: "Cliente Balcão",
            type: "retail",
            discount: 0,
          },
          subtotal,
          discountPercent: persistedData.discountPercent,
          discountAmount: persistedData.discountAmount,
          total,
          paymentMethod: persistedData.paymentMethod,
          notes: persistedData.notes,
        };
      } catch (error) {
        console.error("Erro ao restaurar carrinho:", error);
        return null;
      }
    }, [loadCartFromStorage, supabase]);

  // Estado para rastrear se dados foram carregados do localStorage na inicialização
  const [dataWasRecovered, setDataWasRecovered] = useState(false);
  const [cartRestoreAttempted, setCartRestoreAttempted] = useState(false);

  // Estados do PDV - inicializar vazio, carregar do localStorage via useEffect
  const [saleData, setSaleData] = useState<PDVSaleData>({
    items: [],
    customer: {
      id: "",
      name: "Cliente Balcão",
      type: "retail",
      discount: 0,
    },
    subtotal: 0,
    discountPercent: 0,
    discountAmount: 0,
    total: 0,
    paymentMethod: null,
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar ou criar cliente padrão do sistema (apenas uma vez)
  const initializeDefaultCustomer = useCallback(async () => {
    if (defaultCustomer) return defaultCustomer;

    try {
      // Buscar cliente padrão "Cliente Balcão"
      const { data: existingCustomer, error: findError } = await supabase
        .from("customers")
        .select("id, name")
        .eq("name", "Cliente Balcão")
        .eq("type", "retail")
        .eq("is_anonymous", true)
        .maybeSingle();

      if (findError && findError.code !== "PGRST116") {
        console.error("Erro ao buscar cliente padrão:", findError);
        throw new Error("Erro ao buscar cliente padrão");
      }

      if (existingCustomer) {
        setDefaultCustomer(existingCustomer);
        return existingCustomer;
      }

      // Cliente padrão não existe, criar apenas uma vez
      const { data: newCustomer, error: createError } = await supabase
        .from("customers")
        .insert({
          name: "Cliente Balcão",
          type: "retail",
          discount: 0,
          status: "active",
          is_anonymous: true,
          notes: "Cliente padrão do sistema para vendas no balcão",
        })
        .select("id, name")
        .single();

      if (createError) {
        console.error("Erro ao criar cliente padrão:", createError);
        throw new Error("Erro ao criar cliente padrão");
      }

      setDefaultCustomer(newCustomer);
      return newCustomer;
    } catch (err) {
      console.error("Erro ao inicializar cliente padrão:", err);
      throw err;
    }
  }, [defaultCustomer, supabase]);

  // Inicializar cliente padrão quando o hook é carregado
  useEffect(() => {
    if (user && profile && !defaultCustomer) {
      initializeDefaultCustomer().catch((err) => {
        console.error("Erro ao inicializar cliente padrão:", err);
        setError("Erro ao inicializar cliente padrão");
      });
    }
  }, [user, profile, defaultCustomer, initializeDefaultCustomer]);

  // Restaurar carrinho do localStorage uma vez na inicialização
  useEffect(() => {
    if (!cartRestoreAttempted && user && profile) {
      setCartRestoreAttempted(true);

      const attemptRestore = async () => {
        try {
          const restoredData = await restoreCartFromStorage();
          if (restoredData) {
            setSaleData(restoredData);
            setDataWasRecovered(true);
          }
        } catch (error) {
          console.error("Erro ao restaurar carrinho na inicialização:", error);
        }
      };

      attemptRestore();
    }
  }, [cartRestoreAttempted, user, profile, restoreCartFromStorage]);

  // Atualizar cliente na venda quando defaultCustomer for carregado
  useEffect(() => {
    if (defaultCustomer && saleData.customer.id === "") {
      setSaleData((prev) => ({
        ...prev,
        customer: {
          ...prev.customer,
          id: defaultCustomer.id,
          name: defaultCustomer.name,
        },
      }));
    }
  }, [defaultCustomer, saleData.customer.id]);

  // Persistir carrinho no localStorage sempre que saleData mudar
  useEffect(() => {
    saveCartToStorage(saleData);
  }, [saleData, saveCartToStorage]);

  // Função para calcular subtotal considerando descontos individuais
  const calculateSubtotalWithItemDiscounts = useCallback(
    (items: PDVSaleItem[]): number => {
      return roundToTwoDecimals(
        items.reduce((sum, item) => safeAdd(sum, item.subtotal), 0)
      );
    },
    []
  );

  // Função para recalcular totais considerando descontos individuais e gerais
  const recalculateTotals = useCallback(
    (
      items: PDVSaleItem[],
      discountPercent: number,
      discountAmount: number
    ): { subtotal: number; total: number } => {
      // Calcular subtotal considerando descontos individuais já aplicados
      const subtotal = calculateSubtotalWithItemDiscounts(items);

      // Aplicar desconto geral sobre o subtotal
      let total = subtotal;
      if (discountPercent > 0) {
        const generalDiscountAmount = roundToTwoDecimals(
          safeMultiply(subtotal, discountPercent / 100)
        );
        total = Math.max(0, safeSubtract(subtotal, generalDiscountAmount));
      } else if (discountAmount > 0) {
        total = Math.max(0, safeSubtract(subtotal, discountAmount));
      }

      return { subtotal, total };
    },
    [calculateSubtotalWithItemDiscounts]
  );

  // Buscar produto por código de barras
  const searchProductByBarcode = useCallback(
    async (barcode: string): Promise<Product | null> => {
      try {
        setError(null);

        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("barcode", barcode.trim())
          .eq("status", "active")
          .single();

        if (error) {
          console.error("Produto não encontrado:", error);
          return null;
        }

        return data as Product;
      } catch (err) {
        console.error("Erro ao buscar produto:", err);
        setError("Erro ao buscar produto");
        return null;
      }
    },
    [supabase]
  );

  // Verificar disponibilidade de estoque
  const checkStockAvailability = useCallback(
    async (
      productId: string,
      requestedQuantity: number
    ): Promise<{ available: boolean; currentStock: number }> => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("stock")
          .eq("id", productId)
          .single();

        if (error || !data) {
          return { available: false, currentStock: 0 };
        }

        return {
          available: data.stock >= requestedQuantity,
          currentStock: data.stock,
        };
      } catch (err) {
        console.error("Erro ao verificar estoque:", err);
        return { available: false, currentStock: 0 };
      }
    },
    [supabase]
  );

  // Adicionar item ao carrinho de venda (com verificação de estoque e suporte a volumes)
  const addItemToSale = useCallback(
    async (
      product: Product,
      quantity: number = 1,
      volume?: ProductVolume
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        // Verificar se o produto está ativo
        if (product.status !== "active") {
          return { success: false, error: "Produto não está ativo" };
        }

        // Criar ID único para o item (produto + volume) - para referência futura
        // const itemKey = volume
        //   ? `${product.id}_${volume.size}${volume.unit}`
        //   : product.id;

        // Calcular quantidade total que seria necessária
        const existingItem = saleData.items.find((item) => {
          if (volume) {
            return (
              item.productId === product.id &&
              item.volume?.size === volume.size &&
              item.volume?.unit === volume.unit
            );
          }
          return item.productId === product.id && !item.volume;
        });

        const totalQuantityNeeded = (existingItem?.quantity || 0) + quantity;

        // Verificar estoque disponível
        const stockCheck = await checkStockAvailability(
          product.id,
          totalQuantityNeeded
        );

        if (!stockCheck.available) {
          return {
            success: false,
            error: `Estoque insuficiente. Disponível: ${stockCheck.currentStock}, Solicitado: ${totalQuantityNeeded}`,
          };
        }

        setSaleData((prev) => {
          const existingItemIndex = prev.items.findIndex((item) => {
            if (volume) {
              return (
                item.productId === product.id &&
                item.volume?.size === volume.size &&
                item.volume?.unit === volume.unit
              );
            }
            return item.productId === product.id && !item.volume;
          });

          const newItems = [...prev.items];

          // Determinar preço baseado no tipo de cliente e volume
          let basePrice =
            prev.customer.type === "wholesale"
              ? product.wholesale_price
              : product.retail_price;

          // Aplicar ajuste de preço do volume
          if (volume && volume.price_adjustment) {
            if (volume.price_adjustment > 100) {
              // Ajuste positivo grande é um multiplicador (ex: 150 = 1.5x o preço)
              basePrice = basePrice * (volume.price_adjustment / 100);
            } else {
              // Ajuste pequeno é um percentual (ex: 10 = +10%)
              basePrice =
                basePrice + (basePrice * volume.price_adjustment) / 100;
            }
          }

          const price = roundToTwoDecimals(basePrice);

          // Criar nome para exibição incluindo volume
          const displayName = volume
            ? `${product.name} - ${volume.size}${volume.unit}`
            : product.name;

          if (existingItemIndex >= 0) {
            // Produto já existe, aumentar quantidade
            const existingItem = newItems[existingItemIndex];
            const newQuantity = existingItem.quantity + quantity;
            const newSubtotal = safeMultiply(price, newQuantity);
            newItems[existingItemIndex] = {
              ...existingItem,
              quantity: newQuantity,
              subtotal: newSubtotal,
              availableStock: stockCheck.currentStock,
            };
          } else {
            // Novo produto
            const subtotal = safeMultiply(price, quantity);
            const newItem: PDVSaleItem = {
              productId: product.id,
              name: product.name,
              sku: product.sku,
              price,
              quantity,
              subtotal: subtotal,
              availableStock: stockCheck.currentStock,
              volume,
              displayName,
            };
            newItems.push(newItem);
          }

          return {
            ...prev,
            items: newItems,
          };
        });

        return { success: true };
      } catch (err) {
        console.error("Erro ao adicionar item:", err);
        return { success: false, error: "Erro ao adicionar produto" };
      }
    },
    [saleData.items, checkStockAvailability]
  );

  // Remover item da venda
  const removeItemFromSale = useCallback((productId: string) => {
    setSaleData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.productId !== productId),
    }));
  }, []);

  // Atualizar quantidade de um item (com verificação de estoque)
  const updateItemQuantity = useCallback(
    async (
      productId: string,
      quantity: number
    ): Promise<{ success: boolean; error?: string }> => {
      if (quantity <= 0) {
        removeItemFromSale(productId);
        return { success: true };
      }

      try {
        // Verificar estoque disponível
        const stockCheck = await checkStockAvailability(productId, quantity);

        if (!stockCheck.available) {
          return {
            success: false,
            error: `Estoque insuficiente. Disponível: ${stockCheck.currentStock}, Solicitado: ${quantity}`,
          };
        }

        setSaleData((prev) => {
          const updatedItems = prev.items.map((item) => {
            if (item.productId === productId) {
              // Calcular novo subtotal original
              const originalSubtotal = roundToTwoDecimals(
                safeMultiply(item.price, quantity)
              );

              let finalSubtotal = originalSubtotal;
              let newItemDiscountAmount = item.itemDiscountAmount;

              // Se há desconto individual, recalcular proporcionalmente
              if (item.itemDiscountPercent && item.itemDiscountPercent > 0) {
                newItemDiscountAmount = roundToTwoDecimals(
                  safeMultiply(originalSubtotal, item.itemDiscountPercent / 100)
                );
                finalSubtotal = safeSubtract(
                  originalSubtotal,
                  newItemDiscountAmount
                );
              } else if (
                item.itemDiscountAmount &&
                item.itemDiscountAmount > 0
              ) {
                // Manter o valor fixo, mas não pode exceder o novo subtotal
                newItemDiscountAmount = Math.min(
                  item.itemDiscountAmount,
                  originalSubtotal
                );
                finalSubtotal = safeSubtract(
                  originalSubtotal,
                  newItemDiscountAmount
                );
              }

              return {
                ...item,
                quantity,
                subtotal: finalSubtotal,
                originalSubtotal: newItemDiscountAmount
                  ? originalSubtotal
                  : undefined,
                itemDiscountAmount: newItemDiscountAmount,
                availableStock: stockCheck.currentStock,
              };
            }
            return item;
          });

          // Recalcular totais
          const { subtotal, total } = recalculateTotals(
            updatedItems,
            prev.discountPercent,
            prev.discountAmount
          );

          return {
            ...prev,
            items: updatedItems,
            subtotal,
            total,
          };
        });

        return { success: true };
      } catch (err) {
        console.error("Erro ao atualizar quantidade:", err);
        return { success: false, error: "Erro ao atualizar quantidade" };
      }
    },
    [removeItemFromSale, checkStockAvailability, recalculateTotals]
  );

  // Atualizar cliente
  const updateCustomer = useCallback(
    async (customer: Partial<PDVCustomer>) => {
      // Se mudou o tipo de cliente, precisamos recalcular preços
      const isTypeChanging =
        customer.type && customer.type !== saleData.customer.type;

      if (!isTypeChanging) {
        // Mudança simples, sem recálculo de preços
        setSaleData((prev) => ({
          ...prev,
          customer: { ...prev.customer, ...customer },
        }));
        return;
      }

      // Buscar produtos atualizados para recalcular preços
      if (saleData.items.length > 0) {
        try {
          const productIds = saleData.items.map((item) => item.productId);

          const { data: products, error } = await supabase
            .from("products")
            .select(
              "id, name, sku, retail_price, wholesale_price, stock, status"
            )
            .in("id", productIds);

          if (error) {
            console.error(
              "Erro ao buscar produtos para recalcular preços:",
              error
            );
            return;
          }

          setSaleData((prev) => {
            const updatedCustomer = { ...prev.customer, ...customer };

            const newItems = prev.items.map((item) => {
              const product = products?.find((p) => p.id === item.productId);
              if (!product) return item;

              // Determinar novo preço baseado no tipo de cliente
              let basePrice =
                updatedCustomer.type === "wholesale"
                  ? product.wholesale_price
                  : product.retail_price;

              // Aplicar ajuste de preço do volume se existir
              if (item.volume && item.volume.price_adjustment) {
                if (item.volume.price_adjustment > 100) {
                  basePrice = basePrice * (item.volume.price_adjustment / 100);
                } else {
                  basePrice =
                    basePrice +
                    (basePrice * item.volume.price_adjustment) / 100;
                }
              }

              const newPrice = roundToTwoDecimals(basePrice);

              // Recalcular subtotal original e com desconto
              const originalSubtotal = roundToTwoDecimals(
                safeMultiply(newPrice, item.quantity)
              );
              let finalSubtotal = originalSubtotal;
              let newItemDiscountAmount = item.itemDiscountAmount;

              // Recalcular desconto individual se existe
              if (item.itemDiscountPercent && item.itemDiscountPercent > 0) {
                newItemDiscountAmount = roundToTwoDecimals(
                  safeMultiply(originalSubtotal, item.itemDiscountPercent / 100)
                );
                finalSubtotal = safeSubtract(
                  originalSubtotal,
                  newItemDiscountAmount
                );
              } else if (
                item.itemDiscountAmount &&
                item.itemDiscountAmount > 0
              ) {
                // Manter valor fixo, mas não pode exceder o novo subtotal
                newItemDiscountAmount = Math.min(
                  item.itemDiscountAmount,
                  originalSubtotal
                );
                finalSubtotal = safeSubtract(
                  originalSubtotal,
                  newItemDiscountAmount
                );
              }

              return {
                ...item,
                price: newPrice,
                subtotal: finalSubtotal,
                originalSubtotal: newItemDiscountAmount
                  ? originalSubtotal
                  : undefined,
                itemDiscountAmount: newItemDiscountAmount,
                availableStock: product.stock,
              };
            });

            // Recalcular totais
            const { subtotal, total } = recalculateTotals(
              newItems,
              prev.discountPercent,
              prev.discountAmount
            );

            return {
              ...prev,
              customer: updatedCustomer,
              items: newItems,
              subtotal,
              total,
            };
          });
        } catch (err) {
          console.error("Erro ao recalcular preços:", err);
        }
      } else {
        // Sem itens no carrinho, apenas atualizar cliente
        setSaleData((prev) => ({
          ...prev,
          customer: { ...prev.customer, ...customer },
        }));
      }
    },
    [saleData.customer.type, saleData.items, recalculateTotals, supabase]
  );

  // Aplicar desconto geral
  const applyDiscount = useCallback(
    (type: "percent" | "amount", value: number) => {
      setSaleData((prev) => {
        // Calcular subtotal considerando descontos individuais já aplicados
        const subtotal = calculateSubtotalWithItemDiscounts(prev.items);

        let discountAmount = 0;
        let discountPercent = 0;

        if (type === "percent") {
          // Garantir que o percentual esteja entre 0 e 100 com 2 casas decimais
          discountPercent = roundToTwoDecimals(
            Math.min(100, Math.max(0, value))
          );
          // Calcular desconto em valor
          discountAmount = safeMultiply(subtotal, discountPercent / 100);
        } else {
          // Garantir que o valor do desconto não seja maior que o subtotal
          discountAmount = roundToTwoDecimals(
            Math.min(subtotal, Math.max(0, value))
          );
          // Calcular percentual correspondente
          discountPercent = calculatePercentage(discountAmount, subtotal);
        }

        // Calcular total final garantindo que não seja negativo
        const total = Math.max(0, safeSubtract(subtotal, discountAmount));

        return {
          ...prev,
          subtotal: subtotal,
          discountPercent: discountPercent,
          discountAmount: discountAmount,
          total: total,
        };
      });
    },
    [calculateSubtotalWithItemDiscounts]
  );

  // Definir método de pagamento
  const setPaymentMethod = useCallback((method: PaymentMethod) => {
    setSaleData((prev) => ({
      ...prev,
      paymentMethod: method,
    }));
  }, []);

  // Adicionar notas
  const setNotes = useCallback((notes: string) => {
    setSaleData((prev) => ({
      ...prev,
      notes,
    }));
  }, []);

  // Limpar venda (novo carrinho) - usa cliente padrão já inicializado
  const clearSale = useCallback(() => {
    const newSaleData: PDVSaleData = {
      items: [],
      customer: defaultCustomer
        ? {
            id: defaultCustomer.id,
            name: defaultCustomer.name,
            type: "retail" as const,
            discount: 0,
          }
        : {
            id: "",
            name: "Cliente Balcão",
            type: "retail" as const,
            discount: 0,
          },
      subtotal: 0,
      discountPercent: 0,
      discountAmount: 0,
      total: 0,
      paymentMethod: null,
      notes: "",
    };

    setSaleData(newSaleData);
    setError(null);
    setDataWasRecovered(false); // Limpar estado de recuperação

    // Limpar localStorage também
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(PDV_CART_KEY);
      }
    } catch (error) {
      console.error("Erro ao limpar localStorage:", error);
    }
  }, [defaultCustomer, PDV_CART_KEY]);

  // Validar estoque antes de finalizar venda
  const validateStockBeforeSale = useCallback(async (): Promise<{
    valid: boolean;
    errors: string[];
  }> => {
    const errors: string[] = [];

    for (const item of saleData.items) {
      const stockCheck = await checkStockAvailability(
        item.productId,
        item.quantity
      );

      if (!stockCheck.available) {
        errors.push(
          `${item.name}: Estoque insuficiente (disponível: ${stockCheck.currentStock}, necessário: ${item.quantity})`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }, [saleData.items, checkStockAvailability]);

  // Aplicar ajuste manual de preço a um item
  const applyManualPriceAdjustment = useCallback(
    (productId: string, adjustmentAmount: number) => {
      if (adjustmentAmount < 0) {
        console.warn("Ajuste manual não pode ser negativo");
        return;
      }

      setSaleData((prev) => {
        const updatedItems = prev.items.map((item) => {
          if (item.productId === productId) {
            // Salvar preço original se ainda não foi salvo
            const originalPrice = item.originalPrice || item.price;

            // Calcular novo preço por unidade
            const priceAdjustmentPerUnit = adjustmentAmount / item.quantity;
            const newPrice = originalPrice + priceAdjustmentPerUnit;

            // Recalcular subtotal com novo preço
            let newSubtotal = roundToTwoDecimals(safeMultiply(newPrice, item.quantity));

            // Aplicar desconto individual se existir (sobre o preço já ajustado)
            if (item.itemDiscountPercent && item.itemDiscountPercent > 0) {
              const discountAmount = roundToTwoDecimals(
                safeMultiply(newSubtotal, item.itemDiscountPercent / 100)
              );
              newSubtotal = safeSubtract(newSubtotal, discountAmount);
            } else if (item.itemDiscountAmount && item.itemDiscountAmount > 0) {
              const discountAmount = Math.min(item.itemDiscountAmount, newSubtotal);
              newSubtotal = safeSubtract(newSubtotal, discountAmount);
            }

            return {
              ...item,
              price: newPrice,
              subtotal: newSubtotal,
              manualPriceAdjustment: adjustmentAmount,
              originalPrice: originalPrice,
            };
          }
          return item;
        });

        // Recalcular totais
        const { subtotal, total } = recalculateTotals(
          updatedItems,
          prev.discountPercent,
          prev.discountAmount
        );

        return {
          ...prev,
          items: updatedItems,
          subtotal,
          total,
        };
      });
    },
    [recalculateTotals]
  );

  // Remover ajuste manual de preço de um item
  const removeManualPriceAdjustment = useCallback(
    (productId: string) => {
      setSaleData((prev) => {
        const updatedItems = prev.items.map((item) => {
          if (item.productId === productId && item.manualPriceAdjustment) {
            // Restaurar preço original
            const originalPrice = item.originalPrice || item.price;

            // Recalcular subtotal com preço original
            let newSubtotal = roundToTwoDecimals(safeMultiply(originalPrice, item.quantity));

            // Aplicar desconto individual se existir (sobre o preço original)
            if (item.itemDiscountPercent && item.itemDiscountPercent > 0) {
              const discountAmount = roundToTwoDecimals(
                safeMultiply(newSubtotal, item.itemDiscountPercent / 100)
              );
              newSubtotal = safeSubtract(newSubtotal, discountAmount);
            } else if (item.itemDiscountAmount && item.itemDiscountAmount > 0) {
              const discountAmount = Math.min(item.itemDiscountAmount, newSubtotal);
              newSubtotal = safeSubtract(newSubtotal, discountAmount);
            }

            return {
              ...item,
              price: originalPrice,
              subtotal: newSubtotal,
              manualPriceAdjustment: undefined,
              originalPrice: undefined,
            };
          }
          return item;
        });

        // Recalcular totais
        const { subtotal, total } = recalculateTotals(
          updatedItems,
          prev.discountPercent,
          prev.discountAmount
        );

        return {
          ...prev,
          items: updatedItems,
          subtotal,
          total,
        };
      });
    },
    [recalculateTotals]
  );

  // Finalizar venda (salvar no banco) com validação de estoque
  const finalizeSale = useCallback(
    async (
      salespersonName?: string
    ): Promise<{ success: boolean; saleId?: string; error?: string }> => {
      if (!user || !profile) {
        return { success: false, error: "Usuário não autenticado" };
      }

      if (saleData.items.length === 0) {
        return { success: false, error: "Adicione produtos ao carrinho" };
      }

      if (!saleData.paymentMethod) {
        return { success: false, error: "Selecione um método de pagamento" };
      }

      if (!salespersonName?.trim()) {
        return { success: false, error: "Nome do vendedor é obrigatório" };
      }

      // Validar estoque antes de processar
      const stockValidation = await validateStockBeforeSale();
      if (!stockValidation.valid) {
        return {
          success: false,
          error: `Problemas de estoque:\n${stockValidation.errors.join("\n")}`,
        };
      }

      setLoading(true);
      setError(null);

      try {
        // Usar cliente padrão do sistema
        const customer = await initializeDefaultCustomer();

        // Criar a venda usando sempre o cliente padrão
        const saleInsertData: SaleInsertData = {
          customer_id: customer.id,
          customer_name: customer.name,
          customer_type: saleData.customer.type,
          subtotal: Math.round(saleData.subtotal * 100) / 100,
          discount_percent:
            saleData.discountPercent > 0
              ? Math.round(saleData.discountPercent * 100) / 100
              : undefined,
          discount_amount:
            saleData.discountAmount > 0
              ? Math.round(saleData.discountAmount * 100) / 100
              : undefined,
          total: Math.round(saleData.total * 100) / 100,
          payment_method: saleData.paymentMethod,
          notes: saleData.notes || undefined,
          user_id: user.id,
          user_name: profile.name,
          salesperson_name: salespersonName.trim(),
          status: "completed",
        };

        const { data: saleResponse, error: saleError } = await supabase
          .from("sales")
          .insert(saleInsertData)
          .select()
          .single();

        if (saleError) {
          console.error("Erro ao criar venda:", saleError);
          return { success: false, error: "Erro ao processar venda" };
        }

        const saleId = saleResponse.id;

        // Criar os itens da venda
        const saleItemsData: SaleItemInsertData[] = saleData.items.map(
          (item) => ({
            sale_id: saleId,
            product_id: item.productId,
            product_name: item.name,
            product_sku: item.sku,
            quantity: item.quantity,
            unit_price: roundToTwoDecimals(item.price),
            total_price: roundToTwoDecimals(item.subtotal),
          })
        );

        const { error: itemsError } = await supabase
          .from("sale_items")
          .insert(saleItemsData);

        if (itemsError) {
          console.error("Erro ao criar itens da venda:", itemsError);
          return { success: false, error: "Erro ao processar itens da venda" };
        }

        // Atualizar estoque dos produtos
        for (const item of saleData.items) {
          const { error: stockError } = await supabase.rpc(
            "update_product_stock",
            {
              product_id: item.productId,
              quantity_sold: item.quantity,
            }
          );

          if (stockError) {
            console.error("Erro ao atualizar estoque:", stockError);
            // Não falha a venda por erro de estoque, apenas loga
          }
        }

        // Limpar carrinho após sucesso
        clearSale();

        return { success: true, saleId };
      } catch (err) {
        console.error("Erro inesperado:", err);
        return { success: false, error: "Erro inesperado ao processar venda" };
      } finally {
        setLoading(false);
      }
    },
    [
      user,
      profile,
      saleData,
      clearSale,
      validateStockBeforeSale,
      initializeDefaultCustomer,
      supabase,
    ]
  );

  // Calcular totais automaticamente quando items mudam
  useEffect(() => {
    setSaleData((prev) => {
      // Calcular subtotal com arredondamento seguro
      const subtotal = safeAdd(...prev.items.map((item) => item.subtotal));

      // Calcular total aplicando desconto se existir
      let total = subtotal;
      if (prev.discountAmount > 0) {
        total = Math.max(0, safeSubtract(subtotal, prev.discountAmount));
      }

      return {
        ...prev,
        subtotal: subtotal,
        total: total,
      };
    });
  }, [saleData.items]);

  // Função para verificar se dados foram recuperados na inicialização
  const wasDataRecovered = useCallback((): boolean => {
    return dataWasRecovered;
  }, [dataWasRecovered]);

  // Função para marcar que o banner de recuperação foi mostrado
  const markRecoveryBannerShown = useCallback(() => {
    setDataWasRecovered(false);
  }, []);

  // Função para verificar se há dados salvos
  const hasPersistedData = useCallback((): boolean => {
    try {
      if (typeof window === "undefined") return false;
      const savedData = localStorage.getItem(PDV_CART_KEY);
      return savedData !== null;
    } catch {
      return false;
    }
  }, [PDV_CART_KEY]);

  // Função para limpar dados persistidos manualmente
  const clearPersistedData = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(PDV_CART_KEY);
      }
    } catch (error) {
      console.error("Erro ao limpar dados persistidos:", error);
    }
  }, [PDV_CART_KEY]);

  // Aplicar desconto individual em um item
  const applyItemDiscount = useCallback(
    (productId: string, type: "percent" | "amount", value: number) => {
      setSaleData((prev) => {
        const updatedItems = prev.items.map((item) => {
          if (item.productId === productId) {
            // Calcular subtotal original se não existir
            const originalSubtotal =
              item.originalSubtotal ||
              roundToTwoDecimals(safeMultiply(item.price, item.quantity));

            let itemDiscountAmount = 0;
            let itemDiscountPercent = 0;

            if (type === "percent") {
              itemDiscountPercent = roundToTwoDecimals(
                Math.min(100, Math.max(0, value))
              );
              itemDiscountAmount = roundToTwoDecimals(
                safeMultiply(originalSubtotal, itemDiscountPercent / 100)
              );
            } else {
              itemDiscountAmount = roundToTwoDecimals(
                Math.min(originalSubtotal, Math.max(0, value))
              );
              itemDiscountPercent = calculatePercentage(
                itemDiscountAmount,
                originalSubtotal
              );
            }

            const subtotalWithDiscount = safeSubtract(
              originalSubtotal,
              itemDiscountAmount
            );

            return {
              ...item,
              subtotal: subtotalWithDiscount,
              originalSubtotal,
              itemDiscountPercent:
                itemDiscountPercent > 0 ? itemDiscountPercent : undefined,
              itemDiscountAmount:
                itemDiscountAmount > 0 ? itemDiscountAmount : undefined,
            };
          }
          return item;
        });

        // Recalcular totais
        const { subtotal, total } = recalculateTotals(
          updatedItems,
          prev.discountPercent,
          prev.discountAmount
        );

        return {
          ...prev,
          items: updatedItems,
          subtotal,
          total,
        };
      });
    },
    [recalculateTotals]
  );

  // Remover desconto individual de um item
  const removeItemDiscount = useCallback(
    (productId: string) => {
      setSaleData((prev) => {
        const updatedItems = prev.items.map((item) => {
          if (item.productId === productId) {
            // Restaurar subtotal original
            const originalSubtotal =
              item.originalSubtotal ||
              roundToTwoDecimals(safeMultiply(item.price, item.quantity));

            return {
              ...item,
              subtotal: originalSubtotal,
              originalSubtotal: undefined,
              itemDiscountPercent: undefined,
              itemDiscountAmount: undefined,
            };
          }
          return item;
        });

        // Recalcular totais
        const { subtotal, total } = recalculateTotals(
          updatedItems,
          prev.discountPercent,
          prev.discountAmount
        );

        return {
          ...prev,
          items: updatedItems,
          subtotal,
          total,
        };
      });
    },
    [recalculateTotals]
  );

  // Alternar modo atacado/varejo
  const toggleWholesaleMode = useCallback(async () => {
    const newType =
      saleData.customer.type === "wholesale" ? "retail" : "wholesale";
    await updateCustomer({ type: newType });
  }, [saleData.customer.type, updateCustomer]);

  // Ativar modo atacado
  const activateWholesaleMode = useCallback(async () => {
    if (saleData.customer.type !== "wholesale") {
      await updateCustomer({ type: "wholesale" });
    }
  }, [saleData.customer.type, updateCustomer]);

  // Ativar modo varejo
  const activateRetailMode = useCallback(async () => {
    if (saleData.customer.type !== "retail") {
      await updateCustomer({ type: "retail" });
    }
  }, [saleData.customer.type, updateCustomer]);

  return {
    // Estado
    saleData,
    loading,
    error,

    // Ações de produtos
    searchProductByBarcode,
    addItemToSale,
    updateItemQuantity,
    removeItemFromSale,
    checkStockAvailability,
    validateStockBeforeSale,

    // Ações de venda
    updateCustomer,
    toggleWholesaleMode,
    activateWholesaleMode,
    activateRetailMode,
    applyDiscount,
    setPaymentMethod,
    setNotes,
    finalizeSale,
    clearSale,

    // Persistência
    hasPersistedData,
    clearPersistedData,
    wasDataRecovered,
    markRecoveryBannerShown,

    // Utilitários
    isReady: saleData.items.length > 0 && saleData.paymentMethod !== null,
    itemCount: saleData.items.reduce((total, item) => total + item.quantity, 0),

    // Funções de desconto individual
    applyItemDiscount,
    removeItemDiscount,

    // Funções de ajuste manual de preços
    applyManualPriceAdjustment,
    removeManualPriceAdjustment,
  };
};
