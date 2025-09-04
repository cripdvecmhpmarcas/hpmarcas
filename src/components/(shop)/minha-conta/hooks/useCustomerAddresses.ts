import { useState, useEffect, useCallback } from "react";
import { useSupabaseCustomer } from "@/hooks/useSupabaseCustomer";
import { useCustomerAuth } from "@/components/auth/CustomerAuthProvider";
import { Tables, TablesInsert, TablesUpdate } from "@/types/database";
import { toast } from "sonner";

type CustomerAddress = Tables<"customer_addresses">;
type CustomerAddressInsert = TablesInsert<"customer_addresses">;
type CustomerAddressUpdate = TablesUpdate<"customer_addresses">;

interface UseCustomerAddressesReturn {
  addresses: CustomerAddress[];
  loading: boolean;
  error: string | null;
  createAddress: (data: Omit<CustomerAddressInsert, "customer_id">) => Promise<void>;
  updateAddress: (id: string, data: CustomerAddressUpdate) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  refreshAddresses: () => Promise<void>;
}

export function useCustomerAddresses(): UseCustomerAddressesReturn {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useCustomerAuth();
  const supabase = useSupabaseCustomer();

  const fetchAddresses = useCallback(async () => {
    if (!user?.customerProfile?.id) {
      setAddresses([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("customer_addresses")
        .select("*")
        .eq("customer_id", user.customerProfile.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setAddresses(data || []);
    } catch (err) {
      console.error("Erro ao buscar endereços:", err);
      setError("Erro ao carregar endereços");
      toast.error("Erro ao carregar endereços");
    } finally {
      setLoading(false);
    }
  }, [user?.customerProfile?.id, supabase]);

  const createAddress = useCallback(async (data: Omit<CustomerAddressInsert, "customer_id">) => {
    if (!user?.customerProfile?.id) {
      throw new Error("Usuário não identificado");
    }

    try {
      setLoading(true);
      setError(null);

      // Se é o primeiro endereço ou está marcado como padrão
      const isFirstAddress = addresses.length === 0;
      const shouldBeDefault = data.is_default || isFirstAddress;

      // Se vai ser o endereço padrão, remover padrão dos outros
      if (shouldBeDefault) {
        await supabase
          .from("customer_addresses")
          .update({ is_default: false })
          .eq("customer_id", user.customerProfile.id);
      }

      const addressData: CustomerAddressInsert = {
        ...data,
        customer_id: user.customerProfile.id,
        is_default: shouldBeDefault,
      };

      const { data: newAddress, error: createError } = await supabase
        .from("customer_addresses")
        .insert(addressData)
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      setAddresses(prev => [newAddress, ...prev.map(addr => ({ ...addr, is_default: false }))]);
      toast.success("Endereço adicionado com sucesso!");
    } catch (err) {
      console.error("Erro ao criar endereço:", err);
      setError("Erro ao adicionar endereço");
      toast.error("Erro ao adicionar endereço");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.customerProfile?.id, supabase, addresses.length]);

  const updateAddress = useCallback(async (id: string, data: CustomerAddressUpdate) => {
    if (!user?.customerProfile?.id) {
      throw new Error("Usuário não identificado");
    }

    try {
      setLoading(true);
      setError(null);

      // Se está marcando como padrão, remover padrão dos outros
      if (data.is_default) {
        await supabase
          .from("customer_addresses")
          .update({ is_default: false })
          .eq("customer_id", user.customerProfile.id)
          .neq("id", id);
      }

      const { data: updatedAddress, error: updateError } = await supabase
        .from("customer_addresses")
        .update(data)
        .eq("id", id)
        .eq("customer_id", user.customerProfile.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setAddresses(prev => 
        prev.map(addr => {
          if (addr.id === id) {
            return updatedAddress;
          }
          // Se o endereço atualizado virou padrão, remover padrão dos outros
          return data.is_default ? { ...addr, is_default: false } : addr;
        }).sort((a, b) => {
          if (a.is_default && !b.is_default) return -1;
          if (!a.is_default && b.is_default) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        })
      );
      
      toast.success("Endereço atualizado com sucesso!");
    } catch (err) {
      console.error("Erro ao atualizar endereço:", err);
      setError("Erro ao atualizar endereço");
      toast.error("Erro ao atualizar endereço");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.customerProfile?.id, supabase]);

  const deleteAddress = useCallback(async (id: string) => {
    if (!user?.customerProfile?.id) {
      throw new Error("Usuário não identificado");
    }

    try {
      setLoading(true);
      setError(null);

      const addressToDelete = addresses.find(addr => addr.id === id);
      
      const { error: deleteError } = await supabase
        .from("customer_addresses")
        .delete()
        .eq("id", id)
        .eq("customer_id", user.customerProfile.id);

      if (deleteError) {
        throw deleteError;
      }

      const remainingAddresses = addresses.filter(addr => addr.id !== id);
      
      // Se o endereço deletado era o padrão e há outros endereços, tornar o primeiro como padrão
      if (addressToDelete?.is_default && remainingAddresses.length > 0) {
        const firstAddress = remainingAddresses[0];
        await supabase
          .from("customer_addresses")
          .update({ is_default: true })
          .eq("id", firstAddress.id);
        
        firstAddress.is_default = true;
      }

      setAddresses(remainingAddresses);
      toast.success("Endereço removido com sucesso!");
    } catch (err) {
      console.error("Erro ao deletar endereço:", err);
      setError("Erro ao remover endereço");
      toast.error("Erro ao remover endereço");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.customerProfile?.id, supabase, addresses]);

  const setDefaultAddress = useCallback(async (id: string) => {
    await updateAddress(id, { is_default: true });
  }, [updateAddress]);

  const refreshAddresses = useCallback(async () => {
    await fetchAddresses();
  }, [fetchAddresses]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  return {
    addresses,
    loading,
    error,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    refreshAddresses,
  };
}