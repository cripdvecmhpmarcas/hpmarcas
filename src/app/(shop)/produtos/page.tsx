"use client";

import { useState } from "react";
import { useCart } from "@/components/(shop)/carrinho/hooks/useCart";
import { useAnonymousAuth } from "@/components/auth/AnonymousAuthProvider";
import {
  ProductsHeader,
  ProductsSearch,
  ProductsFilters,
  ProductsResults,
  ProductsGrid,
  ProductsList,
  ProductsSkeleton,
  ProductsEmpty,
  useProducts,
  useProductFilters,
  useProductView,
} from "@/components/(shop)/produtos";
import type { Product } from "@/types/products";

export default function ProductsPage() {
  const [showFilters, setShowFilters] = useState(false);

  // Hooks customizados
  const { products, loading, error, brands, categories } = useProducts();
  const { filteredProducts, filters, setFilters, clearFilters, hasActiveFilters } = useProductFilters(products);
  const { viewMode, setViewMode } = useProductView();

  const { addItem } = useCart();
  const { customer } = useAnonymousAuth();

  const handleAddToCart = (product: Product) => {
    addItem(product.id, 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <ProductsHeader />

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <ProductsSearch
              searchValue={filters.search}
              onSearchChange={(value) => setFilters({ search: value })}
            />
            
            <ProductsFilters
              filters={filters}
              onFiltersChange={setFilters}
              brands={brands}
              categories={categories}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters(!showFilters)}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={clearFilters}
            />
          </div>
        </div>

        {/* Results Info and View Toggle */}
        <ProductsResults
          filteredCount={filteredProducts.length}
          totalCount={products.length}
          isWholesale={customer?.type === "wholesale"}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Products Content */}
        {loading ? (
          <ProductsSkeleton viewMode={viewMode} />
        ) : error ? (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Erro ao carregar produtos
            </h3>
            <p className="text-gray-600 mb-6">{error}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <ProductsEmpty 
            onClearFilters={clearFilters} 
            hasActiveFilters={hasActiveFilters}
          />
        ) : viewMode === "grid" ? (
          <ProductsGrid 
            products={filteredProducts} 
            onAddToCart={handleAddToCart} 
          />
        ) : (
          <ProductsList 
            products={filteredProducts} 
            onAddToCart={handleAddToCart} 
          />
        )}

        {/* Pagination Info */}
        {filteredProducts.length > 0 && (
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Mostrando {filteredProducts.length} de {products.length} produtos
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
