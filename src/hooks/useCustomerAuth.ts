// hooks/useCustomerAuth.ts
import { useState, useEffect, useCallback } from "react";
import { User, AuthError } from "@supabase/supabase-js";
import { useSupabaseCustomer } from "@/hooks/useSupabaseCustomer";
import { useRouter } from "next/navigation";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cpf_cnpj: string | null;
  type: "retail" | "wholesale";
  discount: number;
  status: "active" | "inactive";
  total_purchases: number;
  total_spent: number;
  last_purchase: string | null;
}

interface UserData {
  name?: string;
  phone?: string;
  cpf_cnpj?: string;
  acceptMarketing?: boolean;
}

interface UseCustomerAuthReturn {
  user: User | null;
  customer: Customer | null;
  loading: boolean;
  signInWithEmail: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    userData?: UserData
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

export const useCustomerAuth = (): UseCustomerAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Cliente Supabase para customer
  const supabase = useSupabaseCustomer();


  // Buscar ou criar dados do cliente
  const fetchOrCreateCustomer = useCallback(async (authUser: User) => {
    if (!authUser) return null;

    try {
      // Primeiro, tentar buscar cliente existente
      const { data: existingCustomer, error } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", authUser.id)
        .single();

      if (error && error.code !== "PGRST116") {
        // Erro diferente de "não encontrado"
        console.error("Erro ao buscar cliente:", error);
        return null;
      }

      if (!existingCustomer) {
        // Criar novo cliente
        const newCustomerData = {
          id: authUser.id,
          user_id: authUser.id,
          name:
            authUser.user_metadata?.name || authUser.email || "Cliente Anônimo",
          email: authUser.email || null,
          phone: authUser.user_metadata?.phone || null,
          cpf_cnpj: null,
          type: "retail" as const,
          discount: 0,
          status: "active" as const,
          total_purchases: 0,
          total_spent: 0,
        };

        const { data: newCustomer, error: createError } = await supabase
          .from("customers")
          .insert(newCustomerData)
          .select()
          .single();

        if (createError) {
          console.error("Erro ao criar cliente:", createError);
          return null;
        }

        if (newCustomer) {
          const customerData: Customer = {
            ...newCustomer,
              type: (newCustomer.type === "wholesale"
              ? "wholesale"
              : "retail") as "retail" | "wholesale",
            status: (newCustomer.status === "inactive"
              ? "inactive"
              : "active") as "active" | "inactive",
            discount: newCustomer.discount || 0,
            total_purchases: newCustomer.total_purchases || 0,
            total_spent: newCustomer.total_spent || 0,
          };
          setCustomer(customerData);
          return customerData;
        }
      } else {
        // Cliente existente
        const customerData: Customer = {
          ...existingCustomer,
          type: (existingCustomer.type === "wholesale"
            ? "wholesale"
            : "retail") as "retail" | "wholesale",
          status: (existingCustomer.status === "inactive"
            ? "inactive"
            : "active") as "active" | "inactive",
          discount: existingCustomer.discount || 0,
          total_purchases: existingCustomer.total_purchases || 0,
          total_spent: existingCustomer.total_spent || 0,
        };
        setCustomer(customerData);
        return customerData;
      }

      return null;
    } catch (error) {
      console.error("Erro ao processar cliente:", error);
      return null;
    }
  }, [supabase]);

  // Inicializar autenticação
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Verificar sessão existente
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Erro ao obter sessão:", error);
        }

        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            await fetchOrCreateCustomer(session.user);
          } else {
            // Para usuários não autenticados, não fazemos nada
            console.log('Usuário não autenticado');
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("Erro na inicialização:", error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // console.log("Auth state change:", event, session?.user?.is_anonymous);

      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        await fetchOrCreateCustomer(session.user);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setCustomer(null);
      } else if (event === "USER_UPDATED" && session?.user) {
        setUser(session.user);
        await fetchOrCreateCustomer(session.user);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchOrCreateCustomer, supabase.auth]);


  // Login com email/senha
  const signInWithEmail = async (
    email: string,
    password: string
  ): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Erro no login email:", error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error("Erro no login email:", error);
      return { error: error as AuthError };
    }
  };

  // Cadastro
  const signUp = async (
    email: string,
    password: string,
    userData?: UserData
  ): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData || {},
        },
      });

      if (error) {
        console.error("Erro no cadastro:", error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error("Erro no cadastro:", error);
      return { error: error as AuthError };
    }
  };


  // Logout
  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setCustomer(null);

      // Limpar dados locais
      localStorage.removeItem("cart");

      router.push("/");
    } catch (error) {
      console.error("Erro no logout:", error);
    }
  };

  return {
    user,
    customer,
    loading,
    signInWithEmail,
    signUp,
    signOut,
  };
};
