"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSupabasePublic } from "@/hooks/useSupabasePublic";
import type { UseProductReturn, ProductWithDetails } from "../types";

export const useProduct = (productId: string): UseProductReturn => {
  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { supabase } = useSupabasePublic();

  const fetchProduct = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .eq("status", "active")
          .single();

        if (fetchError) {
          if (fetchError.code === "PGRST116") {
            // Produto não encontrado
            router.push("/produtos");
            return;
          }
          throw fetchError;
        }

        setProduct({
          ...data,
          barcode: data.barcode || "",
        });
      } catch (err) {
        console.error("Erro ao carregar produto:", err);
        setError("Erro ao carregar produto");
        router.push("/produtos");
      } finally {
        setLoading(false);
      }
    },
    [router, supabase]
  );

  const refreshProduct = useCallback(async () => {
    if (productId) {
      await fetchProduct(productId);
    }
  }, [productId, fetchProduct]);

  useEffect(() => {
    if (productId) {
      fetchProduct(productId);
    }
  }, [productId, fetchProduct]);

  return {
    product,
    loading,
    error,
    refreshProduct,
  };
};
