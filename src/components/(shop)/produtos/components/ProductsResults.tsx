import { Badge } from "@/components/ui/badge";
import { ProductsViewToggle } from "./ProductsViewToggle";
import type { ProductsResultsProps } from "../types";

export function ProductsResults({
  filteredCount,
  totalCount,
  isWholesale,
  viewMode,
  onViewModeChange,
}: ProductsResultsProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <p className="text-gray-600">
        {filteredCount} produto{filteredCount !== 1 ? "s" : ""} encontrado{filteredCount !== 1 ? "s" : ""}
        {filteredCount !== totalCount && ` de ${totalCount} total`}
      </p>

      <div className="flex items-center gap-4">
        {isWholesale && (
          <Badge className="bg-green-600 text-white">
            Preços de atacado aplicados
          </Badge>
        )}
        
        <ProductsViewToggle 
          viewMode={viewMode} 
          onViewModeChange={onViewModeChange} 
        />
      </div>
    </div>
  );
}