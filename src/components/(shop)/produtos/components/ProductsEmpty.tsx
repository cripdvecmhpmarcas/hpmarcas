import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProductsEmptyProps } from "../types";

export function ProductsEmpty({ onClearFilters, hasActiveFilters }: ProductsEmptyProps) {
  return (
    <div className="text-center py-16">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Search className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Nenhum produto encontrado
      </h3>
      <p className="text-gray-600 mb-6">
        {hasActiveFilters 
          ? "Tente ajustar os filtros ou buscar por outros termos"
          : "Não há produtos disponíveis no momento"
        }
      </p>
      {hasActiveFilters && (
        <Button onClick={onClearFilters}>Limpar filtros</Button>
      )}
    </div>
  );
}