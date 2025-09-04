'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
  Eye,
  Download,
  TrendingUp
} from 'lucide-react'
import { SaleWithDetails } from '@/types/sales'

interface SalesTableActionsProps {
  sale: SaleWithDetails
  onViewSale?: (saleId: string) => void
  onViewReceipt?: (saleId: string) => void
  onPrintReceipt?: (saleId: string) => void
  onDownloadPDF?: (saleId: string) => void
  onViewProfit?: (saleId: string) => void
}

export function SalesTableActions({
  sale,
  onViewSale,
  onDownloadPDF,
  onViewProfit
}: SalesTableActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Ações</DropdownMenuLabel>

        <DropdownMenuItem onClick={() => onViewSale?.(sale.id)}>
          <Eye className="h-4 w-4 mr-2" />
          Visualizar Detalhes
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => onDownloadPDF?.(sale.id)}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => onViewProfit?.(sale.id)}>
          <TrendingUp className="h-4 w-4 mr-2" />
          Análise de Lucro
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
