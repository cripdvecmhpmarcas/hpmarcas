import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategorySelect } from "@/components/ui/category-select";
import { ActiveFilters } from "./ActiveFilters";
import { SORT_OPTIONS } from "../types";
import type { ProductsFiltersProps } from "../types";

export function ProductsFilters({
  filters,
  onFiltersChange,
  brands,
  categories,
  showFilters,
  onToggleFilters,
  hasActiveFilters,
  onClearFilters,
}: ProductsFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        {/* Filters Toggle */}
        <Button
          variant="outline"
          onClick={onToggleFilters}
          className="flex items-center gap-2"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtros
          {hasActiveFilters && (
            <Badge className="bg-gold-600 text-white ml-1">
              {Object.values(filters).filter((v) => v !== "" && v !== "name").length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Extended Filters */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Brand Filter */}
          <Select
            value={filters.brand || "all"}
            onValueChange={(value: string) =>
              onFiltersChange({
                brand: value === "all" ? "" : value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as marcas</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <CategorySelect
            value={filters.subcategory_id}
            onValueChange={(value) => {
              onFiltersChange({
                subcategory_id: value,
                // Clear legacy category when subcategory is selected
                category: value ? "" : filters.category
              })
            }}
            placeholder="Todas as categorias"
            allowClear={true}
          />
          
          {/* Legacy Category Filter - only show if no subcategory selected */}
          {!filters.subcategory_id && (
            <Select
              value={filters.category || "all"}
              onValueChange={(value: string) =>
                onFiltersChange({
                  category: value === "all" ? "" : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Categorias legadas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Price Range */}
          <Input
            placeholder="Preço mín."
            type="number"
            value={filters.minPrice}
            onChange={(e) =>
              onFiltersChange({ minPrice: e.target.value })
            }
          />

          <Input
            placeholder="Preço máx."
            type="number"
            value={filters.maxPrice}
            onChange={(e) =>
              onFiltersChange({ maxPrice: e.target.value })
            }
          />

          {/* Sort */}
          <Select
            value={filters.sortBy}
            onValueChange={(value: string) =>
              onFiltersChange({ sortBy: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SORT_OPTIONS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Active Filters */}
      {hasActiveFilters && (
        <ActiveFilters
          filters={filters}
          onFilterRemove={(key) => onFiltersChange({ [key]: key === 'sortBy' ? 'name' : '' })}
          onClearAll={onClearFilters}
          brands={brands}
          categories={categories}
        />
      )}
    </div>
  );
}