'use client'

import { useRouter } from 'next/navigation'
import { ProductForm } from '@/components/dashboard/produtos/ProductForm'

export default function NovoProductPage() {
  const router = useRouter()

  const handleCancel = () => {
    router.push('/dashboard/produtos')
  }

  return (
    <div className="min-h-screen bg-background">
      <ProductForm onCancel={handleCancel} />
    </div>
  )
}