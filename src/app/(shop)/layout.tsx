"use client";

import { AnonymousAuthProvider } from "@/components/auth/AnonymousAuthProvider";
import { CustomerHeader } from "@/components/layout/CustomerHeader";
import LegalFooter from "@/components/legal/LegalFooter";
import { useCart } from "@/components/(shop)/carrinho/hooks/useCart";
import MaintenancePage from "@/components/maintenance/MaintenancePage";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verificar se está em modo manutenção
  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

  // Se estiver em manutenção, mostrar página de manutenção
  if (isMaintenanceMode) {
    return <MaintenancePage />;
  }

  // Caso contrário, mostrar layout normal do shop
  return (
    <AnonymousAuthProvider>
      <ShopLayoutContent>{children}</ShopLayoutContent>
    </AnonymousAuthProvider>
  );
}

function ShopLayoutContent({ children }: { children: React.ReactNode }) {
  const { getItemCount } = useCart();

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader cartItemCount={getItemCount()} />
      <main>{children}</main>

      {/* Legal Footer - apenas na área de e-commerce */}
      <LegalFooter />

      <footer className="bg-gray-900 text-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2024 HP Marcas Perfumes. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
