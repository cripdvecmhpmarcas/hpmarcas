"use client";

import { useState, useCallback, useEffect } from "react";
import { useSupabasePublic } from "@/hooks/useSupabasePublic";
import type { ProductWithDetails, UseRelatedProductsReturn } from "../types";
import type { Tables } from "@/types/database";

export const useRelatedProducts = (
  category: string | undefined,
  excludeId: string | undefined
): UseRelatedProductsReturn => {
  const [relatedProducts, setRelatedProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { supabase } = useSupabasePublic();

  const fetchRelatedProducts = useCallback(async () => {
    if (!category || !excludeId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .eq("category", category)
        .eq("status", "active")
        .neq("id", excludeId)
        .limit(4);

      if (fetchError) throw fetchError;

      setRelatedProducts(
        (data || []).map((item: Tables<'products'>) => ({
          ...item,
          barcode: item.barcode || "",
        }))
      );
    } catch (err) {
      console.error("Erro ao carregar produtos relacionados:", err);
      setError("Erro ao carregar produtos relacionados");
      setRelatedProducts([]);
    } finally {
      setLoading(false);
    }
  }, [category, excludeId, supabase]);

  useEffect(() => {
    fetchRelatedProducts();
  }, [fetchRelatedProducts]);

  return {
    relatedProducts,
    loading,
    error,
  };
};
