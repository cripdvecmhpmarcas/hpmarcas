'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { ProductForm } from '@/components/dashboard/produtos/ProductForm'

interface EditProductPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const router = useRouter()
  const { id } = use(params)

  const handleCancel = () => {
    router.push('/dashboard/produtos')
  }

  return (
    <div className="min-h-screen bg-background">
      <ProductForm 
        productId={id} 
        onCancel={handleCancel} 
      />
    </div>
  )
}