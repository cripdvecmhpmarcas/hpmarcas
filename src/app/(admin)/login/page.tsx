import React, { Suspense } from "react";
import AdminLoginPage from "@/components/auth/admin/AdminLoginPage";

function LoginPageSuspense() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <AdminLoginPage />
    </Suspense>
  );
}

export default function LoginPage() {
  return <LoginPageSuspense />;
}
