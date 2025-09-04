import { useState, useCallback } from "react";
import type { ProductListViewMode, UseProductViewReturn } from "../types";

export function useProductView(initialMode: ProductListViewMode = "grid"): UseProductViewReturn {
  const [viewMode, setViewModeState] = useState<ProductListViewMode>(initialMode);

  const setViewMode = useCallback((mode: ProductListViewMode) => {
    setViewModeState(mode);
  }, []);

  const toggleViewMode = useCallback(() => {
    setViewModeState(prev => prev === "grid" ? "list" : "grid");
  }, []);

  return {
    viewMode,
    setViewMode,
    toggleViewMode,
  };
}