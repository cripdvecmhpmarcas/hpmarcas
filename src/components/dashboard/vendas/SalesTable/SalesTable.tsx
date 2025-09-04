"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  TrendingUp,
  DollarSign,
  Users,
  Receipt,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useSales } from "../hooks/useSales";
import { useSaleReceipt } from "../hooks/useSaleReceipt";
import { SalesTableFilters } from "./SalesTableFilters";
import { SalesTableRow } from "./SalesTableRow";
import { RESPONSIVE_COLUMNS, TableViewMode } from "./types";
import { formatCurrency } from "@/lib/utils";

interface SalesTableProps {
  onViewSale?: (saleId: string) => void;
  onViewProfit?: (saleId: string) => void;
  className?: string;
}

export function SalesTable({
  onViewSale,
  onViewProfit,
  className,
}: SalesTableProps) {
  const {
    sales,
    loading,
    error,
    filters,
    pagination,
    setFilters,
    setPage,
    refreshData,
    exportSales,
    formatDate,
  } = useSales();

  const { generateReceipt, printReceipt, downloadPDF } = useSaleReceipt();

  const [viewMode, setViewMode] = useState<TableViewMode>("desktop");

  // Detect screen size and set appropriate view mode
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setViewMode("mobile");
      } else if (width < 1024) {
        setViewMode("tablet");
      } else {
        setViewMode("desktop");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Get current columns based on view mode
  const currentColumns = RESPONSIVE_COLUMNS[viewMode];

  // Handle sale actions
  const handleViewReceipt = async (saleId: string) => {
    try {
      await generateReceipt(saleId);
    } catch (error) {
      console.error("Error generating receipt:", error);
    }
  };

  const handlePrintReceipt = async (saleId: string) => {
    try {
      await generateReceipt(saleId);
      await printReceipt();
    } catch (error) {
      console.error("Error printing receipt:", error);
    }
  };

  const handleDownloadPDF = async (saleId: string) => {
    try {
      await generateReceipt(saleId);
      await downloadPDF();
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  // Calculate statistics from current data
  const currentStats = useMemo(() => {
    if (!sales.length) return null;

    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalProfit = sales.reduce(
      (sum, sale) => sum + (sale.total_profit || 0),
      0
    );
    const avgTicket = totalRevenue / totalSales;
    const avgMargin = totalProfit > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalSales,
      totalRevenue,
      totalProfit,
      avgTicket,
      avgMargin,
    };
  }, [sales]);

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar vendas: {error}
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            className="ml-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Statistics */}
      {currentStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 min-w-0">
                <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-lg sm:text-2xl font-bold text-blue-600">
                    {currentStats.totalSales}
                  </p>
                  <p className="text-xs text-muted-foreground">Vendas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 min-w-0">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm lg:text-base xl:text-lg font-bold text-green-600 break-words">
                    {formatCurrency(currentStats.totalRevenue)}
                  </p>
                  <p className="text-xs text-muted-foreground">Faturamento</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 min-w-0">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm lg:text-base xl:text-lg font-bold text-purple-600 break-words">
                    {formatCurrency(currentStats.totalProfit)}
                  </p>
                  <p className="text-xs text-muted-foreground">Lucro</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 min-w-0">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm lg:text-base xl:text-lg font-bold text-orange-600 break-words">
                    {formatCurrency(currentStats.avgTicket)}
                  </p>
                  <p className="text-xs text-muted-foreground">Ticket Médio</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 min-w-0">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-lg sm:text-2xl font-bold text-indigo-600">
                    {currentStats.avgMargin.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Margem Média</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <SalesTableFilters
        filters={filters}
        onFiltersChange={setFilters}
        onRefresh={refreshData}
        onExport={exportSales}
        loading={loading}
        salesCount={sales.length}
        totalSales={pagination.total}
      />

      {/* Sales Table/List */}
      {viewMode === "mobile" ? (
        // Mobile Card View
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                    <Skeleton className="h-4 w-32" />
                    <div className="grid grid-cols-2 gap-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : sales.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma venda encontrada
                </h3>
                <p className="text-gray-500">
                  Não há vendas para exibir com os filtros atuais.
                </p>
              </CardContent>
            </Card>
          ) : (
            sales.map((sale) => (
              <SalesTableRow
                key={sale.id}
                sale={sale}
                formatDate={formatDate}
                onViewSale={onViewSale}
                onViewReceipt={handleViewReceipt}
                onPrintReceipt={handlePrintReceipt}
                onDownloadPDF={handleDownloadPDF}
                onViewProfit={onViewProfit}
                variant="mobile"
              />
            ))
          )}
        </div>
      ) : (
        // Desktop/Tablet Table View
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {currentColumns.map((column) => (
                    <TableHead
                      key={column.id}
                      style={{
                        width: column.width,
                        minWidth: column.width
                      }}
                      className={`bg-white whitespace-nowrap ${column.align === "center"
                          ? "text-center"
                          : column.align === "right"
                            ? "text-right"
                            : ""
                        } ${column.className || ""}`}
                    >
                      {column.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      {currentColumns.map((column) => (
                        <TableCell
                          key={column.id}
                          style={{
                            width: column.width,
                            minWidth: column.width
                          }}
                          className="whitespace-nowrap"
                        >
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : sales.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={currentColumns.length}
                      className="text-center py-8"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Receipt className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Nenhuma venda encontrada
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map((sale) => (
                    <SalesTableRow
                      key={sale.id}
                      sale={sale}
                      formatDate={formatDate}
                      onViewSale={onViewSale}
                      onViewReceipt={handleViewReceipt}
                      onPrintReceipt={handlePrintReceipt}
                      onDownloadPDF={handleDownloadPDF}
                      onViewProfit={onViewProfit}
                      variant="desktop"
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Mostrando {(pagination.page - 1) * pagination.pageSize + 1} a{" "}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)}{" "}
            de {pagination.total} vendas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(pagination.page - 1)}
            disabled={pagination.page === 1 || loading}
            className="text-xs sm:text-sm"
          >
            Anterior
          </Button>
          <span className="text-sm whitespace-nowrap">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages || loading}
            className="text-xs sm:text-sm"
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}
