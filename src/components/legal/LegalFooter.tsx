import React from "react";
import Link from "next/link";
import {
  Shield,
  FileText,
  Cookie,
  HelpCircle,
  ExternalLink,
} from "lucide-react";

const LegalFooter: React.FC = () => {
  const legalLinks = [
    {
      href: "/politica-privacidade",
      label: "Política de Privacidade",
      icon: Shield,
    },
    {
      href: "/termos-de-uso",
      label: "Termos de Uso",
      icon: FileText,
    },
    {
      href: "/cookies",
      label: "Política de Cookies",
      icon: Cookie,
    },
    {
      href: "/faq",
      label: "FAQ",
      icon: HelpCircle,
    },
  ];

  return (
    <div className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">HP Marcas Perfumes</h3>
            <p className="text-gray-300 mb-4 leading-relaxed">
              Sua loja online de perfumes e cosméticos importados. Produtos
              originais, entrega rápida e atendimento especializado.
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <p>CNPJ: 12.345.678/0001-90</p>
              <p>Av. Presidente Vargas, 633 - Centro</p>
              <p>Rio de Janeiro/RJ - CEP: 20071-004</p>
            </div>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold mb-4">Informações Legais</h4>
            <ul className="space-y-3">
              {legalLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="flex items-center gap-2 text-gray-300 hover:text-yellow-400 transition-colors text-sm"
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
              <li>
                <a
                  href="https://www.gov.br/anpd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-300 hover:text-yellow-400 transition-colors text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  ANPD - Autoridade Nacional
                </a>
              </li>
            </ul>
          </div>

          {/* Compliance */}
          <div>
            <h4 className="font-semibold mb-4">Conformidade</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-300">LGPD Compliance</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-300">SSL Certificado</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-300">PCI DSS</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-300">
                  Código de Defesa do Consumidor
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © 2024 HP Marcas Perfumes. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>Última atualização: Dezembro 2024</span>
              <span>•</span>
              <span>Versão 1.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalFooter;
