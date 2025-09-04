"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useTopSellers } from "./hooks/useTopSellers";
import { PERIOD_OPTIONS } from "@/types/sales";
import {
  Crown,
  Trophy,
  Medal,
  TrendingUp,
  TrendingDown,
  Users,
} from "lucide-react";

export function TopSellersCard() {
  const { topSellers, loading, error, period, setPeriod, totalPeriodStats } =
    useTopSellers();

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  const getRankingIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Trophy className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Medal className="h-4 w-4 text-amber-600" />;
      default:
        return (
          <span className="text-sm font-semibold text-muted-foreground">
            #{position}
          </span>
        );
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderLoadingState = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="flex items-center gap-3 p-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="text-right space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <div className="flex items-center justify-center h-80 text-muted-foreground">
      <div className="text-center">
        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum vendedor encontrado no período selecionado</p>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <article className="flex items-center justify-between gap-x-2">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Vendedores
            <Badge variant="secondary" className="ml-2">
              {totalPeriodStats.active_sellers}
            </Badge>
          </CardTitle>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32 ml-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.filter((option) => option.value !== "custom").map(
                (option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </article>
      </CardHeader>

      <CardContent>
        {loading ? (
          renderLoadingState()
        ) : error ? (
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Erro ao carregar dados dos vendedores</p>
            </div>
          </div>
        ) : topSellers.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="space-y-4">
            {topSellers.map((seller) => (
              <div
                key={seller.salesperson_name}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* Ranking Icon & Avatar */}
                <div className="flex items-center gap-2">
                  {getRankingIcon(seller.position)}
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs font-medium">
                      {getInitials(seller.salesperson_name)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Seller Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {seller.salesperson_name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {seller.sales_count} vendas
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {formatPercentage(seller.profit_margin)} margem
                    </span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="text-right">
                  <p className="font-semibold text-sm">
                    {formatCurrency(seller.total_profit)}
                  </p>
                  <div className="flex items-center gap-1 justify-end mt-1">
                    {seller.growth_vs_previous.profit > 0 ? (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800 hover:bg-green-100 text-xs px-1 py-0"
                      >
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {formatPercentage(seller.growth_vs_previous.profit)}
                      </Badge>
                    ) : seller.growth_vs_previous.profit < 0 ? (
                      <Badge
                        variant="secondary"
                        className="bg-red-100 text-red-800 hover:bg-red-100 text-xs px-1 py-0"
                      >
                        <TrendingDown className="h-3 w-3 mr-1" />
                        {formatPercentage(seller.growth_vs_previous.profit)}
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-gray-100 text-gray-800 hover:bg-gray-100 text-xs px-1 py-0"
                      >
                        {formatPercentage(seller.growth_vs_previous.profit)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
