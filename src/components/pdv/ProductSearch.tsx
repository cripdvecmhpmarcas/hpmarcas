// Funcionalidades:
// - Input para código de barras(leitor)
//   - Busca automática no banco
//     - Feedback visual(encontrado / não encontrado)
//       - Integração com usePDV
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSupabaseAdmin } from "@/hooks/useSupabaseAdmin";
import {
  Scan,
  Search,
  CheckCircle,
  AlertCircle,
  Package,
  Zap,
  Info,
  X,
  List,
} from "lucide-react";
import { Product } from "@/types/pdv";
import type { ProductSearchProps } from "@/types/pdv";
import type { ProductVolume, ProductWithVolumes } from "@/types/products";
import { ProductCard } from "./ProductCard";
import { ProductFeedbackCard } from "./ProductFeedbackCard";
import { VolumeSelector } from "./VolumeSelector";

export const ProductSearch: React.FC<ProductSearchProps> = ({
  onProductFound,
  onProductNotFound,
  customerType,
  disabled = false,
  autoFocus = true,
}) => {
  // Cliente Supabase
  const supabase = useSupabaseAdmin();
  // Estados
  const [barcode, setBarcode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [lastSearchResult, setLastSearchResult] = useState<{
    type: "success" | "error" | "not-found";
    message: string;
    product?: Product;
  } | null>(null);

  // Estados do leitor
  const [isScanning, setIsScanning] = useState(false);
  const [scanBuffer, setScanBuffer] = useState("");
  const [scanStartTime, setScanStartTime] = useState<number | null>(null);
  const [shouldMaintainFocus, setShouldMaintainFocus] = useState(true);

  // Estados para busca de produtos existentes
  const [showProductList, setShowProductList] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [availableProducts, setAvailableProducts] = useState<
    ProductWithVolumes[]
  >([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Estados para Volume Selector Modal
  const [showVolumeSelector, setShowVolumeSelector] = useState(false);
  const [selectedProductForVolume, setSelectedProductForVolume] =
    useState<ProductWithVolumes | null>(null);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchDelayRef = useRef<NodeJS.Timeout | null>(null);
  const searchProductsDelayRef = useRef<NodeJS.Timeout | null>(null);

  // Configurações do leitor
  const SCAN_TIMEOUT = 50; // Reduzido para 50ms
  const SEARCH_DELAY = 1000; // Reduzido para 1s
  const MIN_BARCODE_LENGTH = 8;
  const MAX_BARCODE_LENGTH = 20;
  const SCAN_SPEED_THRESHOLD = 30; // Reduzido para detectar melhor os leitores

  // Helper para converter dados do Supabase para ProductWithVolumes
  const convertToProductWithVolumes = (data: Product): ProductWithVolumes => {
    let volumes: ProductVolume[] | null = null;

    if (data.volumes) {
      try {
        let rawVolumes;
        if (Array.isArray(data.volumes)) {
          rawVolumes = data.volumes;
        } else if (typeof data.volumes === "string") {
          rawVolumes = JSON.parse(data.volumes);
        } else {
          rawVolumes = data.volumes;
        }

        // Converter volumes para o formato novo se necessário
        if (Array.isArray(rawVolumes)) {
          volumes = rawVolumes.map((vol: Record<string, unknown>) => {
            // Se tem 'price' (formato antigo), converter para 'price_adjustment'
            if (vol.price !== undefined && vol.price_adjustment === undefined) {
              // Extrair tamanho e unidade do campo 'size'
              const sizeStr = typeof vol.size === "string" ? vol.size : "";
              const sizeMatch = sizeStr.match(
                /^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/
              );

              return {
                size: sizeMatch ? sizeMatch[1] : sizeStr || "",
                unit: sizeMatch ? sizeMatch[2] : "ml",
                barcode: typeof vol.barcode === "string" ? vol.barcode : "",
                price_adjustment: 0, // Será calculado dinamicamente
              } as ProductVolume;
            }

            // Já está no formato novo
            return {
              size: typeof vol.size === "string" ? vol.size : "",
              unit: typeof vol.unit === "string" ? vol.unit : "ml",
              barcode: typeof vol.barcode === "string" ? vol.barcode : "",
              price_adjustment:
                typeof vol.price_adjustment === "number"
                  ? vol.price_adjustment
                  : 0,
            } as ProductVolume;
          });
        }
      } catch {
        volumes = null;
      }
    }

    return {
      ...data,
      volumes,
    };
  };

  // Buscar produtos existentes por nome/SKU
  const searchExistingProducts = useCallback(
    async (query: string): Promise<void> => {
      if (!query.trim() || query.length < 2) {
        setAvailableProducts([]);
        setLoadingProducts(false);
        return;
      }

      setLoadingProducts(true);

      try {
        const { data, error } = await supabase
          .from("products")
          .select(
            "id, barcode, name, brand, category, sku, retail_price, wholesale_price, stock, status, volumes"
          )
          .eq("status", "active")
          .gt("stock", 0) // Apenas produtos com estoque
          .or(
            `name.ilike.%${query}%,sku.ilike.%${query}%,brand.ilike.%${query}%`
          )
          .order("name")
          .limit(20); // Aumentar limite mas manter performance

        if (error) {
          console.error("Erro ao buscar produtos:", error);
          setAvailableProducts([]);
          return;
        }

        setAvailableProducts(
          (data || []).map((item) =>
            convertToProductWithVolumes(item as Product)
          )
        );
      } catch (err) {
        console.error("Erro na busca de produtos:", err);
        setAvailableProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    },
    [supabase]
  );

  // Cancelar busca atual
  const handleCancelSearch = useCallback(() => {
    // Limpar timeouts
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
    if (searchDelayRef.current) {
      clearTimeout(searchDelayRef.current);
    }
    if (searchProductsDelayRef.current) {
      clearTimeout(searchProductsDelayRef.current);
    }

    // Resetar estados
    setBarcode("");
    setIsSearching(false);
    setIsScanning(false);
    setScanBuffer("");
    setScanStartTime(null);
    setLastSearchResult(null);
    setShowProductList(false);
    setSearchQuery("");
    setAvailableProducts([]);

    // Refocar no input
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);

  // Selecionar produto da lista (com suporte a volumes)
  const handleSelectProduct = useCallback(
    async (product: Product, volume?: ProductVolume) => {
      try {
        const volumeText = volume ? ` - ${volume.size}${volume.unit}` : "";
        setLastSearchResult({
          type: "success",
          message: `Adicionando produto: ${product.name}${volumeText}...`,
          product,
        });

        // Chamar a função do pai que adiciona ao carrinho (com volume)
        await onProductFound(product, volume);

        setShowProductList(false);
        setSearchQuery("");
        setAvailableProducts([]);

        // Feedback de sucesso
        setLastSearchResult({
          type: "success",
          message: `✓ ${product.name}${volumeText} adicionado ao carrinho!`,
          product,
        });

        // Limpar feedback após alguns segundos
        setTimeout(() => {
          setBarcode("");
          setLastSearchResult(null);
          if (inputRef.current && !disabled) {
            inputRef.current.focus();
          }
        }, 2000);
      } catch (error) {
        setLastSearchResult({
          type: "error",
          message: `Erro ao adicionar produto: ${error}`,
        });
      }
    },
    [onProductFound, disabled]
  );

  // Lidar com seleção de volume do modal
  const handleVolumeSelection = useCallback(
    async (product: ProductWithVolumes, volume?: ProductVolume) => {
      try {
        const volumeText = volume ? ` - ${volume.size}${volume.unit}` : "";

        setLastSearchResult({
          type: "success",
          message: `Adicionando produto: ${product.name}${volumeText}...`,
          product: product as unknown as Product,
        });

        // Chamar a função do pai que adiciona ao carrinho
        await onProductFound(product, volume);

        // Fechar modal
        setShowVolumeSelector(false);
        setSelectedProductForVolume(null);

        // Feedback de sucesso
        setLastSearchResult({
          type: "success",
          message: `✓ ${product.name}${volumeText} adicionado ao carrinho!`,
          product: product as unknown as Product,
        });

        // Limpar feedback e input após alguns segundos
        setTimeout(() => {
          setBarcode("");
          setLastSearchResult(null);
          if (inputRef.current && !disabled) {
            inputRef.current.focus();
          }
        }, 2000);
      } catch (error) {
        setLastSearchResult({
          type: "error",
          message: `Erro ao adicionar produto: ${error}`,
        });
      }
    },
    [onProductFound, disabled]
  );

  // Alternar lista de produtos
  const toggleProductList = useCallback(() => {
    if (!showProductList) {
      setShowProductList(true);
      setSearchQuery(""); // Iniciar com campo vazio
      setAvailableProducts([]); // Não carregar produtos inicialmente
      setLoadingProducts(false); // Garantir que loading não fica preso
    } else {
      setShowProductList(false);
      setSearchQuery("");
      setAvailableProducts([]);
      setLoadingProducts(false); // Garantir que loading pare

      // Limpar timeout de busca se existir
      if (searchProductsDelayRef.current) {
        clearTimeout(searchProductsDelayRef.current);
      }
    }
  }, [showProductList]);
  const searchProduct = useCallback(
    async (barcodeToSearch: string): Promise<void> => {
      if (
        !barcodeToSearch.trim() ||
        barcodeToSearch.length < MIN_BARCODE_LENGTH
      ) {
        setLastSearchResult({
          type: "error",
          message: "Código deve ter pelo menos 8 dígitos",
        });
        return;
      }

      setIsSearching(true);
      setLastSearchResult(null);

      try {
        // Busca otimizada no Supabase
        const { data, error } = await supabase
          .from("products")
          .select(
            "id, barcode, name, brand, category, sku, retail_price, wholesale_price, stock, status, volumes"
          )
          .eq("barcode", barcodeToSearch.trim())
          .eq("status", "active")
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        if (!data) {
          // Produto não encontrado
          setLastSearchResult({
            type: "not-found",
            message: `Produto não encontrado: ${barcodeToSearch}`,
          });
          onProductNotFound(barcodeToSearch);
          return;
        }

        // Produto encontrado
        const product = convertToProductWithVolumes(data as Product);

        if (product.stock <= 0) {
          setLastSearchResult({
            type: "error",
            message: `Produto "${product.name}" está sem estoque!`,
          });
          return;
        }

        // Verificar se o produto tem volumes
        const hasVolumes = product.volumes && product.volumes.length > 0;

        if (hasVolumes) {
          // Produto tem volumes - abrir selector
          setSelectedProductForVolume(product);
          setShowVolumeSelector(true);

          setLastSearchResult({
            type: "success",
            message: `Produto encontrado: ${product.name} - Selecione o tamanho`,
            product: product as unknown as Product,
          });
        } else {
          // Produto sem volumes - adicionar direto
          setLastSearchResult({
            type: "success",
            message: `Produto encontrado: ${product.name}`,
            product: product as unknown as Product,
          });

          onProductFound(product);
        }
      } catch (err) {
        console.error("Erro na busca:", err);
        setLastSearchResult({
          type: "error",
          message: "Erro ao buscar produto. Tente novamente.",
        });
      } finally {
        setIsSearching(false);
      }
    },
    [onProductFound, onProductNotFound, supabase]
  );

  // Finalizar scan e processar
  const finalizeScan = useCallback(() => {
    const codeToProcess = barcode.trim();

    if (
      codeToProcess.length >= MIN_BARCODE_LENGTH &&
      codeToProcess.length <= MAX_BARCODE_LENGTH
    ) {
      // Detectar se foi usado leitor (velocidade de digitação)
      const scanDuration = scanStartTime ? Date.now() - scanStartTime : 0;
      const avgCharTime = scanDuration / codeToProcess.length;
      const wasScanned = avgCharTime < SCAN_SPEED_THRESHOLD;

      // Visual feedback para scan detectado
      if (wasScanned && inputRef.current) {
        inputRef.current.style.backgroundColor = "#dcfce7"; // Verde claro
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.style.backgroundColor = "";
          }
        }, 200);
      }

      searchProduct(codeToProcess);

      // Limpar input após um tempo
      setTimeout(() => {
        setBarcode("");
        setIsScanning(false);
        setScanBuffer("");
        setScanStartTime(null);

        // Refocar no input
        if (inputRef.current && !disabled) {
          inputRef.current.focus();
        }
      }, 1000);
    }

    setIsScanning(false);
    setScanBuffer("");
    setScanStartTime(null);
  }, [barcode, scanStartTime, searchProduct, disabled]);

  // Detectar entrada do leitor de código de barras
  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const currentTime = Date.now();
      const inputValue = e.target.value;

      // Limpar timeout de busca anterior
      if (searchDelayRef.current) {
        clearTimeout(searchDelayRef.current);
      }

      // Se é o primeiro caractere ou muito tempo depois do último
      if (!isScanning || (scanStartTime && currentTime - scanStartTime > 200)) {
        setIsScanning(true);
        setScanBuffer("");
        setScanStartTime(currentTime);
      }

      // Adicionar caractere ao buffer
      setScanBuffer((prev) => prev + inputValue.slice(-1));

      // Limpar timeout anterior de scan
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }

      // Configurar timeout para detectar fim do scan
      scanTimeoutRef.current = setTimeout(() => {
        if (isScanning && scanBuffer.length > 0) {
          finalizeScan();
        }
      }, SCAN_TIMEOUT);

      setBarcode(inputValue);

      // Busca automática com delay se o código tem tamanho mínimo
      if (inputValue.trim().length >= MIN_BARCODE_LENGTH) {
        searchDelayRef.current = setTimeout(() => {
          searchProduct(inputValue.trim());
        }, SEARCH_DELAY);
      }
    },
    [finalizeScan, isScanning, scanBuffer.length, scanStartTime, searchProduct]
  );

  // Detectar ENTER (fim de scan para maioria dos leitores)
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();

        if (scanTimeoutRef.current) {
          clearTimeout(scanTimeoutRef.current);
        }

        if (isScanning || barcode.trim()) {
          finalizeScan();
        }
      }
    },
    [isScanning, barcode, finalizeScan]
  );

  // Busca manual (botão)
  const handleManualSearch = useCallback(() => {
    if (barcode.trim()) {
      searchProduct(barcode.trim());
    }
  }, [barcode, searchProduct]);

  // Auto-focus quando componente carrega
  useEffect(() => {
    if (autoFocus && inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [autoFocus, disabled]);

  // Manter foco no input controlado
  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const relatedTarget = e.relatedTarget as HTMLElement;

      // Não refocar se o usuário clicou em outro elemento interativo
      if (
        relatedTarget &&
        (relatedTarget.tagName === "BUTTON" ||
          relatedTarget.tagName === "INPUT" ||
          relatedTarget.tagName === "SELECT" ||
          relatedTarget.tagName === "TEXTAREA" ||
          relatedTarget.hasAttribute("tabindex") ||
          relatedTarget.closest('[role="button"]') ||
          relatedTarget.closest('[role="dialog"]') ||
          relatedTarget.closest('[role="menu"]'))
      ) {
        setShouldMaintainFocus(false);
        return;
      }

      // Refocar após um delay se ainda deve manter foco
      if (!disabled && shouldMaintainFocus) {
        setTimeout(() => {
          if (inputRef.current && shouldMaintainFocus) {
            inputRef.current.focus();
          }
        }, 100);
      }
    },
    [disabled, shouldMaintainFocus]
  );

  // Reativar foco quando necessário
  const handleFocus = useCallback(() => {
    setShouldMaintainFocus(true);
  }, []);

  // Limpar timeouts na desmontagem
  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
      if (searchDelayRef.current) {
        clearTimeout(searchDelayRef.current);
      }
      if (searchProductsDelayRef.current) {
        clearTimeout(searchProductsDelayRef.current);
      }
    };
  }, []);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Campo de Busca */}
        <div>
          <Label
            htmlFor="barcode-search"
            className="flex items-center gap-2 mb-2"
          >
            <Scan className="w-4 h-4" />
            Código de Barras
            {isScanning && (
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200"
              >
                <Zap className="w-3 h-3 mr-1" />
                Escaneando...
              </Badge>
            )}
          </Label>

          <div className="space-y-3">
            {/* Campo de entrada principal */}
            <div className="relative">
              <Input
                ref={inputRef}
                id="barcode-search"
                type="text"
                placeholder="Escaneie ou digite o código de barras..."
                value={barcode}
                onChange={handleInput}
                onKeyPress={handleKeyPress}
                onBlur={handleBlur}
                onFocus={handleFocus}
                disabled={disabled || isSearching}
                className={`font-mono pr-10 transition-colors ${
                  isScanning ? "ring-2 ring-green-400 border-green-400" : ""
                }`}
                autoComplete="off"
                spellCheck={false}
              />

              {/* Indicador de status */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isSearching ? (
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : isScanning ? (
                  <Zap className="w-4 h-4 text-green-500" />
                ) : (
                  <Scan className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>

            {/* Grid de botões de ação - Layout melhorado */}
            <div className="flex flex-wrap gap-2">
              {/* Botão Buscar */}
              <Button
                onClick={handleManualSearch}
                disabled={!barcode.trim() || isSearching || disabled}
                variant="outline"
                className="flex-1 min-w-[100px] flex items-center justify-center gap-2 h-10 text-sm"
              >
                {isSearching ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span className="hidden sm:inline">Buscando...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Buscar</span>
                  </>
                )}
              </Button>

              {/* Botão Cancelar */}
              <Button
                onClick={handleCancelSearch}
                disabled={disabled}
                variant="outline"
                className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 h-10 text-sm transition-all ${
                  barcode || isSearching || showProductList
                    ? "text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                    : "text-gray-400 border-gray-200 cursor-not-allowed opacity-50"
                }`}
              >
                <X className="w-4 h-4" />
                <span>Cancelar</span>
              </Button>

              {/* Botão Lista de Produtos */}
              <Button
                onClick={toggleProductList}
                disabled={disabled}
                variant={showProductList ? "default" : "outline"}
                className={`w-full sm:w-auto sm:min-w-[120px] flex items-center justify-center gap-2 h-10 text-sm transition-all ${
                  showProductList
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400"
                }`}
              >
                <List className="w-4 h-4" />
                <span>{showProductList ? "Fechar Lista" : "Ver Produtos"}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Feedback Visual */}
        {lastSearchResult && (
          <Alert
            className={`${
              lastSearchResult.type === "success"
                ? "border-green-200 bg-green-50"
                : lastSearchResult.type === "error"
                ? "border-red-200 bg-red-50"
                : "border-yellow-200 bg-yellow-50"
            }`}
          >
            {lastSearchResult.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : lastSearchResult.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-red-600" />
            ) : (
              <Package className="w-4 h-4 text-yellow-600" />
            )}

            <AlertDescription
              className={`${
                lastSearchResult.type === "success"
                  ? "text-green-800"
                  : lastSearchResult.type === "error"
                  ? "text-red-800"
                  : "text-yellow-800"
              }`}
            >
              {lastSearchResult.message}

              {/* Mostrar detalhes do produto encontrado */}
              {lastSearchResult.type === "success" &&
                lastSearchResult.product && (
                  <ProductFeedbackCard
                    product={lastSearchResult.product}
                    customerType={customerType}
                  />
                )}
            </AlertDescription>
          </Alert>
        )}

        {/* Lista de Produtos Existentes */}
        {showProductList && (
          <div className="border border-gray-200 rounded-lg bg-white shadow-lg">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between rounded-t-lg">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <List className="w-5 h-5 text-blue-600" />
                Produtos Disponíveis
                {availableProducts.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {availableProducts.length} encontrados
                  </Badge>
                )}
              </h3>
              <Button
                onClick={() => {
                  setShowProductList(false);
                  setSearchQuery("");
                  setAvailableProducts([]);
                  setLoadingProducts(false);

                  // Limpar timeout de busca se existir
                  if (searchProductsDelayRef.current) {
                    clearTimeout(searchProductsDelayRef.current);
                  }
                }}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700 hover:bg-white/50"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar produto por nome, SKU ou marca..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);

                    // Limpar timeout anterior
                    if (searchProductsDelayRef.current) {
                      clearTimeout(searchProductsDelayRef.current);
                    }

                    // Debounce de 400ms para melhor performance
                    if (e.target.value.length >= 2) {
                      searchProductsDelayRef.current = setTimeout(() => {
                        searchExistingProducts(e.target.value);
                      }, 400);
                    } else {
                      setAvailableProducts([]);
                      setLoadingProducts(false); // Garantir que loading pare
                    }
                  }}
                  className="pl-10 mb-4 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {loadingProducts ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
                  <span className="text-gray-600">Carregando produtos...</span>
                </div>
              ) : availableProducts.length > 0 ? (
                <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
                  {availableProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      customerType={customerType}
                      onAddToCart={handleSelectProduct}
                      showStockWarning={true}
                    />
                  ))}
                </div>
              ) : searchQuery.trim() ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-lg font-medium">
                    Nenhum produto encontrado
                  </p>
                  <p className="text-sm">
                    Tente buscar por &quot;{searchQuery}&quot; com termos
                    diferentes
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-lg font-medium">
                    Digite para buscar produtos
                  </p>
                  <p className="text-sm">
                    Busque por nome, SKU ou marca (mínimo 2 caracteres)
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instruções de Uso - Compactas e Visuais */}
        {!showProductList && (
          <div className="text-xs text-gray-500 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
            <div className="font-medium text-blue-800 mb-2 flex items-center gap-1">
              <Info className="w-4 h-4 text-blue-500" /> Instruções rápidas:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-blue-700">
              <div className="flex items-center gap-1">
                <Scan className="w-3 h-3 flex-shrink-0" />
                <span>
                  <strong>Leitor:</strong> Aponte e leia
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Search className="w-3 h-3 flex-shrink-0" />
                <span>
                  <strong>Manual:</strong> Digite + Buscar
                </span>
              </div>
              <div className="flex items-center gap-1">
                <List className="w-3 h-3 flex-shrink-0" />
                <span>
                  <strong>Lista:</strong> Ver produtos
                </span>
              </div>
              <div className="flex items-center gap-1">
                <X className="w-3 h-3 flex-shrink-0" />
                <span>
                  <strong>Cancelar:</strong> Limpar busca
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Estatísticas de Uso (DEBUG - remover em produção) */}
        {process.env.NODE_ENV === "development" && (
          <div className="text-xs bg-gray-100 p-2 rounded">
            <div>Debug Info:</div>
            <div>Scanning: {isScanning ? "Yes" : "No"}</div>
            <div>Buffer: &quot;{scanBuffer}&quot;</div>
            <div>Length: {barcode.length}</div>
            {scanStartTime && (
              <div>Duration: {Date.now() - scanStartTime}ms</div>
            )}
          </div>
        )}
      </div>

      {/* Volume Selector Modal */}
      {selectedProductForVolume && (
        <VolumeSelector
          product={
            selectedProductForVolume as unknown as Product & {
              volumes?: ProductVolume[] | null;
            }
          }
          customerType={customerType}
          open={showVolumeSelector}
          onClose={() => {
            setShowVolumeSelector(false);
            setSelectedProductForVolume(null);
            // Refocar no input
            if (inputRef.current && !disabled) {
              inputRef.current.focus();
            }
          }}
          onVolumeSelect={(product, volume) =>
            handleVolumeSelection(product as ProductWithVolumes, volume)
          }
        />
      )}
    </TooltipProvider>
  );
};
