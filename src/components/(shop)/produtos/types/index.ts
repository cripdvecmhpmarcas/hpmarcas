import type { Product } from "@/types/products";

// Interfaces para filtros da listagem de produtos
export interface ProductListFilters {
  search: string;
  brand: string;
  category: string;
  subcategory_id?: string;
  minPrice: string;
  maxPrice: string;
  sortBy: string;
}

// Tipo para modo de visualização
export type ProductListViewMode = "grid" | "list";

// Opções de ordenação
export type ProductListSortOption = 
  | "name" 
  | "brand" 
  | "price_asc" 
  | "price_desc";

// Interface para produto com campos calculados para exibição
export interface ProductDisplayItem extends Product {
  displayPrice: number;
  originalPrice: number;
  hasDiscount: boolean;
  discountPercent: number;
  isWholesale: boolean;
  stockStatus: "in_stock" | "low_stock" | "out_of_stock";
}

// Props para componentes
export interface ProductsHeaderProps {
  className?: string;
}

export interface ProductsSearchProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export interface ProductsFiltersProps {
  filters: ProductListFilters;
  onFiltersChange: (filters: Partial<ProductListFilters>) => void;
  brands: string[];
  categories: string[];
  showFilters: boolean;
  onToggleFilters: () => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export interface ProductsViewToggleProps {
  viewMode: ProductListViewMode;
  onViewModeChange: (mode: ProductListViewMode) => void;
}

export interface ProductCardProps {
  product: ProductDisplayItem;
  onAddToCart: (product: Product) => void;
  className?: string;
}

export interface ProductListItemProps {
  product: ProductDisplayItem;
  onAddToCart: (product: Product) => void;
  className?: string;
}

export interface ProductsGridProps {
  products: ProductDisplayItem[];
  onAddToCart: (product: Product) => void;
  className?: string;
}

export interface ProductsListProps {
  products: ProductDisplayItem[];
  onAddToCart: (product: Product) => void;
  className?: string;
}

export interface ProductsSkeletonProps {
  viewMode: ProductListViewMode;
  itemCount?: number;
}

export interface ProductsEmptyProps {
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export interface ProductsResultsProps {
  filteredCount: number;
  totalCount: number;
  isWholesale: boolean;
  viewMode: ProductListViewMode;
  onViewModeChange: (mode: ProductListViewMode) => void;
}

export interface ActiveFiltersProps {
  filters: ProductListFilters;
  onFilterRemove: (key: keyof ProductListFilters) => void;
  onClearAll: () => void;
  brands: string[];
  categories: string[];
}

// Return types dos hooks
export interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  refreshProducts: () => Promise<void>;
  brands: string[];
  categories: string[];
}

export interface UseProductFiltersReturn {
  filteredProducts: ProductDisplayItem[];
  filters: ProductListFilters;
  setFilters: (filters: Partial<ProductListFilters>) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  activeFiltersCount: number;
}

export interface UseProductSearchReturn {
  searchValue: string;
  setSearchValue: (value: string) => void;
  clearSearch: () => void;
}

export interface UseProductSortReturn {
  sortBy: ProductListSortOption;
  setSortBy: (sort: ProductListSortOption) => void;
  sortedProducts: Product[];
}

export interface UseProductViewReturn {
  viewMode: ProductListViewMode;
  setViewMode: (mode: ProductListViewMode) => void;
  toggleViewMode: () => void;
}

// Constantes
export const SORT_OPTIONS = {
  name: "Nome A-Z",
  brand: "Marca",
  price_asc: "Menor preço",
  price_desc: "Maior preço"
} as const;

export const DEFAULT_FILTERS: ProductListFilters = {
  search: "",
  brand: "",
  category: "",
  subcategory_id: "",
  minPrice: "",
  maxPrice: "",
  sortBy: "name"
};