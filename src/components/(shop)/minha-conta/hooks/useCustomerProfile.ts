import { useState, useEffect, useCallback } from "react";
import { useSupabaseCustomer } from "@/hooks/useSupabaseCustomer";
import { useCustomerAuth } from "@/components/auth/CustomerAuthProvider";
import { Tables, TablesUpdate } from "@/types/database";
import { toast } from "sonner";

type Customer = Tables<"customers">;
type CustomerUpdate = TablesUpdate<"customers">;

interface UseCustomerProfileReturn {
  profile: Customer | null;
  loading: boolean;
  error: string | null;
  updateProfile: (data: CustomerUpdate) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useCustomerProfile(): UseCustomerProfileReturn {
  const [profile, setProfile] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useCustomerAuth();
  const supabase = useSupabaseCustomer();

  const fetchProfile = useCallback(async () => {
    if (!user?.customerProfile?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("customers")
        .select("*")
        .eq("id", user.customerProfile.id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      setProfile(data);
    } catch (err) {
      console.error("Erro ao buscar perfil:", err);
      setError("Erro ao carregar dados do perfil");
      toast.error("Erro ao carregar dados do perfil");
    } finally {
      setLoading(false);
    }
  }, [user?.customerProfile?.id, supabase]);

  const updateProfile = useCallback(async (data: CustomerUpdate) => {
    if (!user?.customerProfile?.id) {
      throw new Error("Usuário não identificado");
    }

    try {
      setLoading(true);
      setError(null);

      const { data: updatedData, error: updateError } = await supabase
        .from("customers")
        .update(data)
        .eq("id", user.customerProfile.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setProfile(updatedData);
      toast.success("Perfil atualizado com sucesso!");
    } catch (err) {
      console.error("Erro ao atualizar perfil:", err);
      setError("Erro ao atualizar perfil");
      toast.error("Erro ao atualizar perfil");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.customerProfile?.id, supabase]);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile,
  };
}