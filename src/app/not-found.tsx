"use client";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const NotFound = () => {
  const router = useRouter();

  return (
    <section className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center p-4">
      <article className="flex flex-col justify-center items-center text-white">
        {/* Logo */}
        <Logo className="w-32 h-32" />
        <article className="max-w-md mx-auto flex flex-col justify-center items-center">
          <h1 className="text-8xl font-bold hp-gradient-text mb-4">404</h1>
          <h2 className="text-3xl font-bold mb-6">Página não encontrada</h2>
          <p className="text-gray-300 mb-8 text-lg">
            Ops! A página que você está procurando não existe ou foi movida.
          </p>

          <article className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="hp-button-gold">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Ir para Home
              </Link>
            </Button>

            <Button
              variant="outline"
              onClick={() => router.back()}
              className="bg-transparent border-white text-white hover:bg-white hover:text-black"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </article>
        </article>

        <article className="mt-12 text-sm text-gray-400">
          <p>Se você acredita que isso é um erro, entre em contato conosco.</p>
        </article>
      </article>
    </section>
  );
};

export default NotFound;
