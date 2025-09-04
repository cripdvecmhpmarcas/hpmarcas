"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Lock,
  Mail,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { useAdminAuthContext } from "@/components/auth/admin/AdminAuthProvider";
import Logo from "@/components/logo";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signInWithEmail, user, isAdmin, error: authError, clearError } = useAdminAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  // Se já está logado como admin, redirecionar
  useEffect(() => {
    if (user && isAdmin) {
      router.push(redirectTo);
    }
  }, [user, isAdmin, router, redirectTo]);

  // Limpar erro do contexto quando componente monta
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Verificar se há erros na URL (callback)
  useEffect(() => {
    const urlError = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (urlError) {
      switch (urlError) {
        case "auth_callback_error":
          setError(errorDescription || "Erro no processo de autenticação");
          break;
        case "session_not_created":
          setError("Falha ao criar sessão. Tente novamente.");
          break;
        default:
          setError("Erro na autenticação. Tente novamente.");
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    clearError();

    if (!email.trim() || !password.trim()) {
      setError("Por favor, preencha todos os campos");
      return;
    }

    setLoading(true);

    try {
      const { error: loginError } = await signInWithEmail(email, password);

      if (loginError) {
        if (typeof loginError === "string") {
          setError(loginError);
        } else {
          switch (loginError.message) {
            case "Invalid login credentials":
              setError("E-mail ou senha incorretos");
              break;
            case "Email not confirmed":
              setError("E-mail não confirmado. Verifique sua caixa de entrada.");
              break;
            case "Too many requests":
              setError("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
              break;
            default:
              setError("Erro ao fazer login. Verifique suas credenciais.");
          }
        }
      } else {
        // Login bem-sucedido - o redirecionamento é feito pelo useEffect
        toast.success("Login admin bem-sucedido");
      }
    } catch (error) {
      console.error("Erro no login:", error);
      setError("Erro interno. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo e Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center">
              <Logo className="w-10 h-10" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Área Administrativa
            </h1>
            <p className="text-gray-600 mt-1">
              Sistema de Gestão HP Marcas
            </p>
          </div>
        </div>

        {/* Card de Login */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-xl text-center flex items-center justify-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Login Administrativo
            </CardTitle>
            <CardDescription className="text-center">
              Acesse o painel administrativo com suas credenciais
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo E-mail */}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Campo Senha */}
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Exibir erro */}
              {(error || authError) && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error || authError}</AlertDescription>
                </Alert>
              )}

              {/* Botão de Login */}
              <Button
                type="submit"
                className="w-full h-11"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Entrar no Sistema
                  </>
                )}
              </Button>
            </form>

            {/* Informações de Segurança */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500 text-center space-y-1">
                <p>🔐 Acesso restrito a administradores autorizados</p>
                <p>🛡️ Todas as ações são registradas e monitoradas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>© 2025 HP Marcas Perfumes. Todos os direitos reservados.</p>
          <p className="mt-1">
            Problemas de acesso? Entre em contato com o suporte técnico.
          </p>
        </div>
      </div>
    </div>
  );
}
