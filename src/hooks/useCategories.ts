"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSupabaseAdmin } from "./useSupabaseAdmin";
import { Category, CategoryHierarchy, CategoryOption } from "@/types/products";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useSupabaseAdmin();

  // Fetch all categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });

      if (fetchError) throw fetchError;

      setCategories(data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError(
        err instanceof Error ? err.message : "Erro ao carregar categorias"
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Build hierarchical structure
  const categoryHierarchy = useMemo((): CategoryHierarchy[] => {
    const categoryMap = new Map<string, CategoryHierarchy>();
    const rootCategories: CategoryHierarchy[] = [];

    // Create map of all categories
    categories.forEach((cat) => {
      categoryMap.set(cat.id, {
        ...cat,
        full_path: cat.name,
        level: 0,
        subcategories: [],
      });
    });

    // Build hierarchy
    categories.forEach((cat) => {
      const categoryItem = categoryMap.get(cat.id)!;

      if (cat.parent_id) {
        const parent = categoryMap.get(cat.parent_id);
        if (parent) {
          categoryItem.parent_name = parent.name;
          categoryItem.parent_slug = parent.slug;
          categoryItem.full_path = `${parent.name} > ${cat.name}`;
          categoryItem.level = 1;
          parent.subcategories!.push(categoryItem);
        }
      } else {
        rootCategories.push(categoryItem);
      }
    });

    return rootCategories.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [categories]);

  // Get main categories (no parent)
  const mainCategories = useMemo(
    () =>
      categories
        .filter((cat) => !cat.parent_id && (cat.is_active ?? true))
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    [categories]
  );

  // Get subcategories for a parent category
  const getSubcategories = useCallback(
    (parentId: string) =>
      categories
        .filter((cat) => cat.parent_id === parentId && (cat.is_active ?? true))
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    [categories]
  );

  // Get category options for dropdowns
  const categoryOptions = useMemo((): CategoryOption[] => {
    const options: CategoryOption[] = [];

    categoryHierarchy.forEach((mainCat) => {
      // Add main category
      options.push({
        value: mainCat.id,
        label: mainCat.name,
      });

      // Add subcategories
      mainCat.subcategories?.forEach((subCat) => {
        options.push({
          value: subCat.id,
          label: `→ ${subCat.name}`,
          parent: mainCat.id,
        });
      });
    });

    return options;
  }, [categoryHierarchy]);

  // Get category by ID
  const getCategoryById = useCallback(
    (id: string) => categories.find((cat) => cat.id === id),
    [categories]
  );

  // Get full category path
  const getCategoryPath = useCallback(
    (categoryId: string): string => {
      const category = categories.find((cat) => cat.id === categoryId);
      if (!category) return "";

      if (category.parent_id) {
        const parent = categories.find((cat) => cat.id === category.parent_id);
        if (parent) {
          return `${parent.name} > ${category.name}`;
        }
      }

      return category.name;
    },
    [categories]
  );

  // Create new category
  const createCategory = useCallback(
    async (
      categoryData: Omit<Category, "id" | "created_at" | "updated_at">
    ) => {
      try {
        const { data, error } = await supabase
          .from("categories")
          .insert([categoryData])
          .select()
          .single();

        if (error) throw error;

        await fetchCategories(); // Refresh
        return data;
      } catch (err) {
        console.error("Error creating category:", err);
        throw err;
      }
    },
    [supabase, fetchCategories]
  );

  // Update category
  const updateCategory = useCallback(
    async (id: string, updates: Partial<Category>) => {
      try {
        const { data, error } = await supabase
          .from("categories")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;

        await fetchCategories(); // Refresh
        return data;
      } catch (err) {
        console.error("Error updating category:", err);
        throw err;
      }
    },
    [supabase, fetchCategories]
  );

  // Delete category
  const deleteCategory = useCallback(
    async (id: string) => {
      try {
        // Check if category has products
        const { count } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("subcategory_id", id);

        if (count && count > 0) {
          throw new Error(
            "Não é possível excluir categoria com produtos associados"
          );
        }

        const { error } = await supabase
          .from("categories")
          .delete()
          .eq("id", id);

        if (error) throw error;

        await fetchCategories(); // Refresh
      } catch (err) {
        console.error("Error deleting category:", err);
        throw err;
      }
    },
    [supabase, fetchCategories]
  );

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    categoryHierarchy,
    mainCategories,
    categoryOptions,
    loading,
    error,
    getSubcategories,
    getCategoryById,
    getCategoryPath,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}
