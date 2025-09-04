import { useState, useEffect, useCallback } from "react";
import { useSupabaseCustomer } from "@/hooks/useSupabaseCustomer";
import { Tables } from "@/types/database";
import { toast } from "sonner";

type Sale = Tables<"sales">;

interface UseCustomerOrdersOptions {
  customerId?: string;
  filters?: {
    status: string;
    period: string;
    search: string;
  };
  limit?: number;
}

interface UseCustomerOrdersReturn {
  orders: Sale[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  loadingMore: boolean;
  refreshOrders: () => Promise<void>;
}

export function useCustomerOrders({
  customerId,
  filters = { status: "all", period: "all", search: "" },
  limit = 10,
}: UseCustomerOrdersOptions = {}): UseCustomerOrdersReturn {
  const [orders, setOrders] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const supabase = useSupabaseCustomer();

  const buildQuery = useCallback(() => {
    let query = supabase
      .from("sales")
      .select("*")
      .eq("customer_id", customerId!)
      .order("created_at", { ascending: false });

    // Filtro por status
    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    // Filtro por período
    if (filters.period && filters.period !== "all") {
      const now = new Date();
      let startDate: Date;

      switch (filters.period) {
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "3months":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case "year":
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }

      query = query.gte("created_at", startDate.toISOString());
    }

    // Filtro por busca (número do pedido)
    if (filters.search && filters.search.trim()) {
      query = query.ilike("id", `%${filters.search.trim()}%`);
    }

    return query;
  }, [supabase, customerId, filters]);

  const fetchOrders = useCallback(async (isLoadMore = false) => {
    if (!customerId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      if (!isLoadMore) {
        setLoading(true);
        setError(null);
        setOffset(0);
      } else {
        setLoadingMore(true);
      }

      const currentOffset = isLoadMore ? offset : 0;
      const query = buildQuery()
        .range(currentOffset, currentOffset + limit - 1);

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      const newOrders = data || [];

      if (isLoadMore) {
        setOrders(prev => [...prev, ...newOrders]);
        setOffset(prev => prev + limit);
      } else {
        setOrders(newOrders);
        setOffset(limit);
      }

      // Verificar se há mais pedidos
      setHasMore(newOrders.length === limit);
    } catch (err) {
      console.error("Erro ao buscar pedidos:", err);
      setError("Erro ao carregar pedidos");
      toast.error("Erro ao carregar pedidos");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [customerId, buildQuery, limit, offset]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchOrders(true);
    }
  }, [loadingMore, hasMore, fetchOrders]);

  const refreshOrders = useCallback(async () => {
    await fetchOrders(false);
  }, [fetchOrders]);

  // Carregar pedidos quando filtros ou customerId mudarem
  // Removemos fetchOrders das dependências para evitar loop infinito
  useEffect(() => {
    if (customerId) {
      const loadInitialOrders = async () => {
        try {
          setLoading(true);
          setError(null);
          setOffset(0);

          const query = buildQuery()
            .range(0, limit - 1);

          const { data, error: fetchError } = await query;

          if (fetchError) {
            throw fetchError;
          }

          const newOrders = data || [];
          setOrders(newOrders);
          setOffset(limit);
          setHasMore(newOrders.length === limit);
        } catch (err) {
          console.error("Erro ao buscar pedidos:", err);
          setError("Erro ao carregar pedidos");
          toast.error("Erro ao carregar pedidos");
        } finally {
          setLoading(false);
        }
      };

      loadInitialOrders();
    } else {
      setOrders([]);
      setLoading(false);
    }
  }, [filters, customerId, buildQuery, limit]);

  return {
    orders,
    loading,
    error,
    hasMore,
    loadMore,
    loadingMore,
    refreshOrders,
  };
}
