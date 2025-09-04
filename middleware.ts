import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Database } from "@/types/database";

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const { pathname } = request.nextUrl;

  // Headers de segurança
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-LGPD-Compliance", "true");

  // Pular arquivos estáticos e API routes
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/callback") ||
    pathname.includes(".")
  ) {
    return res;
  }

  const supabase = createMiddlewareClient<Database>({ req: request, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // ROTAS ADMINISTRATIVAS - Agora todas como subdiretórios de /dashboard
  const adminRoutes = [
    "/dashboard", // Dashboard principal
    "/dashboard/pdv",
    "/dashboard/produtos",
    "/dashboard/estoque",
    "/dashboard/clientes",
    "/dashboard/vendas",
    "/dashboard/relatorios",
    "/dashboard/configuracoes",
  ];

  // Rotas do cliente que precisam de autenticação NÃO-ANÔNIMA
  const customerAuthRoutes = ["/minha-conta", "/checkout"];

  // Rotas públicas do e-commerce
  const publicRoutes = ["/", "/produtos", "/produto", "/carrinho", "/auth"];

  // Rotas de auth admin
  const authRoutes = ["/login"];

  // Verificar tipo de rota
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isCustomerAuthRoute = customerAuthRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(
    (route) => pathname.startsWith(route) || pathname === route
  );

  // LÓGICA PARA ROTAS ADMINISTRATIVAS (/dashboard/*)
  if (isAdminRoute) {
    // Se não tem sessão, redirecionar para login admin
    if (!session) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Verificar se usuário tem profile admin válido
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error || !profile) {
        // console.log("Profile não encontrado:", session.user.id);
        const redirectUrl = new URL("/login", request.url);
        redirectUrl.searchParams.set("error", "profile_not_found");
        redirectUrl.searchParams.set("redirectTo", pathname);
        return NextResponse.redirect(redirectUrl);
      }

      // Verificar se profile está ativo
      if (profile.status !== "active") {
        // console.log("Profile inativo:", profile.status);
        const redirectUrl = new URL("/login", request.url);
        redirectUrl.searchParams.set("error", "profile_inactive");
        redirectUrl.searchParams.set("redirectTo", pathname);
        return NextResponse.redirect(redirectUrl);
      }

      // Por enquanto, apenas admin pode acessar
      if (profile.role !== "admin") {
        // console.log("Usuário sem permissão admin:", profile.role);
        const redirectUrl = new URL("/login", request.url);
        redirectUrl.searchParams.set("error", "insufficient_permissions");
        redirectUrl.searchParams.set("redirectTo", pathname);
        return NextResponse.redirect(redirectUrl);
      }

      // Adicionar informações do profile no header para uso na aplicação
      res.headers.set("X-User-Profile", JSON.stringify({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        status: profile.status
      }));

      return res;
    } catch (error) {
      console.error("Erro ao verificar profile:", error);
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("error", "auth_error");
      redirectUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // LÓGICA PARA ROTAS DE LOGIN ADMIN
  if (isAuthRoute) {
    // Se já está logado como admin válido, redirecionar para dashboard
    if (session && session.user && !session.user.is_anonymous) {
      try {
        // Verificar se o token ainda é válido
        const now = Math.floor(Date.now() / 1000);
        if (session.expires_at && session.expires_at < now) {
          // Token expirado, permitir acesso ao login
          return res;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profile && profile.status === "active" && profile.role === "admin") {
          const redirectTo = request.nextUrl.searchParams.get("redirectTo") || "/dashboard";
          return NextResponse.redirect(new URL(redirectTo, request.url));
        }
      } catch (error) {
        console.log("Erro ao verificar profile existente:", error);
        // Em caso de erro, permitir acesso ao login
        return res;
      }
    }

    return res;
  }

  // LÓGICA PARA ROTAS DO CLIENTE (E-COMMERCE)
  if (isCustomerAuthRoute) {
    if (!session) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return res;
  }

  // ROTAS PÚBLICAS (permite anonymous e não-autenticados)
  if (isPublicRoute) {
    return res;
  }

  // Para qualquer outra rota não definida, permitir acesso
  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
