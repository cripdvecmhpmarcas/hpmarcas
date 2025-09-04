"use client";

import React, { useEffect } from "react";
import { AdminAuthGuard } from "@/components/auth/admin/AdminAuthGuard";
import Sidebar from "@/components/sidebar";
import { initializeStorage } from "@/lib/storage";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { NotificationProvider } from "@/components/dashboard/NotificationProvider";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  useEffect(() => {
    initializeStorage()
  }, [])

  return (
    <AdminAuthGuard requireAdmin={true}>
      <NotificationProvider>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </NotificationProvider>
    </AdminAuthGuard>
  );
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { profile } = useAdminAuthContext();
  const [sidebarWidth, setSidebarWidth] = React.useState(256);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - escondido em mobile */}
      <div className="hidden md:flex flex-shrink-0">
        <AdminSidebar onWidthChange={setSidebarWidth} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <DashboardHeader
          title="Dashboard Administrativo"
          subtitle="Gerencie seu estoque, vendas e relatórios"
          sidebarWidth={sidebarWidth}
          user={{
            name: profile?.name || "Administrador",
            email: profile?.email || "admin@hpmarcas.com",
            avatar: undefined
          }}
        />

        {/* Page Content */}
        <main
          className="flex-1 overflow-y-auto bg-gray-50 transition-all duration-300"
          style={{ paddingTop: '6rem' }} // 96px = 6rem para o header
          id="dashboard-main"
        >
          {children}
        </main>
      </div>
    </div>
  )
}

// Componente Sidebar integrado com auth
function AdminSidebar({ onWidthChange }: { onWidthChange?: (width: number) => void }) {
  const { profile } = useAdminAuthContext();

  return (
    <Sidebar
      userName={profile?.name || "Administrador"}
      userEmail={profile?.email || "admin@hpmarcas.com"}
      userRole={profile?.role || "admin"}
      className="h-full"
      onWidthChange={onWidthChange}
    />
  );
}


// Import necessário
import { useAdminAuthContext } from "@/components/auth/admin/AdminAuthProvider";
