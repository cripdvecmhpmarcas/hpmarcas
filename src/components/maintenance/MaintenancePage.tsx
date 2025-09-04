"use client";

import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Clock, Mail } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const MaintenancePage = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center p-4">
      <article className="flex flex-col justify-center items-center text-white max-w-2xl mx-auto">
        {/* Logo */}
        <Logo className="w-32 h-32 mb-8" />

        <article className="text-center space-y-6">
          {/* Título Principal */}
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent mb-4">
            Estamos Preparando<br />Novidades para Você!
          </h1>

          {/* Subtítulo */}
          <h2 className="text-xl md:text-2xl text-gray-300 font-light mb-6">
            Nossa loja online está passando por melhorias
          </h2>

          {/* Descrição */}
          <p className="text-gray-400 text-lg max-w-lg mx-auto leading-relaxed mb-8">
            Estamos trabalhando para trazer uma experiência ainda melhor em perfumes e cosméticos importados.
            Em breve estaremos online novamente com muitas novidades!
          </p>

          {/* Informações de Tempo */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Clock className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-300 font-medium">Previsão de Retorno</span>
            </div>
            <p className="text-yellow-400 text-xl font-bold">Em breve</p>
          </div>

          {/* Botões de Contato */}
          <article className="flex flex-col sm:flex-row gap-4 justify-center items-center">

            <Button
              asChild
              variant="outline"
              className="bg-transparent border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-gray-900 px-6 py-3"
            >
              <Link href="mailto:hpmarcas@gmail.com">
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Link>
            </Button>
          </article>

          {/* Informações da Empresa */}
          <div className="mt-8 text-xs text-gray-500">
            <p>&copy; 2024 HP Marcas Perfumes. Todos os direitos reservados.</p>
            <p className="mt-1">Perfumes e Cosméticos Importados Originais</p>
            <p className="mt-1">Atualizado em: {currentTime.toLocaleString('pt-BR')}</p>
          </div>
        </article>

        {/* SEO Hidden Content */}
        <div className="sr-only">
          <h1>Site em Manutenção - HP Marcas Perfumes</h1>
          <p>Loja temporariamente indisponível para melhorias. Volte em breve!</p>
        </div>
      </article>
    </section>
  );
};

export default MaintenancePage;
