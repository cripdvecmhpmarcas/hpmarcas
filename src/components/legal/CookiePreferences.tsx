"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Cookie, Settings, Shield, BarChart3, Target } from "lucide-react";
import { toast } from "sonner";

interface CookieCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  enabled: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

const CookiePreferences: React.FC = () => {
  const [categories, setCategories] = useState<CookieCategory[]>([
    {
      id: "essential",
      name: "Cookies Essenciais",
      description:
        "Necessários para o funcionamento básico do site. Não podem ser desabilitados.",
      required: true,
      enabled: true,
      icon: Shield,
    },
    {
      id: "performance",
      name: "Cookies de Performance",
      description:
        "Nos ajudam a entender como você usa o site para melhorar a experiência.",
      required: false,
      enabled: false,
      icon: BarChart3,
    },
    {
      id: "functionality",
      name: "Cookies de Funcionalidade",
      description:
        "Permitem funcionalidades avançadas e personalização da sua experiência.",
      required: false,
      enabled: false,
      icon: Settings,
    },
    {
      id: "marketing",
      name: "Cookies de Marketing",
      description:
        "Usados para mostrar anúncios relevantes e medir a efetividade das campanhas.",
      required: false,
      enabled: false,
      icon: Target,
    },
  ]);

  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    // Carregar preferências salvas
    const savedPreferences = localStorage.getItem("cookiePreferences");
    if (savedPreferences) {
      const preferences = JSON.parse(savedPreferences);
      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          enabled: cat.required || preferences[cat.id] || false,
        }))
      );
    }
    setHasLoaded(true);
  }, []);

  const updateCategory = (categoryId: string, enabled: boolean) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === categoryId ? { ...cat, enabled } : cat))
    );
  };

  const savePreferences = () => {
    const preferences = categories.reduce(
      (acc, cat) => ({
        ...acc,
        [cat.id]: cat.enabled,
      }),
      {}
    );

    localStorage.setItem("cookiePreferences", JSON.stringify(preferences));

    // Aqui você pode implementar a lógica para aplicar as preferências
    // Por exemplo, carregar/descarregar scripts de analytics
    applyPreferences(preferences);

    // Mostrar confirmação
    toast.success("Preferências salvas com sucesso!");
  };

  const acceptAll = () => {
    setCategories((prev) => prev.map((cat) => ({ ...cat, enabled: true })));
    setTimeout(savePreferences, 100);
  };

  const rejectAll = () => {
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        enabled: cat.required,
      }))
    );
    setTimeout(savePreferences, 100);
  };

  const applyPreferences = (preferences: Record<string, boolean>) => {
    // Google Analytics
    if (preferences.performance) {
      // Carregar Google Analytics
      // console.log("Habilitando Google Analytics");
    } else {
      // Desabilitar Google Analytics
      // console.log("Desabilitando Google Analytics");
    }

    // Facebook Pixel
    if (preferences.marketing) {
      // Carregar Facebook Pixel
      // console.log("Habilitando Facebook Pixel");
    } else {
      // Desabilitar Facebook Pixel
      // console.log("Desabilitando Facebook Pixel");
    }
  };

  if (!hasLoaded) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardHeader className="text-center bg-gradient-to-r from-yellow-50 to-yellow-100">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Cookie className="w-6 h-6 text-yellow-600" />
          <CardTitle className="text-2xl font-bold">
            Preferências de Cookies
          </CardTitle>
        </div>
        <p className="text-gray-600">
          Personalize sua experiência escolhendo quais cookies aceitar
        </p>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <div
              key={category.id}
              className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-yellow-100 rounded-full flex-shrink-0">
                <Icon className="w-5 h-5 text-yellow-600" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {category.name}
                  </h3>
                  <Switch
                    checked={category.enabled}
                    onCheckedChange={(enabled) =>
                      updateCategory(category.id, enabled)
                    }
                    disabled={category.required}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>
                <p className="text-sm text-gray-600">{category.description}</p>
                {category.required && (
                  <p className="text-xs text-yellow-600 mt-1">
                    Sempre ativo - necessário para funcionamento
                  </p>
                )}
              </div>
            </div>
          );
        })}

        <div className="border-t pt-6">
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={rejectAll}
              className="border-gray-300"
            >
              Rejeitar Todos
            </Button>
            <Button
              onClick={savePreferences}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              Salvar Preferências
            </Button>
            <Button
              onClick={acceptAll}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              Aceitar Todos
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CookiePreferences;
