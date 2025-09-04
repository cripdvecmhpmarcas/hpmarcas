"use client";

import React from "react";
import { useAdminAuthContext } from "./AdminAuthProvider";
import { AuthLoadingScreen } from "../AuthLoadingScreen";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShieldCheck, AlertTriangle, User } from "lucide-react";
import { useRouter } from "next/navigation";

interface AdminAuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  fallback?: React.ReactNode;
  loadingMessage?: string;
}

export const AdminAuthGuard: React.FC<AdminAuthGuardProps> = ({
  children,
  requireAdmin = true,
  fallback,
  loadingMessage = "Verificando permissões administrativas...",
}) => {
  const { user, profile, loading, isAdmin, initialized, error } = useAdminAuthContext();
  const router = useRouter();

  // Debug logs
  // console.log("AdminAuthGuard state:", {
  //   initialized,
  //   loading,
  //   hasUser: !!user,
  //   hasProfile: !!profile,
  //   isAdmin,
  //   error
  // });

  // Se ainda não foi inicializado OU está carregando (mas só mostrar loading se realmente necessário)
  if (!initialized || (loading && !user)) {
    return <AuthLoadingScreen message={loadingMessage} />;
  }

  // Se houve erro na inicialização
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <CardTitle>Erro de Autenticação</CardTitle>
            <CardDescription>
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full"
              onClick={() => router.push("/login")}
            >
              <User className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se não tem usuário autenticado (somente após inicialização completa)
  if (!user) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <CardTitle>Acesso Administrativo</CardTitle>
            <CardDescription>
              Você precisa estar logado como administrador para acessar esta área
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full"
              onClick={() => router.push("/login")}
            >
              <User className="w-4 h-4 mr-2" />
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se usuário não tem profile administrativo (somente após inicialização completa)
  if (!profile) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Sua conta não possui permissões administrativas ou está inativa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600 text-center">
              <p>Entre em contato com o administrador do sistema</p>
              <p className="mt-2 font-mono text-xs">
                ID: {user.id}
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/login")}
            >
              Voltar ao Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se requer admin especificamente e usuário não é admin (somente após inicialização completa)
  if (requireAdmin && !isAdmin) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <CardTitle>Permissão Insuficiente</CardTitle>
            <CardDescription>
              Esta área requer permissões de administrador
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600 text-center">
              <p>Sua função atual: <span className="font-semibold">{profile.role}</span></p>
              <p>Status: <span className="font-semibold">{profile.status}</span></p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/dashboard")}
            >
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se chegou aqui, usuário tem permissões adequadas
  return <>{children}</>;
};
