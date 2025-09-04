import { useState, useEffect, useCallback } from "react";
import { useSupabaseAdmin } from "@/hooks/useSupabaseAdmin";
import { ProductFilters } from "@/types/products";

export interface UseProductFiltersReturn {
  filters: ProductFilters;
  availableBrands: string[];
  priceRange: {
    min: number;
    max: number;
  };
  loading: boolean;
  showAdvanced: boolean;
  setFilters: (filters: Partial<ProductFilters>) => void;
  resetFilters: () => void;
  clearFilter: (filterKey: keyof ProductFilters) => void;
  setShowAdvanced: (show: boolean) => void;
  applyQuickFilter: (
    type: "low_stock" | "out_of_stock" | "active" | "inactive"
  ) => void;
  getActiveFiltersCount: () => number;
  hasActiveFilters: () => boolean;
  exportFiltersState: () => string;
  importFiltersState: (state: string) => void;
}

const DEFAULT_FILTERS: ProductFilters = {
  search: "",
  category: "",
  subcategory_id: "",
  brand: "",
  status: "all",
  stock_status: "all",
};

const DEFAULT_PRICE_RANGE = {
  min: 0,
  max: 1000,
};

export function useProductFilters(
  onFiltersChange?: (filters: ProductFilters) => void
): UseProductFiltersReturn {
  const [filters, setFiltersState] = useState<ProductFilters>(DEFAULT_FILTERS);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState(DEFAULT_PRICE_RANGE);
  const [loading, setLoading] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Cliente Supabase
  const supabase = useSupabaseAdmin();

  // Call onFiltersChange when filters change (avoiding setState during render)
  useEffect(() => {
    onFiltersChange?.(filters);
  }, [filters, onFiltersChange]);

  // Load available brands and price range from database
  const loadFilterOptions = useCallback(async () => {
    try {
      setLoading(true);

      // Get all products to extract unique brands and price range
      const { data: products, error } = await supabase
        .from("products")
        .select("brand, retail_price")
        .eq("status", "active");

      if (error) {
        console.error("Error fetching products for filters:", error);
        return;
      }

      if (products && products.length > 0) {
        // Extract unique brands, filtering out null/empty values
        const brands = [
          ...new Set(products.map((p: { brand: string }) => p.brand)),
        ]
          .filter((brand: string) => brand && brand.trim() !== "")
          .sort() as string[];
        setAvailableBrands(brands);

        // Calculate price range from valid prices
        const prices = products
          .map((p: { retail_price: number }) => p.retail_price)
          .filter((price: number) => price && price > 0);

        if (prices.length > 0) {
          setPriceRange({
            min: Math.floor(Math.min(...prices)),
            max: Math.ceil(Math.max(...prices)),
          });
        }
      }
    } catch (error) {
      console.error("Error loading filter options:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Set filters with callback and validation
  const setFilters = useCallback(
    (newFilters: Partial<ProductFilters>) => {
      setFiltersState((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  // Clear specific filter
  const clearFilter = useCallback(
    (filterKey: keyof ProductFilters) => {
      setFiltersState((prev) => {
        const updated = { ...prev };

        // Reset specific filter to default value
        switch (filterKey) {
          case "search":
          case "category":
          case "subcategory_id":
          case "brand":
            updated[filterKey] = "";
            break;
          case "status":
          case "stock_status":
            updated[filterKey] = "all";
            break;
          case "price_range":
            updated[filterKey] = undefined;
            break;
        }

        return updated;
      });
    },
    []
  );

  // Apply quick filters
  const applyQuickFilter = useCallback(
    (type: "low_stock" | "out_of_stock" | "active" | "inactive") => {
      const quickFilters: Partial<ProductFilters> = {};

      switch (type) {
        case "low_stock":
          quickFilters.stock_status = "low_stock";
          quickFilters.status = "all";
          break;
        case "out_of_stock":
          quickFilters.stock_status = "out_of_stock";
          quickFilters.status = "all";
          break;
        case "active":
          quickFilters.status = "active";
          quickFilters.stock_status = "all";
          break;
        case "inactive":
          quickFilters.status = "inactive";
          quickFilters.stock_status = "all";
          break;
      }

      setFilters(quickFilters);
    },
    [setFilters]
  );

  // Get count of active filters
  const getActiveFiltersCount = useCallback((): number => {
    let count = 0;

    if (filters.search && filters.search.trim()) count++;
    if (filters.category && filters.category !== "") count++;
    if (filters.subcategory_id && filters.subcategory_id !== "") count++;
    if (filters.brand && filters.brand !== "") count++;
    if (filters.status && filters.status !== "all") count++;
    if (filters.stock_status && filters.stock_status !== "all") count++;
    if (filters.price_range) count++;

    return count;
  }, [filters]);

  // Check if has active filters
  const hasActiveFilters = useCallback((): boolean => {
    return getActiveFiltersCount() > 0;
  }, [getActiveFiltersCount]);

  // Export filters state to string (for URL params or storage)
  const exportFiltersState = useCallback((): string => {
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value && value !== "" && value !== "all") {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, unknown>);

    return btoa(JSON.stringify(cleanFilters));
  }, [filters]);

  // Import filters state from string
  const importFiltersState = useCallback(
    (state: string) => {
      try {
        const imported = JSON.parse(atob(state));

        // Validate imported data structure
        if (typeof imported !== "object" || imported === null) {
          throw new Error("Invalid filters format");
        }

        // Create validated filters object
        const validFilters: ProductFilters = { ...DEFAULT_FILTERS };

        // Only apply valid properties with proper validation
        if (typeof imported.search === "string") {
          validFilters.search = imported.search;
        }
        if (typeof imported.category === "string") {
          validFilters.category = imported.category;
        }
        if (typeof imported.subcategory_id === "string") {
          validFilters.subcategory_id = imported.subcategory_id;
        }
        if (typeof imported.brand === "string") {
          validFilters.brand = imported.brand;
        }
        if (["all", "active", "inactive"].includes(imported.status)) {
          validFilters.status = imported.status;
        }
        if (
          ["all", "low_stock", "out_of_stock", "in_stock"].includes(
            imported.stock_status
          )
        ) {
          validFilters.stock_status = imported.stock_status;
        }
        if (
          imported.price_range &&
          typeof imported.price_range.min === "number" &&
          typeof imported.price_range.max === "number"
        ) {
          validFilters.price_range = imported.price_range;
        }

        setFiltersState(validFilters);
        onFiltersChange?.(validFilters);
      } catch (error) {
        console.warn("Invalid filters state:", error);
      }
    },
    [onFiltersChange]
  );

  // Load filter options on mount
  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  // Load filters from localStorage on mount (only once)
  useEffect(() => {
    const saved = localStorage.getItem("productFilters");
    if (saved) {
      try {
        const savedFilters = JSON.parse(saved);
        // Validate saved filters before applying
        const validFilters = { ...DEFAULT_FILTERS };

        // Only apply valid filter properties
        Object.keys(savedFilters).forEach((key) => {
          if (
            key in DEFAULT_FILTERS &&
            savedFilters[key] !== null &&
            savedFilters[key] !== undefined
          ) {
            validFilters[key as keyof ProductFilters] = savedFilters[key];
          }
        });

        setFiltersState(validFilters);
        onFiltersChange?.(validFilters);
      } catch (error) {
        console.warn("Invalid saved filters, using defaults:", error);
        localStorage.removeItem("productFilters");
      }
    }
  }, [onFiltersChange]);

  // Save filters to localStorage (with debounce effect)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (hasActiveFilters()) {
        localStorage.setItem("productFilters", JSON.stringify(filters));
      } else {
        localStorage.removeItem("productFilters");
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [filters, hasActiveFilters]);

  return {
    filters,
    availableBrands,
    priceRange,
    loading,
    showAdvanced,
    setFilters,
    resetFilters,
    clearFilter,
    setShowAdvanced,
    applyQuickFilter,
    getActiveFiltersCount,
    hasActiveFilters,
    exportFiltersState,
    importFiltersState,
  };
}
