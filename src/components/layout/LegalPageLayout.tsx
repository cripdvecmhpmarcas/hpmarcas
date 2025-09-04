import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, LucideIcon } from "lucide-react";

interface LegalPageLayoutProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  backHref?: string;
  backText?: string;
  version?: string;
  lastUpdate: string;
  children: React.ReactNode;
  tableOfContents?: {
    id: string;
    title: string;
  }[];
  footerText?: string;
}

const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({
  title,
  subtitle,
  icon: Icon,
  backHref = "/cadastro",
  backText = "Voltar ao Cadastro",
  version,
  lastUpdate,
  children,
  tableOfContents,
  footerText,
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href={backHref}>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              {backText}
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader className="text-center bg-gradient-to-r from-yellow-50 to-yellow-100 border-b">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="p-2 bg-yellow-200 rounded-full">
                <Icon className="w-6 h-6 text-yellow-700" />
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900">
                {title}
              </CardTitle>
            </div>
            {subtitle && (
              <p className="text-gray-700 text-lg mb-2">{subtitle}</p>
            )}
            <p className="text-gray-600 text-sm">
              Última atualização: {lastUpdate}
            </p>
            {version && (
              <p className="text-gray-500 text-xs">Versão {version}</p>
            )}
          </CardHeader>

          <CardContent className="p-8">
            {/* Table of Contents */}
            {tableOfContents && tableOfContents.length > 0 && (
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-lg mb-3 text-gray-900">
                  Índice de Conteúdo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {tableOfContents.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="text-sm text-yellow-600 hover:text-yellow-700 hover:underline transition-colors p-1 rounded"
                    >
                      {item.title}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="space-y-8">{children}</div>

            {/* Footer */}
            {footerText && (
              <div className="border-t pt-6 mt-8 bg-gray-50 rounded-lg p-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Icon className="w-5 h-5 text-yellow-600" />
                    <span className="font-semibold text-gray-700">
                      HP Marcas Perfumes
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 max-w-2xl mx-auto">
                    {footerText}
                  </p>
                  {version && (
                    <p className="text-xs text-gray-500 mt-2">
                      Versão {version} • {lastUpdate}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LegalPageLayout;
