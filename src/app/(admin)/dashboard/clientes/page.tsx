"use client"

import React, { useState } from 'react'
import { CustomerList, CustomerDetails } from '@/components/dashboard/clientes'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function ClientesPage() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'details'>('list')

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId)
    setViewMode('details')
  }

  const handleBackToList = () => {
    setSelectedCustomerId(null)
    setViewMode('list')
  }

  return (
    <div className="flex-1">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {viewMode === 'details' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToList}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            )}
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                {viewMode === 'details' ? 'Detalhes do Cliente' : 'Gestão de Clientes'}
              </h2>
              <p className="text-gray-600 mt-2">
                {viewMode === 'details' 
                  ? 'Visualize informações detalhadas do cliente selecionado.'
                  : 'Visualize e gerencie informações dos clientes cadastrados no sistema.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {viewMode === 'list' ? (
          <CustomerList onCustomerSelect={handleCustomerSelect} />
        ) : (
          <CustomerDetails 
            customerId={selectedCustomerId} 
            onClose={handleBackToList}
          />
        )}
      </div>
    </div>
  )
}