import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/useCategories";
import type { ActiveFiltersProps } from "../types";

export function ActiveFilters({
  filters,
  onFilterRemove,
  onClearAll,
}: ActiveFiltersProps) {
  const { getCategoryPath } = useCategories();
  return (
    <div className="mt-4 pt-4 border-t flex items-center gap-2 flex-wrap">
      <span className="text-sm text-gray-600">Filtros ativos:</span>

      {filters.brand && (
        <Badge variant="secondary" className="gap-1">
          Marca: {filters.brand}
          <button onClick={() => onFilterRemove("brand")}>
            <X className="w-3 h-3" />
          </button>
        </Badge>
      )}

      {filters.subcategory_id && (
        <Badge variant="secondary" className="gap-1">
          Categoria: {getCategoryPath(filters.subcategory_id)}
          <button onClick={() => onFilterRemove("subcategory_id")}>
            <X className="w-3 h-3" />
          </button>
        </Badge>
      )}

      {filters.category && !filters.subcategory_id && (
        <Badge variant="secondary" className="gap-1">
          Categoria: {filters.category}
          <button onClick={() => onFilterRemove("category")}>
            <X className="w-3 h-3" />
          </button>
        </Badge>
      )}

      {filters.minPrice && (
        <Badge variant="secondary" className="gap-1">
          Preço min: R$ {filters.minPrice}
          <button onClick={() => onFilterRemove("minPrice")}>
            <X className="w-3 h-3" />
          </button>
        </Badge>
      )}

      {filters.maxPrice && (
        <Badge variant="secondary" className="gap-1">
          Preço max: R$ {filters.maxPrice}
          <button onClick={() => onFilterRemove("maxPrice")}>
            <X className="w-3 h-3" />
          </button>
        </Badge>
      )}

      {filters.sortBy !== "name" && (
        <Badge variant="secondary" className="gap-1">
          Ordenação: {filters.sortBy}
          <button onClick={() => onFilterRemove("sortBy")}>
            <X className="w-3 h-3" />
          </button>
        </Badge>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="text-red-600 hover:text-red-700"
      >
        Limpar todos
      </Button>
    </div>
  );
}