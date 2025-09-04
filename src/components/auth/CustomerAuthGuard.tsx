"use client";

import React from "react";
import { useAnonymousAuth } from "./AnonymousAuthProvider";
import { AuthLoadingScreen } from "./AuthLoadingScreen";
import { CustomerLoginModal } from "./CustomerLoginModal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShieldCheck, User } from "lucide-react";

interface CustomerAuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  fallback?: React.ReactNode;
  loadingMessage?: string;
}

export const CustomerAuthGuard: React.FC<CustomerAuthGuardProps> = ({
  children,
  requireAuth = true,
  fallback,
  loadingMessage = "Verificando autenticação...",
}) => {
  const { user, loading } = useAnonymousAuth();

  // Se ainda está carregando
  if (loading) {
    return <AuthLoadingScreen message={loadingMessage} />;
  }

  // Se não requer auth, sempre renderizar children
  if (!requireAuth) {
    return <>{children}</>;
  }

  // Se não tem usuário, mostrar tela de login
  if (!user) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
            </div>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>
              Você precisa estar logado para acessar esta área
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CustomerLoginModal
              trigger={
                <Button className="w-full">
                  <User className="w-4 h-4 mr-2" />
                  Fazer Login
                </Button>
              }
            />
            <p className="text-center text-sm text-muted-foreground">
              Não tem conta?{" "}
              <CustomerLoginModal
                defaultMode="register"
                trigger={
                  <button className="text-primary hover:underline">
                    Cadastre-se aqui
                  </button>
                }
              />
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se chegou aqui, usuário está autenticado
  return <>{children}</>;
};
