"use client";

import React, { createContext, useContext } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { AuthErrorBoundary } from "../AuthErrorBoundary";

const AdminAuthContext = createContext<ReturnType<typeof useAdminAuth> | null>(
  null
);

interface AdminAuthProviderProps {
  children: React.ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({
  children,
}) => {
  const auth = useAdminAuth();

  return (
    <AuthErrorBoundary>
      <AdminAuthContext.Provider value={auth}>
        {children}
      </AdminAuthContext.Provider>
    </AuthErrorBoundary>
  );
};

export const useAdminAuthContext = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error(
      "useAdminAuthContext deve ser usado dentro de AdminAuthProvider"
    );
  }
  return context;
};
