"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, RefreshCw, TrendingUp } from "lucide-react";
import { SalesStatsCards } from "@/components/dashboard/vendas/SalesStatsCards";
import { SalesFilters } from "@/components/dashboard/vendas/SalesFilters";
import { TopSellersCard } from "@/components/dashboard/vendas/TopSellersCard";
import { SalesTable } from "@/components/dashboard/vendas/SalesTable/SalesTable";
import { SaleDetailsModal } from "@/components/dashboard/vendas/SaleDetailsModal";
import { useSales } from "@/components/dashboard/vendas/hooks/useSales";
import { SaleFilters } from "@/types/sales";
import { toast } from "sonner";

export interface VendasPageProps {
  searchParams?: Promise<{
    period?: string;
    customer_type?: string;
    payment_method?: string;
    date_from?: string;
    date_to?: string;
  }>;
}

export interface PageState {
  selectedSaleId: string | null;
  showSaleDetails: boolean;
  showFilters: boolean;
  refreshKey: number;
}

export default function VendasPage({ searchParams }: VendasPageProps) {
  const [resolvedSearchParams, setResolvedSearchParams] = React.useState<{
    period?: string;
    customer_type?: string;
    payment_method?: string;
    date_from?: string;
    date_to?: string;
  }>({});

  React.useEffect(() => {
    if (searchParams) {
      searchParams.then((params) => {
        setResolvedSearchParams(params);
      });
    }
  }, [searchParams]);
  const [pageState, setPageState] = useState<PageState>({
    selectedSaleId: null,
    showSaleDetails: false,
    showFilters: true,
    refreshKey: 0,
  });

  const {
    loading,
    stats,
    filters,
    pagination,
    setFilters,
    refreshData,
    exportSales,
    formatCurrency,
  } = useSales(resolvedSearchParams as Partial<SaleFilters>);

  const handleViewSale = (saleId: string) => {
    setPageState((prev) => ({
      ...prev,
      selectedSaleId: saleId,
      showSaleDetails: true,
    }));
  };

  const handleCloseSaleDetails = () => {
    setPageState((prev) => ({
      ...prev,
      selectedSaleId: null,
      showSaleDetails: false,
    }));
  };

  const handleRefreshData = async () => {
    try {
      await refreshData();
      setPageState((prev) => ({ ...prev, refreshKey: prev.refreshKey + 1 }));
      toast.success("Dados atualizados com sucesso!");
    } catch (err) {
      console.error("Error refreshing data:", err);
      toast.error("Erro ao atualizar dados");
    }
  };

  const handleExportCSV = async () => {
    try {
      await exportSales("csv");
    } catch (err) {
      console.error("Error exporting CSV:", err);
      toast.error("Erro ao exportar dados");
    }
  };

  const handleExportExcel = async () => {
    try {
      await exportSales("excel");
    } catch (err) {
      console.error("Error exporting Excel:", err);
      toast.error("Erro ao exportar dados");
    }
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      customer_type: "all",
      payment_method: "all",
      status: "all",
      sort_by: "created_at",
      sort_order: "desc",
      page: 1,
      limit: 20,
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Vendas
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie vendas, visualize métricas e acompanhe o desempenho da
            equipe.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshData}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            <FileText className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <SalesStatsCards stats={stats} loading={loading} className="mb-2" />

      {/* Main Content Layout - Responsivo Inteligente */}
      <div className="max-w-8xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Filtros - Responsivo por breakpoint */}
          <div className="lg:col-span-12 xl:col-span-3 2xl:col-span-3">
            <SalesFilters
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={handleClearFilters}
              compact={false}
              showAdvanced={false}
              className="h-fit"
            />
          </div>

          {/* Conteúdo Principal - Tabela de Vendas */}
          <section className="lg:col-span-12 xl:col-span-6 2xl:col-span-6">
            <div className="space-y-4">
              {/* Table Header Info */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                  <h3 className="text-lg font-semibold">Lista de Vendas</h3>
                  {stats && (
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span>{stats.total_sales} vendas</span>
                      <span className="hidden sm:inline">•</span>
                      <span>
                        {formatCurrency(stats.total_revenue)} em receita
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {formatCurrency(stats.total_profit)} lucro
                      </span>
                    </div>
                  )}
                </div>

              {pagination.total > 0 && (
                <div className="text-sm text-muted-foreground whitespace-nowrap">
                  Página {pagination.page} de {pagination.totalPages}
                  <span className="hidden sm:inline">
                    ({pagination.total}{" "}
                    {pagination.total === 1 ? "venda" : "vendas"})
                  </span>
                </div>
              )}
            </div>

            {/* Sales Table */}
            <SalesTable
              onViewSale={handleViewSale}
              onViewProfit={handleViewSale}
              className="w-full overflow-hidden"
            />
          </div>
        </section>

        {/* Sidebar Direita - Top Sellers (Visível apenas em XL+) */}
        <aside className="hidden xl:block xl:col-span-3 2xl:col-span-3">
          <div className="sticky top-6">
            <TopSellersCard />
          </div>
        </aside>
      </div>
    </div>

    {/* Top Sellers Card - Mobile/Tablet Version */}
    <article className="xl:hidden">
      <TopSellersCard />
    </article>

      {/* Modals */}
      {pageState.selectedSaleId && (
        <>
          {/* Sale Details Modal */}
          <SaleDetailsModal
            saleId={pageState.selectedSaleId}
            open={pageState.showSaleDetails}
            onClose={handleCloseSaleDetails}
          />
        </>
      )}
    </div>
  );
}
