"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCustomerAuth } from "@/components/auth/CustomerAuthProvider";
import { CustomerLoginModal } from "@/components/auth/CustomerLoginModal";
import { useCategories } from "@/hooks/useCategories";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  Heart,
  Package,
  MapPin,
  LogOut,
} from "lucide-react";

interface CustomerHeaderProps {
  cartItemCount?: number;
}

export const CustomerHeader: React.FC<CustomerHeaderProps> = ({
  cartItemCount = 0,
}) => {
  const { user, loading, isGuest, signOut } = useCustomerAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { categories, loading: categoriesLoading } = useCategories();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/busca?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gold-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">HP</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-gray-900">HP Marcas</span>
              <span className="block text-xs text-gray-500">
                Perfumes Importados
              </span>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <form onSubmit={handleSearch} className="w-full relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Buscar produtos, marcas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 w-full"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Favorites */}
            <Button variant="ghost" size="sm" className="relative">
              <Heart className="h-5 w-5" />
              <span className="sr-only">Favoritos</span>
            </Button>

            {/* Cart */}
            <Link href="/carrinho">
              <Button variant="ghost" size="sm" className="relative">
                <ShoppingCart className="h-5 w-5" />
                <span className="sr-only">Carrinho</span>
                {cartItemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-gold-500 text-white text-xs min-w-[1.25rem] h-5 flex items-center justify-center">
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* User Account */}
            {!loading && (
              !user ? (
                <CustomerLoginModal
                  trigger={
                    <Button variant="outline" size="sm">
                      <User className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Entrar</span>
                    </Button>
                  }
                />
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="space-x-2">
                      <User className="h-4 w-4" />
                      <span className="hidden lg:inline max-w-[100px] truncate">
                        {user?.customerProfile?.name || "Minha Conta"}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user?.customerProfile?.name || "Cliente"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.customerProfile?.email}
                        </p>
                        {user?.customerProfile?.type === "wholesale" && (
                          <Badge className="bg-green-600 text-white text-xs w-fit">
                            Cliente Atacado
                          </Badge>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/minha-conta" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Minha conta
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/minha-conta/pedidos"
                        className="cursor-pointer"
                      >
                        <Package className="mr-2 h-4 w-4" />
                        Meus pedidos
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="text-red-600 focus:text-red-600 cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Mobile Cart */}
            <Link href="/carrinho">
              <Button variant="ghost" size="sm" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-gold-500 text-white text-xs min-w-[1.25rem] h-5 flex items-center justify-center">
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
              className="p-1"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-4">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar produtos, marcas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-4 space-y-4">
            {/* Navigation Links */}
            <div className="space-y-2">
              <Link
                href="/produtos"
                className="block py-2 text-gray-700 hover:text-gold-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Todos os Produtos
              </Link>
              {!categoriesLoading && categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/produtos?subcategory_id=${category.id}`}
                  className="block py-2 text-gray-700 hover:text-gold-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
            </div>

            <hr className="border-gray-200" />

            {/* User Section */}
            {user && !isGuest ? (
              <div className="space-y-2">
                <div className="py-2">
                  <p className="font-medium text-gray-900">{user?.customerProfile?.name}</p>
                  <p className="text-sm text-gray-600">{user?.customerProfile?.email}</p>
                  {user?.customerProfile?.type === "wholesale" && (
                    <Badge className="bg-green-600 text-white text-xs mt-1">
                      Cliente Atacado
                    </Badge>
                  )}
                </div>

                <Link
                  href="/minha-conta"
                  className="flex items-center py-2 text-gray-700 hover:text-gold-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="mr-3 h-4 w-4" />
                  Minha Conta
                </Link>

                <Link
                  href="/minha-conta/pedidos"
                  className="flex items-center py-2 text-gray-700 hover:text-gold-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Package className="mr-3 h-4 w-4" />
                  Meus Pedidos
                </Link>

                <Link
                  href="/minha-conta/enderecos"
                  className="flex items-center py-2 text-gray-700 hover:text-gold-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <MapPin className="mr-3 h-4 w-4" />
                  Endereços
                </Link>

                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center py-2 text-red-600 hover:text-red-700 transition-colors w-full text-left"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Sair
                </button>
              </div>
            ) : (
              <div className="py-2">
                <CustomerLoginModal
                  trigger={
                    <Button className="w-full justify-start" variant="outline">
                      <User className="mr-2 h-4 w-4" />
                      Fazer Login
                    </Button>
                  }
                />
              </div>
            )}

            <hr className="border-gray-200" />

            {/* Quick Actions */}
            <div className="space-y-2">
              <Link
                href="/carrinho"
                className="flex items-center py-2 text-gray-700 hover:text-gold-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <ShoppingCart className="mr-3 h-4 w-4" />
                Carrinho ({cartItemCount})
              </Link>

              <button className="flex items-center py-2 text-gray-700 hover:text-gold-600 transition-colors w-full text-left">
                <Heart className="mr-3 h-4 w-4" />
                Favoritos
              </button>
            </div>

            <hr className="border-gray-200" />

            {/* Contact Info */}
            <div className="py-2 space-y-1">
              <p className="text-sm font-medium text-gray-900">
                Precisa de ajuda?
              </p>
              <p className="text-sm text-gray-600">WhatsApp: (21) 99999-9999</p>
              <p className="text-sm text-gray-600">
                Email: contato@hpmarcas.com.br
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Bar - Desktop */}
      <div className="hidden md:block border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8 py-3">
            <Link
              href="/produtos"
              className="text-sm font-medium text-gray-700 hover:text-gold-600 transition-colors py-1"
            >
              Todos os Produtos
            </Link>
            {!categoriesLoading && categories.slice(0, 4).map((category) => (
              <Link
                key={category.id}
                href={`/produtos?subcategory_id=${category.id}`}
                className="text-sm font-medium text-gray-700 hover:text-gold-600 transition-colors py-1"
              >
                {category.name}
              </Link>
            ))}

            {user?.customerProfile?.type === "wholesale" && (
              <Badge className="bg-green-600 text-white text-xs px-2 py-1">
                Preços de Atacado Ativos
              </Badge>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
