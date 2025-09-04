'use client'

import { useRouter } from 'next/navigation'
import { ProductsTable } from '@/components/dashboard/produtos/ProductsTable'

export default function ProdutosPage() {
  const router = useRouter()

  const handleCreateProduct = () => {
    router.push('/dashboard/produtos/novo')
  }

  const handleEditProduct = (id: string) => {
    router.push(`/dashboard/produtos/${id}/editar`)
  }

  const handleViewProduct = (id: string) => {
    router.push(`/dashboard/produtos/${id}`)
  }

  return (
    <div className="container mx-auto p-6">
      <ProductsTable
        onCreateProduct={handleCreateProduct}
        onEditProduct={handleEditProduct}
        onViewProduct={handleViewProduct}
      />
    </div>
  )
}