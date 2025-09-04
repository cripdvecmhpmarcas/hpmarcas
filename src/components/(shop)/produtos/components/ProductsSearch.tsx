import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { ProductsSearchProps } from "../types";

export function ProductsSearch({ 
  searchValue, 
  onSearchChange, 
  placeholder = "Buscar por nome, marca ou SKU...",
  className = ""
}: ProductsSearchProps) {
  return (
    <div className={`flex-1 relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <Input
        placeholder={placeholder}
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
}