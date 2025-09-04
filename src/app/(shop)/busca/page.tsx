"use client";

import { useSupabasePublic } from "@/hooks/useSupabasePublic";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Search, ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { useAnonymousAuth } from "@/components/auth/AnonymousAuthProvider";

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  retail_price: number;
  wholesale_price: number;
  images: string[] | null;
  description: string;
  sku: string;
  stock: number;
}

function SearchResultsPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const { addItem } = useCart();
  const { customer } = useAnonymousAuth();
  const { supabase } = useSupabasePublic();

  const performSearch = React.useCallback(
    async (searchTerm: string) => {
      if (!searchTerm.trim()) return;

      setLoading(true);
      setSearchPerformed(true);

      try {
        // Busca em múltiplos campos
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("status", "active")
          .or(
            `name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`
          )
          .order("name");

        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error("Erro na busca:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery, performSearch]);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);

    // Atualizar URL
    const url = new URL(window.location.href);
    url.searchParams.set("q", query);
    window.history.pushState({}, "", url.toString());
  };

  const clearSearch = () => {
    setQuery("");
    setProducts([]);
    setSearchPerformed(false);

    // Limpar URL
    const url = new URL(window.location.href);
    url.searchParams.delete("q");
    window.history.pushState({}, "", url.toString());
  };

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

  // Agrupar resultados por categoria para melhor organização
  const groupedProducts = products.reduce((acc, product) => {
    const category = product.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/produtos">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar aos Produtos
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Resultados da Busca
            </h1>
          </div>

          {searchPerformed && (
            <p className="text-gray-600">
              {loading
                ? "Buscando..."
                : products.length === 0
                  ? `Nenhum resultado encontrado para "${initialQuery}"`
                  : `${products.length} produto${products.length !== 1 ? "s" : ""
                  } encontrado${products.length !== 1 ? "s" : ""
                  } para "${initialQuery}"`}
            </p>
          )}
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Buscar produtos, marcas, SKU..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-12 text-base py-6"
                />
                {query && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <Button type="submit" size="lg" className="px-8">
                <Search className="w-5 h-5 mr-2" />
                Buscar
              </Button>
            </form>

            {/* Quick Search Suggestions */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">Sugestões:</span>
              {["Perfume", "Chanel", "Azzaro", "Feminino", "Masculino"].map(
                (suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setQuery(suggestion);
                      performSearch(suggestion);
                    }}
                    className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors"
                  >
                    {suggestion}
                  </button>
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
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
        )}

        {/* No Results */}
        {!loading && searchPerformed && products.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Não encontramos produtos que correspondam à sua busca &quot;
              {initialQuery}&quot;. Tente usar outros termos ou navegue por
              nossas categorias.
            </p>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="text-sm text-gray-600">Tente buscar por:</span>
                {[
                  "Perfume masculino",
                  "Perfume feminino",
                  "Chanel",
                  "Azzaro",
                  "Cosméticos",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setQuery(suggestion);
                      performSearch(suggestion);
                    }}
                    className="text-sm bg-gold-100 hover:bg-gold-200 text-gold-800 px-3 py-1 rounded-full transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <div className="flex gap-4 justify-center">
                <Link href="/produtos">
                  <Button variant="outline">Ver Todos os Produtos</Button>
                </Link>
                <Button onClick={clearSearch}>Nova Busca</Button>
              </div>
            </div>
          </div>
        )}

        {/* Results by Category */}
        {!loading && products.length > 0 && (
          <div className="space-y-12">
            {Object.entries(groupedProducts).map(
              ([category, categoryProducts]) => (
                <section key={category}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {category} ({categoryProducts.length})
                    </h2>
                    {customer?.type === "wholesale" && (
                      <Badge className="bg-green-600 text-white">
                        Preços de atacado
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {categoryProducts.map((product) => {
                      const price = getPrice(product);
                      const isWholesale = customer?.type === "wholesale";
                      const originalPrice = product.retail_price;

                      return (
                        <Card
                          key={product.id}
                          className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md"
                        >
                          <CardContent className="p-0">
                            <div className="relative">
                              <Link href={`/produtos/${product.id}`}>
                                <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
                                  {product.images?.[0] ? (
                                    <Image
                                      width={300}
                                      height={300}
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
                              </Link>

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

                              <Link href={`/produtos/${product.id}`}>
                                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-gold-600 transition-colors">
                                  {product.name}
                                </h3>
                              </Link>

                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                SKU: {product.sku}
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
                                  <Link
                                    href={`/produtos/${product.id}`}
                                    className="flex-1"
                                  >
                                    <Button
                                      variant="outline"
                                      className="w-full text-xs"
                                    >
                                      Ver Detalhes
                                    </Button>
                                  </Link>
                                  <Button
                                    onClick={() => handleAddToCart(product)}
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
                      );
                    })}
                  </div>
                </section>
              )
            )}
          </div>
        )}

        {/* Show All Products Link */}
        {!loading && !searchPerformed && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Faça sua busca
            </h3>
            <p className="text-gray-600 mb-6">
              Digite o nome do produto, marca ou SKU que você está procurando
            </p>
            <Link href="/produtos">
              <Button variant="outline" size="lg">
                Ver Todos os Produtos
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={<div>Carregando busca...</div>}>
      <SearchResultsPageContent />
    </Suspense>
  );
}
