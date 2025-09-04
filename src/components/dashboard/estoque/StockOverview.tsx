"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  Eye,
  DollarSign,
  Target,
  Filter,
} from "lucide-react";
import { useStockOverview } from "./hooks/useStockOverview";
import { formatCurrency } from "@/lib/utils";
import { getStockStatusColor } from "@/types/stock";

interface StockOverviewProps {
  className?: string;
}

export function StockOverview({ className }: StockOverviewProps) {
  const { data, loading, error, pricingMode, setPricingMode, refreshData } =
    useStockOverview();
  const [profitFilter, setProfitFilter] = useState<
    "all" | "high" | "medium" | "low"
  >("all");
  const [sortBy, setSortBy] = useState<
    "profit" | "revenue" | "margin" | "stock"
  >("profit");

  if (loading) {
    return <StockOverviewSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar dados do estoque: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) return null;

  const {
    stats,
    recent_movements,
    low_stock_products,
    categories_stock,
    profit_forecast,
  } = data;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com Toggle de Preços */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Visão Geral</h2>
          <p className="text-muted-foreground">
            Gerencie e acompanhe podendo alternar entre atacado e varejo.
          </p>
        </div>
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200 ${
            pricingMode === "wholesale"
              ? "bg-purple-100 border-purple-200"
              : "bg-blue-100 border-blue-200"
          }`}
        >
          <span
            className={`text-sm font-medium transition-colors ${
              pricingMode === "wholesale" ? "text-purple-700" : "text-gray-500"
            }`}
          >
            Atacado
          </span>

          <Switch
            id="pricing-mode"
            checked={pricingMode === "retail"}
            onCheckedChange={(checked) =>
              setPricingMode(checked ? "retail" : "wholesale")
            }
            className={`${
              pricingMode === "retail"
                ? "data-[state=checked]:bg-blue-600"
                : "data-[state=unchecked]:bg-purple-600"
            }`}
          />

          <span
            className={`text-sm font-medium transition-colors ${
              pricingMode === "retail" ? "text-blue-700" : "text-gray-500"
            }`}
          >
            Varejo
          </span>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Produtos
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_products}</div>
            <p className="text-xs text-muted-foreground">
              {stats.products_in_stock} em estoque, {stats.products_low_stock}{" "}
              baixo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor em Estoque
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.total_stock_value)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.total_stock_quantity} unidades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Potencial de Receita
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.total_revenue_potential)}
            </div>
            <p className="text-xs text-muted-foreground">
              Preço de {pricingMode === "retail" ? "Varejo" : "Atacado"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Potencial de Lucro
            </CardTitle>
            <Target
              className={`h-4 w-4 ${
                pricingMode === "retail" ? "text-blue-600" : "text-purple-600"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                pricingMode === "retail" ? "text-blue-600" : "text-purple-600"
              }`}
            >
              {formatCurrency(stats.total_profit_potential)}
            </div>
            <p className="text-xs text-muted-foreground">
              Margem no {pricingMode === "retail" ? "Varejo" : "Atacado"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.products_low_stock}
            </div>
            <p className="text-xs text-muted-foreground">Necessita reposição</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sem Estoque</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.products_out_of_stock}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.movements_today} movimentações hoje
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produtos com Estoque Baixo */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              Produtos com Estoque Baixo
            </CardTitle>
            <Button variant="outline" size="sm" onClick={refreshData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {low_stock_products.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum produto com estoque baixo
                </p>
              ) : (
                low_stock_products.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{product.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {product.brand} • {product.sku}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge
                        variant="secondary"
                        className={getStockStatusColor(product.stock_status)}
                      >
                        {product.current_stock} un.
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        Min: {product.min_stock}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {low_stock_products.length > 5 && (
                <Button variant="outline" size="sm" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver todos ({low_stock_products.length})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Movimentações Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Movimentações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recent_movements.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma movimentação recente
                </p>
              ) : (
                recent_movements.slice(0, 5).map((movement) => (
                  <div
                    key={movement.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {movement.product.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {movement.reason} • {movement.user_name}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge
                        variant="secondary"
                        className={
                          movement.type === "in"
                            ? "text-green-600 bg-green-100"
                            : movement.type === "out"
                            ? "text-red-600 bg-red-100"
                            : "text-blue-600 bg-blue-100"
                        }
                      >
                        {movement.type === "in"
                          ? "+"
                          : movement.type === "out"
                          ? "-"
                          : "±"}
                        {movement.quantity}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {new Date(movement.created_at).toLocaleDateString(
                          "pt-BR"
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Estoque por Categoria */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Estoque por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories_stock.map((category) => (
                <div key={category.category} className="p-4 border rounded-lg">
                  <div className="font-medium text-sm mb-2">
                    {category.category}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Total:</span>
                      <span className="font-medium">
                        {category.total_products}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Em estoque:</span>
                      <span className="text-green-600">
                        {category.products_in_stock}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Estoque baixo:</span>
                      <span className="text-yellow-600">
                        {category.products_low_stock}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Sem estoque:</span>
                      <span className="text-red-600">
                        {category.products_out_of_stock}
                      </span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-xs font-medium">
                        <span>Valor:</span>
                        <span>{formatCurrency(category.stock_value)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Previsão de Lucros */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target
                className={`h-5 w-5 ${
                  pricingMode === "retail" ? "text-blue-600" : "text-purple-600"
                }`}
              />
              Previsão de Lucros -{" "}
              {pricingMode === "retail" ? "Varejo" : "Atacado"}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={profitFilter}
                onValueChange={(value: "all" | "high" | "medium" | "low") =>
                  setProfitFilter(value)
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="high">Alto Lucro</SelectItem>
                  <SelectItem value="medium">Médio Lucro</SelectItem>
                  <SelectItem value="low">Baixo Lucro</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={sortBy}
                onValueChange={(
                  value: "profit" | "revenue" | "margin" | "stock"
                ) => setSortBy(value)}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profit">Por Lucro</SelectItem>
                  <SelectItem value="revenue">Por Receita</SelectItem>
                  <SelectItem value="margin">Por Margem</SelectItem>
                  <SelectItem value="stock">Por Estoque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(() => {
              let filteredForecast = [...profit_forecast];

              // Apply profit filter
              if (profitFilter !== "all") {
                filteredForecast = filteredForecast.filter((product) => {
                  const profit =
                    pricingMode === "retail"
                      ? product.profit_potential_retail
                      : product.profit_potential_wholesale;
                  if (profitFilter === "high") return profit > 1000;
                  if (profitFilter === "medium")
                    return profit >= 500 && profit <= 1000;
                  if (profitFilter === "low") return profit < 500;
                  return true;
                });
              }

              // Apply sorting
              filteredForecast.sort((a, b) => {
                switch (sortBy) {
                  case "profit":
                    return pricingMode === "retail"
                      ? b.profit_potential_retail - a.profit_potential_retail
                      : b.profit_potential_wholesale -
                          a.profit_potential_wholesale;
                  case "revenue":
                    return pricingMode === "retail"
                      ? b.revenue_potential_retail - a.revenue_potential_retail
                      : b.revenue_potential_wholesale -
                          a.revenue_potential_wholesale;
                  case "margin":
                    return pricingMode === "retail"
                      ? b.margin_retail - a.margin_retail
                      : b.margin_wholesale - a.margin_wholesale;
                  case "stock":
                    return b.current_stock - a.current_stock;
                  default:
                    return 0;
                }
              });

              return filteredForecast.slice(0, 10).map((product) => {
                const currentProfit =
                  pricingMode === "retail"
                    ? product.profit_potential_retail
                    : product.profit_potential_wholesale;
                const currentRevenue =
                  pricingMode === "retail"
                    ? product.revenue_potential_retail
                    : product.revenue_potential_wholesale;
                const currentMargin =
                  pricingMode === "retail"
                    ? product.margin_retail
                    : product.margin_wholesale;
                const currentPrice =
                  pricingMode === "retail"
                    ? product.retail_price
                    : product.wholesale_price;

                return (
                  <div
                    key={product.product_id}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-sm">
                          {product.product_name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {product.product_sku} • {product.current_stock}{" "}
                          unidades
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(currentProfit)} lucro
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {currentMargin.toFixed(1)}% margem
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <div className="text-muted-foreground">Custo Unit.</div>
                        <div className="font-medium">
                          {formatCurrency(product.cost_per_unit)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">
                          Preço{" "}
                          {pricingMode === "retail" ? "Varejo" : "Atacado"}
                        </div>
                        <div className="font-medium">
                          {formatCurrency(currentPrice)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">
                          Receita Potencial
                        </div>
                        <div className="font-medium text-green-600">
                          {formatCurrency(currentRevenue)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">
                          Lucro Potencial
                        </div>
                        <div
                          className={`font-medium ${
                            pricingMode === "retail"
                              ? "text-blue-600"
                              : "text-purple-600"
                          }`}
                        >
                          {formatCurrency(currentProfit)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StockOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div
                    key={j}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="text-right space-y-1">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
