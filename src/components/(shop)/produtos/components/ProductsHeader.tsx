import type { ProductsHeaderProps } from "../types";

export function ProductsHeader({ className = "" }: ProductsHeaderProps) {
  return (
    <div className={`mb-8 ${className}`}>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Nossos Produtos
      </h1>
      <p className="text-gray-600">
        Descubra nossa coleção completa de perfumes e cosméticos importados
      </p>
    </div>
  );
}