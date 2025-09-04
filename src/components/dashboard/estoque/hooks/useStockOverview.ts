import { useState, useEffect, useCallback } from "react";
import { useSupabaseAdmin } from "@/hooks/useSupabaseAdmin";
import {
  StockStats,
  StockOverviewData,
  StockMovementWithProduct,
  LowStockProduct,
  CategoryStockData,
  ProfitForecast,
  getStockStatus,
} from "@/types/stock";

export type PricingMode = "retail" | "wholesale";

export interface UseStockOverviewReturn {
  data: StockOverviewData | null;
  loading: boolean;
  error: string | null;
  pricingMode: PricingMode;
  setPricingMode: (mode: PricingMode) => void;
  refreshData: () => Promise<void>;
}

export function useStockOverview(): UseStockOverviewReturn {
  const supabase = useSupabaseAdmin();
  const [data, setData] = useState<StockOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pricingMode, setPricingMode] = useState<PricingMode>("retail");

  const loadStats = useCallback(async (): Promise<StockStats> => {
    const { data: products } = await supabase
      .from("products")
      .select("stock, min_stock, cost, retail_price, wholesale_price, status")
      .eq("status", "active");

    if (!products) {
      throw new Error("Erro ao carregar produtos");
    }

    const today = new Date().toISOString().split("T")[0];
    const { count: movementsToday } = await supabase
      .from("stock_movements")
      .select("*", { count: "exact" })
      .gte("created_at", `${today}T00:00:00.000Z`)
      .lte("created_at", `${today}T23:59:59.999Z`);

    const productsInStock = products.filter(
      (p) => p.stock > p.min_stock
    ).length;
    const productsLowStock = products.filter(
      (p) => p.stock <= p.min_stock && p.stock > 0
    ).length;
    const productsOutOfStock = products.filter((p) => p.stock === 0).length;
    const totalStockValue = products.reduce(
      (sum, p) => sum + p.stock * p.cost,
      0
    );
    const totalStockQuantity = products.reduce((sum, p) => sum + p.stock, 0);

    // Calculate revenue and profit potentials based on pricing mode
    const currentPrice =
      pricingMode === "retail" ? "retail_price" : "wholesale_price";
    const totalRevenuePotential = products.reduce(
      (sum, p) => sum + p.stock * p[currentPrice],
      0
    );
    const totalProfitPotential = products.reduce(
      (sum, p) => sum + p.stock * (p[currentPrice] - p.cost),
      0
    );

    return {
      total_products: products.length,
      products_in_stock: productsInStock,
      products_low_stock: productsLowStock,
      products_out_of_stock: productsOutOfStock,
      total_stock_value: totalStockValue,
      total_stock_quantity: totalStockQuantity,
      movements_today: movementsToday || 0,
      low_stock_threshold: 10,
      total_revenue_potential: totalRevenuePotential,
      total_profit_potential: totalProfitPotential,
    };
  }, [pricingMode, supabase]);

  const loadRecentMovements = useCallback(async (): Promise<
    StockMovementWithProduct[]
  > => {
    const { data: movements } = await supabase
      .from("stock_movements")
      .select(
        `
        *,
        product:products!stock_movements_product_id_fkey (
          id,
          name,
          sku,
          brand,
          category,
          images
        )
      `
      )
      .order("created_at", { ascending: false })
      .limit(10);

    if (!movements) return [];

    return movements.map((movement) => ({
      ...movement,
      product: movement.product as {
        id: string;
        name: string;
        sku: string;
        brand: string;
        category: string;
        images: string[] | null;
      },
    }));
  }, [supabase]);

  const loadLowStockProducts = useCallback(async (): Promise<
    LowStockProduct[]
  > => {
    const { data: products } = await supabase
      .from("low_stock_products")
      .select("*")
      .order("units_needed", { ascending: false })
      .limit(20);

    if (!products) return [];

    return products
      .map((product) => {
        const status = getStockStatus(product.stock!, product.min_stock!);
        return {
          id: product.id!,
          name: product.name!,
          sku: product.sku!,
          brand: product.brand!,
          category: product.category!,
          current_stock: product.stock!,
          min_stock: product.min_stock!,
          units_needed: product.units_needed!,
          stock_status: status as "low_stock" | "out_of_stock",
          cost: product.cost!,
          retail_price: product.retail_price!,
          images: product.images,
        };
      })
      .filter(
        (product) =>
          product.stock_status === "low_stock" ||
          product.stock_status === "out_of_stock"
      );
  }, [supabase]);

  const loadCategoriesStock = useCallback(async (): Promise<
    CategoryStockData[]
  > => {
    const { data: products } = await supabase
      .from("products")
      .select("category, stock, min_stock, cost, status")
      .eq("status", "active");

    if (!products) return [];

    const categoryMap = products.reduce((acc, product) => {
      const category = product.category;
      if (!acc[category]) {
        acc[category] = {
          category,
          total_products: 0,
          products_in_stock: 0,
          products_low_stock: 0,
          products_out_of_stock: 0,
          stock_value: 0,
        };
      }

      acc[category].total_products++;
      acc[category].stock_value += product.stock * product.cost;

      if (product.stock === 0) {
        acc[category].products_out_of_stock++;
      } else if (product.stock <= product.min_stock) {
        acc[category].products_low_stock++;
      } else {
        acc[category].products_in_stock++;
      }

      return acc;
    }, {} as Record<string, CategoryStockData>);

    return Object.values(categoryMap).sort(
      (a, b) => b.stock_value - a.stock_value
    );
  }, [supabase]);

  const loadProfitForecast = useCallback(async (): Promise<
    ProfitForecast[]
  > => {
    const { data: products } = await supabase
      .from("products")
      .select(
        "id, name, sku, stock, cost, retail_price, wholesale_price, status"
      )
      .eq("status", "active")
      .gt("stock", 0)
      .order("stock", { ascending: false })
      .limit(20);

    if (!products) return [];

    return products.map((product) => {
      const revenueRetail = product.stock * product.retail_price;
      const revenueWholesale = product.stock * product.wholesale_price;
      const profitRetail =
        product.stock * (product.retail_price - product.cost);
      const profitWholesale =
        product.stock * (product.wholesale_price - product.cost);
      const marginRetail =
        ((product.retail_price - product.cost) / product.retail_price) * 100;
      const marginWholesale =
        ((product.wholesale_price - product.cost) / product.wholesale_price) *
        100;

      return {
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        current_stock: product.stock,
        cost_per_unit: product.cost,
        retail_price: product.retail_price,
        wholesale_price: product.wholesale_price,
        revenue_potential_retail: revenueRetail,
        revenue_potential_wholesale: revenueWholesale,
        profit_potential_retail: profitRetail,
        profit_potential_wholesale: profitWholesale,
        margin_retail: marginRetail,
        margin_wholesale: marginWholesale,
      };
    });
  }, [supabase]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        stats,
        recentMovements,
        lowStockProducts,
        categoriesStock,
        profitForecast,
      ] = await Promise.all([
        loadStats(),
        loadRecentMovements(),
        loadLowStockProducts(),
        loadCategoriesStock(),
        loadProfitForecast(),
      ]);

      setData({
        stats,
        recent_movements: recentMovements,
        low_stock_products: lowStockProducts,
        categories_stock: categoriesStock,
        profit_forecast: profitForecast,
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro ao carregar dados do estoque";
      setError(message);
      console.error("Erro ao carregar overview do estoque:", err);
    } finally {
      setLoading(false);
    }
  }, [
    loadStats,
    loadRecentMovements,
    loadLowStockProducts,
    loadCategoriesStock,
    loadProfitForecast,
  ]);

  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    pricingMode,
    setPricingMode,
    refreshData,
  };
}
