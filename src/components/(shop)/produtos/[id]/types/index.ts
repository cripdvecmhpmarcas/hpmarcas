import type { Product, ProductVolume } from "@/types/products";

// Estender o tipo Product com campos específicos da página
export type ProductWithDetails = Product;

// Interface para volume com preço formatado
export interface VolumeDisplay {
  size: string;
  unit: string;
  price?: string; // Opcional, será calculado dinamicamente
  barcode?: string;
  price_adjustment?: number;
}

// Interface para volume selecionado
export interface SelectedVolume extends ProductVolume {
  isSelected: boolean;
  calculatedPrice: number;
}

// Props para componentes
export interface ProductGalleryProps {
  images: string[] | null;
  name: string;
  selectedIndex?: number;
  onImageSelect?: (index: number) => void;
}

export interface ProductInfoProps {
  product: ProductWithDetails;
}

export interface ProductPricingProps {
  product: ProductWithDetails;
  currentPrice: number;
  originalPrice: number;
  discount: number;
  isWholesale: boolean;
}

export interface ProductActionsProps {
  product: ProductWithDetails;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: () => void;
  isInCart: boolean;
  canAddToCart: boolean;
}

export interface ProductVolumeDisplayProps {
  volumes: ProductVolume[] | null;
  selectedVolume?: ProductVolume | null;
  onVolumeSelect?: (volume: ProductVolume) => void;
  basePrice: number;
}

export interface ProductBadgesProps {
  isWholesale: boolean;
  discount: number;
  stock: number;
}

export interface ProductFeaturesProps {
  className?: string;
}

export interface ProductRelatedProps {
  categoryId: string;
  excludeId: string;
}

export interface ProductBreadcrumbProps {
  product: ProductWithDetails;
}

// Estados dos hooks
export interface UseProductReturn {
  product: ProductWithDetails | null;
  loading: boolean;
  error: string | null;
  refreshProduct: () => Promise<void>;
}

export interface UseProductPricingReturn {
  currentPrice: number;
  originalPrice: number;
  discount: number;
  isWholesale: boolean;
  selectedVolume?: ProductVolume | null;
  priceDisplay: {
    formatted: string;
    originalFormatted: string;
    hasDiscount: boolean;
    discountPercent: number;
  };
}

export interface UseProductGalleryReturn {
  images: string[];
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  nextImage: () => void;
  prevImage: () => void;
  hasMultipleImages: boolean;
}

export interface UseProductActionsReturn {
  quantity: number;
  setQuantity: (quantity: number) => void;
  incrementQuantity: () => void;
  decrementQuantity: () => void;
  handleAddToCart: () => void;
  isInCart: boolean;
  canAddToCart: boolean;
  maxQuantity: number;
}

export interface UseRelatedProductsReturn {
  relatedProducts: ProductWithDetails[];
  loading: boolean;
  error: string | null;
}
