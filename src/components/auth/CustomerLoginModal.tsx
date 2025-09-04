"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Mail,
  Lock,
  User,
  Phone,
  CreditCard,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useCustomerAuth } from "./CustomerAuthProvider";
import { toast } from "sonner";

interface CustomerLoginModalProps {
  trigger: React.ReactNode;
  onSuccess?: () => void;
  defaultMode?: "login" | "register" | "convert";
  title?: string;
}

export const CustomerLoginModal: React.FC<CustomerLoginModalProps> = ({
  trigger,
  onSuccess,
  defaultMode,
  title,
}) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register" | "convert">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const auth = useCustomerAuth();

  // Dados do formulário de login
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  // Dados do formulário de cadastro
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    cpf: "",
    acceptTerms: false,
    acceptMarketing: false,
  });

  // Determinar modo inicial
  useEffect(() => {
    if (defaultMode) {
      setMode(defaultMode);
    } else {
      // Se não há usuário logado, sempre começar com login
      // O usuário pode escolher cadastrar-se depois
      setMode("login");
    }
  }, [defaultMode]);

  // Resetar formulário quando modal fecha
  useEffect(() => {
    if (!open) {
      setError(null);
      setLoading(false);
      setShowPassword(false);
      setShowConfirmPassword(false);
      setLoginData({
        email: "",
        password: "",
        rememberMe: false,
      });
      setRegisterData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        cpf: "",
        acceptTerms: false,
        acceptMarketing: false,
      });
    }
  }, [open]);

  // Validar formulário de cadastro
  const validateRegisterForm = () => {
    if (!registerData.name.trim()) {
      setError("Nome é obrigatório");
      return false;
    }

    if (!registerData.email.trim()) {
      setError("E-mail é obrigatório");
      return false;
    }

    if (registerData.password.length < 6) {
      setError("Senha deve ter pelo menos 6 caracteres");
      return false;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError("Senhas não coincidem");
      return false;
    }

    if (!registerData.acceptTerms) {
      setError("Você deve aceitar os termos de uso");
      return false;
    }

    return true;
  };

  // Função para formatar CPF
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  // Função para formatar telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await auth.signInWithEmail(
      loginData.email,
      loginData.password
    );

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        setError("E-mail ou senha incorretos");
      } else if (error.message.includes("Email not confirmed")) {
        setError("E-mail não confirmado. Verifique sua caixa de entrada.");
      } else {
        setError("Erro ao fazer login. Tente novamente.");
      }
    } else {
      setOpen(false);
      onSuccess?.();
    }

    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateRegisterForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await auth.signUp(
      registerData.email,
      registerData.password,
      {
        name: registerData.name,
        phone: registerData.phone,
        cpf_cnpj: registerData.cpf,
      }
    );

    if (error) {
      if (error.message.includes("User already registered")) {
        setError("Este e-mail já está cadastrado. Tente fazer login.");
      } else if (
        error.message.includes("Password should be at least 6 characters")
      ) {
        setError("A senha deve ter pelo menos 6 caracteres");
      } else {
        setError("Erro ao criar conta. Verifique os dados e tente novamente.");
      }
    } else {
      setError(null);
      toast.success(
        "Conta criada com sucesso! Verifique seu e-mail para confirmar o cadastro."
      );
      setOpen(false);
      onSuccess?.();
    }

    setLoading(false);
  };

  const handleConvertAnonymous = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateRegisterForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await auth.signUp(
      registerData.email,
      registerData.password,
      {
        name: registerData.name,
        phone: registerData.phone,
        cpf_cnpj: registerData.cpf,
      }
    );

    if (error) {
      if (error.message.includes("User already registered")) {
        setError("Este e-mail já está em uso. Tente fazer login.");
      } else {
        setError("Erro ao finalizar cadastro. Tente novamente.");
      }
    } else {
      setOpen(false);
      onSuccess?.();
      toast.success("Cadastro finalizado com sucesso!");
    }

    setLoading(false);
  };

  const getModalTitle = () => {
    if (title) return title;

    switch (mode) {
      case "login":
        return "Entre na sua conta";
      case "register":
        return "Criar nova conta";
      case "convert":
        return "Finalize seu cadastro";
      default:
        return "Entrar";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-[420px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {getModalTitle()}
          </DialogTitle>
          {mode === "convert" && (
            <p className="text-center text-sm text-muted-foreground">
              Complete seus dados para finalizar a compra
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Formulário de Login */}
          {mode === "login" && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={loginData.email}
                    onChange={(e) =>
                      setLoginData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="pl-10"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    className="pl-10 pr-10"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember-me"
                  checked={loginData.rememberMe}
                  onCheckedChange={(checked: boolean) =>
                    setLoginData((prev) => ({ ...prev, rememberMe: !!checked }))
                  }
                  disabled={loading}
                />
                <Label htmlFor="remember-me" className="text-sm">
                  Lembrar de mim
                </Label>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>

              <div className="space-y-2 text-center text-sm">
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="text-primary hover:underline block w-full"
                  disabled={loading}
                >
                  Não tem conta? Cadastre-se
                </button>
                <button
                  type="button"
                  className="text-muted-foreground hover:underline block w-full"
                  disabled={loading}
                >
                  Esqueci minha senha
                </button>
              </div>
            </form>
          )}

          {/* Formulário de Cadastro */}
          {(mode === "register" || mode === "convert") && (
            <form
              onSubmit={
                mode === "convert" ? handleConvertAnonymous : handleRegister
              }
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="register-name">Nome completo *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={registerData.name}
                    onChange={(e) =>
                      setRegisterData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="pl-10"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email">E-mail *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={registerData.email}
                    onChange={(e) =>
                      setRegisterData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="pl-10"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="register-password">Senha *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mín. 6 caracteres"
                      value={registerData.password}
                      onChange={(e) =>
                        setRegisterData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className="pl-10 pr-10"
                      disabled={loading}
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repetir senha"
                      value={registerData.confirmPassword}
                      onChange={(e) =>
                        setRegisterData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      className="pl-10 pr-10"
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      disabled={loading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="register-phone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="register-phone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={registerData.phone}
                      onChange={(e) => {
                        const formatted = formatPhone(e.target.value);
                        setRegisterData((prev) => ({
                          ...prev,
                          phone: formatted,
                        }));
                      }}
                      className="pl-10"
                      disabled={loading}
                      maxLength={15}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-cpf">CPF</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="register-cpf"
                      type="text"
                      placeholder="000.000.000-00"
                      value={registerData.cpf}
                      onChange={(e) => {
                        const formatted = formatCPF(e.target.value);
                        setRegisterData((prev) => ({
                          ...prev,
                          cpf: formatted,
                        }));
                      }}
                      className="pl-10"
                      disabled={loading}
                      maxLength={14}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="accept-terms"
                    checked={registerData.acceptTerms}
                    onCheckedChange={(checked: boolean) =>
                      setRegisterData((prev) => ({
                        ...prev,
                        acceptTerms: !!checked,
                      }))
                    }
                    disabled={loading}
                    className="mt-1"
                    required
                  />
                  <Label htmlFor="accept-terms" className="text-sm leading-5">
                    Li e aceito os{" "}
                    <a
                      href="/termos-de-uso"
                      target="_blank"
                      className="text-primary hover:underline"
                    >
                      termos de uso
                    </a>{" "}
                    e a{" "}
                    <a
                      href="/politica-privacidade"
                      target="_blank"
                      className="text-primary hover:underline"
                    >
                      política de privacidade
                    </a>
                    *
                  </Label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="accept-marketing"
                    checked={registerData.acceptMarketing}
                    onCheckedChange={(checked: boolean) =>
                      setRegisterData((prev) => ({
                        ...prev,
                        acceptMarketing: !!checked,
                      }))
                    }
                    disabled={loading}
                    className="mt-1"
                  />
                  <Label
                    htmlFor="accept-marketing"
                    className="text-sm leading-5"
                  >
                    Quero receber ofertas exclusivas, lançamentos e novidades
                    por e-mail
                  </Label>
                </div>
              </div>

              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {mode === "convert" ? "Finalizando..." : "Criando conta..."}
                  </>
                ) : mode === "convert" ? (
                  "Finalizar cadastro"
                ) : (
                  "Criar conta"
                )}
              </Button>

              {mode === "register" && (
                <div className="text-center text-sm">
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="text-primary hover:underline"
                    disabled={loading}
                  >
                    Já tem conta? Faça login
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
