import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  FileText,
  Cookie,
  HelpCircle,
  Scale,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LegalPageLink {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const legalPages: LegalPageLink[] = [
  {
    href: "/politica-privacidade",
    title: "Política de Privacidade",
    description: "Como protegemos e utilizamos seus dados pessoais",
    icon: Shield,
    badge: "LGPD",
  },
  {
    href: "/termos-de-uso",
    title: "Termos de Uso",
    description: "Condições para utilização dos nossos serviços",
    icon: FileText,
  },
  {
    href: "/cookies",
    title: "Política de Cookies",
    description: "Como utilizamos cookies e tecnologias similares",
    icon: Cookie,
  },
  {
    href: "/faq",
    title: "Perguntas Frequentes",
    description: "Respostas para as dúvidas mais comuns",
    icon: HelpCircle,
  },
  {
    href: "/direitos-consumidor",
    title: "Direitos do Consumidor",
    description: "Seus direitos segundo o Código de Defesa do Consumidor",
    icon: Scale,
    badge: "CDC",
  },
  {
    href: "/acessibilidade",
    title: "Acessibilidade",
    description: "Nosso compromisso com a inclusão digital",
    icon: Users,
  },
];

const LegalNavigation: React.FC = () => {
  const pathname = usePathname();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {legalPages.map((page) => {
        const Icon = page.icon;
        const isActive = pathname === page.href;

        return (
          <Link key={page.href} href={page.href}>
            <Card
              className={cn(
                "h-full transition-all duration-200 cursor-pointer hover:shadow-md border-2",
                isActive
                  ? "border-yellow-300 bg-yellow-50 shadow-sm"
                  : "border-gray-200 hover:border-yellow-200"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-lg flex-shrink-0",
                      isActive ? "bg-yellow-200" : "bg-gray-100"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5",
                        isActive ? "text-yellow-700" : "text-gray-600"
                      )}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className={cn(
                          "font-semibold text-sm",
                          isActive ? "text-yellow-800" : "text-gray-900"
                        )}
                      >
                        {page.title}
                      </h3>
                      {page.badge && (
                        <Badge
                          variant="secondary"
                          className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700"
                        >
                          {page.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {page.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
};

export default LegalNavigation;
