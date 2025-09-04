"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cookie, Settings, X } from "lucide-react";

const CookieBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const hasConsent = localStorage.getItem("cookieConsent");
    if (!hasConsent) {
      setIsVisible(true);
    }
  }, []);

  const acceptAll = () => {
    const allPreferences = {
      essential: true,
      performance: true,
      functionality: true,
      marketing: true,
    };

    localStorage.setItem("cookieConsent", "true");
    localStorage.setItem("cookiePreferences", JSON.stringify(allPreferences));
    setIsVisible(false);
  };

  const acceptEssential = () => {
    const essentialOnly = {
      essential: true,
      performance: false,
      functionality: false,
      marketing: false,
    };

    localStorage.setItem("cookieConsent", "true");
    localStorage.setItem("cookiePreferences", JSON.stringify(essentialOnly));
    setIsVisible(false);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="shadow-2xl border-yellow-200 bg-white">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cookie className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-gray-900">
                Cookies & Privacidade
              </h3>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMinimize}
                className="h-6 w-6 p-0 hover:bg-gray-100"
              >
                <Settings className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0 hover:bg-gray-100"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Content */}
          {!isMinimized && (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Utilizamos cookies para melhorar sua experiência, personalizar
                conteúdo e analisar nosso tráfego. Você pode escolher quais
                cookies aceitar.
              </p>

              {/* Actions */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    onClick={acceptAll}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm h-8"
                  >
                    Aceitar Todos
                  </Button>
                  <Button
                    onClick={acceptEssential}
                    variant="outline"
                    className="flex-1 text-sm h-8 border-gray-300"
                  >
                    Apenas Essenciais
                  </Button>
                </div>

                <div className="flex gap-2 text-xs">
                  <Link
                    href="/cookies"
                    className="flex-1 text-center py-1 text-yellow-600 hover:text-yellow-700 hover:underline"
                  >
                    Personalizar
                  </Link>
                  <Link
                    href="/politica-privacidade"
                    className="flex-1 text-center py-1 text-gray-500 hover:text-gray-700 hover:underline"
                  >
                    Política de Privacidade
                  </Link>
                </div>
              </div>
            </>
          )}

          {/* Minimized state */}
          {isMinimized && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Configure seus cookies
              </span>
              <Button
                onClick={toggleMinimize}
                variant="outline"
                size="sm"
                className="h-6 text-xs px-2"
              >
                Expandir
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CookieBanner;
