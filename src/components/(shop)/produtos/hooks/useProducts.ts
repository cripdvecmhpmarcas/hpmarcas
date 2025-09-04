import { useState, useCallback, useEffect } from "react";
import { useSupabasePublic } from "@/hooks/useSupabasePublic";
import type { Product } from "@/types/products";
import type { UseProductsReturn } from "../types";

export function useProducts(): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const { supabase } = useSupabasePublic();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("status", "active")
        .order("name");

      if (error) {
        throw new Error(`Erro ao carregar produtos: ${error.message}`);
      }

      const productsData = data || [];
      setProducts(productsData);

      // Extrair brands e categories únicos
      const uniqueBrands = [...new Set(productsData.map((p: Product) => p.brand))].sort();
      const uniqueCategories = [...new Set(productsData.map((p: Product) => p.category))].sort();

      setBrands(uniqueBrands as string[]);
      setCategories(uniqueCategories as string[]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido ao carregar produtos";
      setError(errorMessage);
      console.error("Erro ao carregar produtos:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const refreshProducts = useCallback(async () => {
    await fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    refreshProducts,
    brands,
    categories,
  };
}