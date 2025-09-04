"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { useSupabaseCustomer } from "@/hooks/useSupabaseCustomer";
import { Tables } from "@/types/database";

export interface CustomerUser extends User {
  customerProfile?: Tables<"customers">;
}

interface CustomerAuthContextType {
  user: CustomerUser | null;
  loading: boolean;
  isGuest: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, userData: { name: string; phone?: string; cpf_cnpj?: string }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | null>(null);

interface CustomerAuthProviderProps {
  children: React.ReactNode;
}

export const CustomerAuthProvider: React.FC<CustomerAuthProviderProps> = ({
  children,
}) => {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Cliente Supabase para customer
  const supabase = useSupabaseCustomer();

  const refreshProfile = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (authUser) {
      try {
        const { data: customerProfile } = await supabase
          .from("customers")
          .select("*")
          .eq("user_id", authUser.id)
          .single();

        setUser({
          ...authUser,
          customerProfile: customerProfile || undefined,
        });
      } catch {
        // console.log("Customer profile not found, using auth user only");
        setUser(authUser);
      }
    } else {
      setUser(null);
    }
  }, [supabase]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          await refreshProfile();
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          await refreshProfile();
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [refreshProfile, supabase]);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        await refreshProfile();
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };


  const signUp = async (
    email: string,
    password: string,
    userData: { name: string; phone?: string; cpf_cnpj?: string }
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            phone: userData.phone,
          },
        },
      });

      if (error) {
        return { error };
      }

      // Create customer profile if user was created
      if (data.user) {
        try {
          await supabase.from("customers").insert({
            user_id: data.user.id,
            name: userData.name,
            email: email,
            phone: userData.phone,
            cpf_cnpj: userData.cpf_cnpj,
            type: "retail",
            status: "active",
            is_anonymous: false,
          });
        } catch (profileError) {
          console.error("Error creating customer profile:", profileError);
          // Don't return error here, user was created successfully
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };


  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        setUser(null);
      }
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const value: CustomerAuthContextType = {
    user,
    loading,
    isGuest: !user,
    signInWithEmail,
    signUp,
    signOut,
    refreshProfile,
  };

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error(
      "useCustomerAuth must be used within a CustomerAuthProvider"
    );
  }
  return context;
};
