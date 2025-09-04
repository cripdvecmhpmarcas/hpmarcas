"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { User, AuthError } from "@supabase/supabase-js";
import { useSupabaseAdmin } from "@/hooks/useSupabaseAdmin";

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: "admin" | "cashier" | "stockist";
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  profile: AdminProfile | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
}

interface UseAdminAuthReturn {
  user: User | null;
  profile: AdminProfile | null;
  loading: boolean;
  isAdmin: boolean;
  initialized: boolean;
  error: string | null;
  signInWithEmail: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | string | null }>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAdminAuth = (): UseAdminAuthReturn => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    initialized: false,
    error: null
  });

  const mountedRef = useRef(true);
  const initializingRef = useRef(false);
  const processingAuthChangeRef = useRef(false); // Evitar processamentos concorrentes
  const lastEventRef = useRef<{ event: string; userId: string | null; timestamp: number } | null>(null);

  // Cliente Supabase para admin
  const supabase = useSupabaseAdmin();

  // Verificar se usuário é admin válido
  const isAdmin = authState.profile?.status === "active" &&
                  (authState.profile?.role === "admin" ||
                   authState.profile?.role === "cashier" ||
                   authState.profile?.role === "stockist");

  // Verificar se o evento é redundante
  const isRedundantEvent = useCallback((event: string, userId: string | null) => {
    if (!lastEventRef.current) return false;

    const now = Date.now();
    const timeDiff = now - lastEventRef.current.timestamp;

    // Se o mesmo evento para o mesmo usuário aconteceu há menos de 1 segundo, é redundante
    return (
      lastEventRef.current.event === event &&
      lastEventRef.current.userId === userId &&
      timeDiff < 1000
    );
  }, []);

  // Atualizar referência do último evento
  const updateLastEvent = useCallback((event: string, userId: string | null) => {
    lastEventRef.current = {
      event,
      userId,
      timestamp: Date.now()
    };
  }, []);

  // Buscar perfil do administrador com melhor tratamento de erro
  const fetchAdminProfile = useCallback(async (authUser: User): Promise<AdminProfile | null> => {
    if (!authUser) {
      return null;
    }

    try {
      const userMetadata = authUser.user_metadata;

      if (userMetadata && userMetadata.role && userMetadata.name) {
        const adminProfile: AdminProfile = {
          id: authUser.id,
          name: userMetadata.name,
          email: authUser.email || "",
          role: userMetadata.role as "admin" | "cashier" | "stockist",
          status: "active", // Assumir ativo se está no metadata
          created_at: authUser.created_at,
          updated_at: authUser.updated_at || authUser.created_at,
        };

        return adminProfile;
      }

      // Se não há dados no metadata, buscar na tabela profiles
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          console.log("Profile não encontrado para usuário:", authUser.id);
          return null;
        }
        console.error("Erro ao buscar profile:", error);
        throw new Error("Erro ao verificar permissões administrativas");
      }

      if (profileData) {
        const adminProfile: AdminProfile = {
          id: profileData.id,
          name: profileData.name,
          email: profileData.email,
          role: profileData.role as "admin" | "cashier" | "stockist",
          status: profileData.status as "active" | "inactive",
          created_at: profileData.created_at,
          updated_at: profileData.updated_at,
        };

        // Verificar se o profile está ativo
        if (adminProfile.status !== "active") {
          return null;
        }

        return adminProfile;
      }

      return null;
    } catch (error) {
      console.error("Erro ao processar profile:", error);
      throw error;
    }
  }, [supabase]);

  // Atualizar estado de forma atômica com debounce
  const updateAuthState = useCallback((updates: Partial<AuthState> | ((prev: AuthState) => Partial<AuthState>)) => {
    if (typeof updates === 'function') {
      setAuthState(prev => ({ ...prev, ...updates(prev) }));
    } else {
      setAuthState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  // Inicializar autenticação com melhor controle de estado
  useEffect(() => {
    if (initializingRef.current) return;
    initializingRef.current = true;

    const initializeAuth = async () => {
      try {
        updateAuthState({ loading: true, error: null });

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Erro ao obter sessão:", error);
          updateAuthState({
            loading: false,
            initialized: true,
            error: "Erro ao verificar sessão"
          });
          return;
        }

        if (session?.user && !session.user.is_anonymous) {
          try {
            const profile = await fetchAdminProfile(session.user);
            updateAuthState({
              user: session.user,
              profile,
              loading: false,
              initialized: true,
              error: null
            });
          } catch (profileError) {
            console.error("Erro ao carregar profile:", profileError);
            updateAuthState({
              user: session.user,
              profile: null,
              loading: false,
              initialized: true,
              error: profileError instanceof Error ? profileError.message : "Erro ao carregar perfil"
            });
          }
        } else {
          updateAuthState({
            user: null,
            profile: null,
            loading: false,
            initialized: true,
            error: null
          });
        }
      } catch (error) {
        console.error("Erro na inicialização:", error);
        updateAuthState({
          loading: false,
          initialized: true,
          error: "Erro na inicialização do sistema"
        });
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current || processingAuthChangeRef.current) return;

      const userId = session?.user?.id || null;

      if (isRedundantEvent(event, userId)) {
        return;
      }

      updateLastEvent(event, userId);

      if (event === 'SIGNED_IN' && authState.user?.id === userId) {
        return;
      }

      processingAuthChangeRef.current = true;

      try {
        if (event === "SIGNED_OUT") {
          updateAuthState({
            user: null,
            profile: null,
            loading: false,
            initialized: true,
            error: null
          });
        } else if (event === "TOKEN_REFRESHED" && session?.user && !session.user.is_anonymous) {
          if (authState.user?.id !== session.user.id) {
            updateAuthState({ user: session.user, error: null });
          }
        }
      } catch (error) {
        updateAuthState({
          loading: false,
          initialized: true,
          error: error instanceof Error ? error.message : "Erro na autenticação"
        });
      } finally {
        processingAuthChangeRef.current = false;
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [fetchAdminProfile, updateAuthState, isRedundantEvent, updateLastEvent, authState.user?.id, supabase.auth]);

  const signInWithEmail = async (
    email: string,
    password: string
  ): Promise<{ error: AuthError | string | null }> => {
    try {
      updateAuthState({ loading: true, error: null });

      // Fazer login no Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        updateAuthState({ loading: false, error: authError.message });
        return { error: authError };
      }

      if (!data.user) {
        updateAuthState({ loading: false, error: "Usuário não encontrado" });
        return { error: "Usuário não encontrado" };
      }

      // Verificar se usuário tem profile admin válido
      const adminProfile = await fetchAdminProfile(data.user);

      if (!adminProfile) {
        await supabase.auth.signOut();
        const errorMsg = "Usuário não tem permissões administrativas ou conta inativa";
        updateAuthState({
          user: null,
          profile: null,
          loading: false,
          error: errorMsg
        });
        return { error: errorMsg };
      }

      const validRoles = ["admin", "cashier", "stockist"];
      if (!validRoles.includes(adminProfile.role)) {
        await supabase.auth.signOut();
        const errorMsg = "Papel de usuário inválido";
        updateAuthState({
          user: null,
          profile: null,
          loading: false,
          error: errorMsg
        });
        return { error: errorMsg };
      }

      updateAuthState({
        user: data.user,
        profile: adminProfile,
        loading: false,
        initialized: true,
        error: null
      });

      return { error: null };

    } catch (error) {
      console.error("Erro no login admin:", error);
      const errorMsg = "Erro interno do servidor";
      updateAuthState({ loading: false, error: errorMsg });
      return { error: errorMsg };
    }
  };

  // Logout melhorado com limpeza completa
  const signOut = async (): Promise<void> => {
    try {
      updateAuthState({ loading: true, error: null });

      // Fazer logout no Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Erro no logout:", error);
        // Não throw, apenas log e continue
      }

      // Limpar todos os dados do localStorage relacionados ao Supabase
      const keysToRemove = [
        'supabase.auth.token.admin',
        'supabase.auth.token.customer',
        'sb-bpphpxuhsyxtlvcfopaw-auth-token',
        'sidebar_expandedSubmenus',
        'stock_notifications_read'
      ];

      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn(`Erro ao remover chave ${key}:`, e);
        }
      });

      // Limpar todas as chaves que começam com 'supabase'
      try {
        const allKeys = Object.keys(localStorage);
        allKeys.forEach(key => {
          if (key.startsWith('supabase') || key.startsWith('sb-')) {
            localStorage.removeItem(key);
          }
        });
      } catch (e) {
        console.warn('Erro ao limpar localStorage:', e);
      }

      // Limpar estado local
      updateAuthState({
        user: null,
        profile: null,
        loading: false,
        error: null
      });

      // Aguardar um momento para garantir que a limpeza seja processada
      await new Promise(resolve => setTimeout(resolve, 100));

      // Forçar reload da página para garantir limpeza completa
      window.location.href = "/login";
    } catch (error) {
      console.error("Erro no logout:", error);

      // Mesmo com erro, tentar limpar dados locais
      try {
        localStorage.clear();
      } catch (e) {
        console.warn("Erro ao limpar localStorage:", e);
      }

      updateAuthState({
        user: null,
        profile: null,
        loading: false,
        error: null
      });

      // Forçar reload da página
      window.location.href = "/login";
    }
  };

  // Função para limpar erros
  const clearError = useCallback(() => {
    updateAuthState({ error: null });
  }, [updateAuthState]);

  return {
    user: authState.user,
    profile: authState.profile,
    loading: authState.loading,
    initialized: authState.initialized,
    error: authState.error,
    isAdmin,
    signInWithEmail,
    signOut,
    clearError,
  };
};
