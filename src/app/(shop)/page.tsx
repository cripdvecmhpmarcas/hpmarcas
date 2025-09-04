"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSupabasePublic } from "@/hooks/useSupabasePublic";
import { useCart } from "@/hooks/useCart";
import { useAnonymousAuth } from "@/components/auth/AnonymousAuthProvider";
import {
  ShoppingCart,
  Star,
  Shield,
  ArrowRight,
  Sparkles,
  Heart,
  Zap,
  Clock,
  Award,
} from "lucide-react";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  brand: string;
  retail_price: number;
  wholesale_price: number;
  images: string[] | null;
  description: string;
  sku: string;
  stock: number;
  category: string;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const { customer } = useAnonymousAuth();
  const { supabase } = useSupabasePublic();

  const fetchFeaturedProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("status", "active")
        .limit(4);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  const getPrice = (product: Product) => {
    return customer?.type === "wholesale"
      ? product.wholesale_price
      : product.retail_price;
  };

  const handleAddToCart = (product: Product) => {
    const price = getPrice(product);
    addItem(
      {
        productId: product.id,
        name: product.name,
        price: price,
        image: product.images?.[0] || "",
        sku: product.sku,
        quantity: 1,
      },
      1
    );
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gold-50 via-gold-100 to-gold-200 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <div className="mb-6">
            <Badge className="bg-gold-600 text-white px-4 py-2 text-sm font-medium">
              ✨ Perfumes Originais Importados
            </Badge>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Desperte Seus
            <span className="block hp-text-gradient">Sentidos</span>
          </h1>

          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Descobra nossa coleção exclusiva de perfumes e cosméticos
            importados. Qualidade garantida, entrega rápida e preços especiais
            para revendedores.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/produtos">
              <Button size="lg" className="hp-gradient text-white px-8 py-3">
                <Sparkles className="w-5 h-5 mr-2" />
                Ver Produtos
              </Button>
            </Link>
            <Link href="/produtos">
              <Button variant="outline" size="lg" className="px-8 py-3">
                <Heart className="w-5 h-5 mr-2" />
                Perfumes Femininos
              </Button>
            </Link>
          </div>

          {customer?.type === "wholesale" && (
            <div className="mt-8 p-4 bg-green-100 border border-green-200 rounded-lg inline-block">
              <p className="text-green-800 font-medium">
                🎉 Você tem preços especiais de atacado!
              </p>
            </div>
          )}

          {/* PIX Destaque */}
          <div className="mt-8 p-4 bg-blue-100 border border-blue-200 rounded-lg inline-block">
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <p className="text-blue-800 font-medium">
                Pagamento via PIX - Rápido e Seguro
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gold-600" />
              </div>
              <h3 className="font-semibold mb-2">Entrega Rápida</h3>
              <p className="text-gray-600 text-sm">
                Enviamos para todo o Brasil com agilidade e cuidado
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-gold-600" />
              </div>
              <h3 className="font-semibold mb-2">100% Originais</h3>
              <p className="text-gray-600 text-sm">
                Garantia de autenticidade em todos os produtos
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Pagamento PIX</h3>
              <p className="text-gray-600 text-sm">
                Forma mais rápida e segura de finalizar sua compra
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-gold-600" />
              </div>
              <h3 className="font-semibold mb-2">Atendimento VIP</h3>
              <p className="text-gray-600 text-sm">
                Suporte especializado via WhatsApp
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Produtos em Destaque
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Conheça nossa seleção especial de perfumes mais procurados
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => {
                const price = getPrice(product);
                const isWholesale = customer?.type === "wholesale";
                const originalPrice = product.retail_price;

                const handleCardClick = (e: React.MouseEvent) => {
                  // Impede a navegação se o clique foi no botão de adicionar ao carrinho
                  if ((e.target as HTMLElement).closest('[data-cart-button]')) {
                    e.preventDefault();
                    return;
                  }
                };

                return (
                  <Link href={`/produtos/${product.id}`} key={product.id} onClick={handleCardClick}>
                    <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md cursor-pointer">
                      <CardContent className="p-0">
                        <div className="relative">
                          <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
                            {product.images?.[0] ? (
                              <Image
                                width={350}
                                height={350}
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                <div className="text-center text-gray-500">
                                  <div className="w-16 h-16 mx-auto mb-2 bg-gray-300 rounded-lg flex items-center justify-center">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                                      <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2" />
                                      <polyline points="21,15 16,10 5,21" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                  </div>
                                  <span className="text-sm">Sem imagem</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {isWholesale && (
                            <Badge className="absolute top-2 left-2 bg-green-600 text-white">
                              Atacado
                            </Badge>
                          )}

                          {product.stock <= 5 && (
                            <Badge className="absolute top-2 right-2 bg-red-600 text-white">
                              Últimas unidades
                            </Badge>
                          )}
                        </div>

                        <div className="p-4">
                          <Badge variant="outline" className="mb-2 text-xs">
                            {product.brand}
                          </Badge>

                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                            {product.name}
                          </h3>

                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {product.description.substring(0, 80)}...
                          </p>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                {isWholesale && originalPrice !== price && (
                                  <span className="text-sm text-gray-500 line-through">
                                    R$ {originalPrice.toFixed(2)}
                                  </span>
                                )}
                                <div className="text-lg font-bold text-gold-600">
                                  R$ {price.toFixed(2)}
                                </div>
                              </div>
                              <div className="text-sm text-gray-500">
                                Estoque: {product.stock}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                className="flex-1 text-xs"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                              >
                                Ver Detalhes
                              </Button>
                              <Button
                                data-cart-button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleAddToCart(product);
                                }}
                                className="hp-gradient text-white"
                                disabled={product.stock === 0}
                              >
                                <ShoppingCart className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/produtos">
              <Button variant="outline" size="lg" className="px-8">
                Ver Todos os Produtos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* PIX Benefits Section */}
      <section className="py-16 bg-blue-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Por que escolher PIX?
            </h2>
            <p className="text-gray-600">
              A forma mais moderna e segura de pagamento do Brasil
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Instantâneo</h3>
              <p className="text-gray-600 text-sm">
                Pagamento processado na hora, pedido liberado imediatamente
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Seguro</h3>
              <p className="text-gray-600 text-sm">
                Tecnologia do Banco Central, máxima segurança garantida
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Sem Taxa</h3>
              <p className="text-gray-600 text-sm">
                Zero taxas para você, pagamento direto e econômico
              </p>
            </div>
          </div>

          <div className="mt-8 p-6 bg-white rounded-lg shadow-sm border">
            <h3 className="font-semibold mb-3">Como funciona?</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                1. Finalize seu pedido e escolha PIX como forma de pagamento
              </p>
              <p>2. Escaneie o QR Code ou copie a chave PIX</p>
              <p>3. Confirme o pagamento no seu banco</p>
              <p>4. Pronto! Seu pedido será processado automaticamente</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-gradient-to-br from-gold-600 to-gold-700">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Fique por dentro das novidades
          </h2>
          <p className="text-gold-100 mb-8">
            Receba ofertas exclusivas, lançamentos e dicas de beleza direto no
            seu email
          </p>

          <div className="max-w-md mx-auto flex gap-2">
            <input
              type="email"
              placeholder="Seu melhor email"
              className="flex-1 px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white"
            />
            <Button className="bg-white text-gold-700 hover:bg-gray-100 px-6">
              Cadastrar
            </Button>
          </div>

          <p className="text-gold-200 text-sm mt-4">
            Não enviamos spam. Cancele quando quiser.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-8">
            Precisa de ajuda? Fale conosco!
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-2">WhatsApp</h3>
              <p className="text-gray-300 mb-4">(21) 99999-9999</p>
              <Button className="bg-green-600 hover:bg-green-700">
                Conversar Agora
              </Button>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Email</h3>
              <p className="text-gray-300 mb-4">contato@hpmarcas.com.br</p>
              <Button
                variant="outline"
                className="text-white border-white hover:bg-white hover:text-gray-900"
              >
                Enviar Email
              </Button>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Loja Física</h3>
              <p className="text-gray-300 mb-4">
                Av. Presidente Vargas, 633 - Centro/RJ
              </p>
              <Button
                variant="outline"
                className="text-white border-white hover:bg-white hover:text-gray-900"
              >
                Ver no Mapa
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
