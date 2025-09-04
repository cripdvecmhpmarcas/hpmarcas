"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";
import Logo from "@/components/logo";

interface AuthLoadingScreenProps {
  message?: string;
  subMessage?: string;
  showProgress?: boolean;
}

export const AuthLoadingScreen: React.FC<AuthLoadingScreenProps> = ({
  message = "Carregando...",
  subMessage = "Aguarde alguns instantes...",
  showProgress = true,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center">
            <Logo className="w-10 h-10" />
          </div>
        </div>

        {/* Loading Animation */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-gray-200 rounded-full"></div>
              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>

          {/* Loading Message */}
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900">{message}</p>
            <p className="text-sm text-gray-600">
              {subMessage}
            </p>
            {showProgress && (
              <div className="w-48 bg-gray-200 rounded-full h-1 mx-auto">
                <div className="bg-primary h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            )}
          </div>
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <ShieldCheck className="w-4 h-4" />
          <span>Conexão Segura</span>
        </div>
      </div>
    </div>
  );
};
