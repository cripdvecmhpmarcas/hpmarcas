"use client";

import React, { createContext, useContext } from "react";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";

const GuestAuthContext = createContext<ReturnType<
  typeof useCustomerAuth
> | null>(null);

interface GuestAuthProviderProps {
  children: React.ReactNode;
}

export const GuestAuthProvider: React.FC<GuestAuthProviderProps> = ({
  children,
}) => {
  const auth = useCustomerAuth();

  return (
    <GuestAuthContext.Provider value={auth}>
      {children}
    </GuestAuthContext.Provider>
  );
};

export const useGuestAuth = () => {
  const context = useContext(GuestAuthContext);
  if (!context) {
    throw new Error(
      "useGuestAuth deve ser usado dentro de GuestAuthProvider"
    );
  }
  return context;
};

// Backward compatibility exports
export const AnonymousAuthProvider = GuestAuthProvider;
export const useAnonymousAuth = useGuestAuth;
