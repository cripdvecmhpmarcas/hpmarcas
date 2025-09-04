"use client";

import React from "react";
import { AdminAuthProvider } from "@/components/auth/admin/AdminAuthProvider";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminAuthProvider>
      {children}
    </AdminAuthProvider>
  );
}