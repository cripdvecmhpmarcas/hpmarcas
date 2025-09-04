import { useState, useCallback, useMemo } from "react";
import { useAnonymousAuth } from "@/components/auth/AnonymousAuthProvider";
import type { Product } from "@/types/products";
import type { 
  ProductListFilters, 
  ProductDisplayItem, 
  UseProductFiltersReturn
} from "../types";
import { DEFAULT_FILTERS } from "../types";

export function useProductFilters(products: Product[]): UseProductFiltersReturn {
  const [filters, setFiltersState] = useState<ProductListFilters>(DEFAULT_FILTERS);
  const { customer } = useAnonymousAuth();

  const setFilters = useCallback((newFilters: Partial<ProductListFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'sortBy') return value !== 'name';
      return value !== '';
    });
  }, [filters]);

  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'sortBy') return value !== 'name';
      return value !== '';
    }).length;
  }, [filters]);

  const getPrice = useCallback((product: Product) => {
    return customer?.type === "wholesale" 
      ? product.wholesale_price 
      : product.retail_price;
  }, [customer]);

  const getStockStatus = useCallback((stock: number): "in_stock" | "low_stock" | "out_of_stock" => {
    if (stock === 0) return "out_of_stock";
    if (stock <= 5) return "low_stock";
    return "in_stock";
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Filtro de busca
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.brand.toLowerCase().includes(searchTerm) ||
          product.sku.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm)
      );
    }

    // Filtro de marca
    if (filters.brand) {
      filtered = filtered.filter((product) => product.brand === filters.brand);
    }

    // Filtro de subcategoria (novo)
    if (filters.subcategory_id) {
      filtered = filtered.filter(
        (product) => product.subcategory_id === filters.subcategory_id
      );
    }

    // Filtro de categoria (legacy)
    if (filters.category) {
      filtered = filtered.filter(
        (product) => product.category === filters.category
      );
    }

    // Filtro de preço
    if (filters.minPrice || filters.maxPrice) {
      filtered = filtered.filter((product) => {
        const price = getPrice(product);
        const min = filters.minPrice ? parseFloat(filters.minPrice) : 0;
        const max = filters.maxPrice ? parseFloat(filters.maxPrice) : Infinity;
        return price >= min && price <= max;
      });
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "price_asc":
          return getPrice(a) - getPrice(b);
        case "price_desc":
          return getPrice(b) - getPrice(a);
        case "name":
          return a.name.localeCompare(b.name);
        case "brand":
          return a.brand.localeCompare(b.brand);
        default:
          return 0;
      }
    });

    // Mapear para ProductDisplayItem com campos calculados
    return filtered.map((product): ProductDisplayItem => {
      const displayPrice = getPrice(product);
      const originalPrice = product.retail_price;
      const isWholesale = customer?.type === "wholesale" && displayPrice !== originalPrice;
      const hasDiscount = isWholesale;
      const discountPercent = hasDiscount 
        ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
        : 0;

      return {
        ...product,
        displayPrice,
        originalPrice,
        hasDiscount,
        discountPercent,
        isWholesale,
        stockStatus: getStockStatus(product.stock),
      };
    });
  }, [products, filters, getPrice, getStockStatus, customer]);

  return {
    filteredProducts,
    filters,
    setFilters,
    clearFilters,
    hasActiveFilters,
    activeFiltersCount,
  };
}