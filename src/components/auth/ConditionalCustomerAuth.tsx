"use client";

import { usePathname } from "next/navigation";
import { CustomerAuthProvider } from "./CustomerAuthProvider";

interface ConditionalCustomerAuthProps {
  children: React.ReactNode;
}

export default function ConditionalCustomerAuth({ children }: ConditionalCustomerAuthProps) {
  const pathname = usePathname();

  // Não inicializar CustomerAuthProvider em rotas administrativas
  const isAdminRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/login');

  if (isAdminRoute) {
    // console.log("Rota administrativa detectada - CustomerAuthProvider não inicializado");
    return <>{children}</>;
  }

  return (
    <CustomerAuthProvider>
      {children}
    </CustomerAuthProvider>
  );
}
