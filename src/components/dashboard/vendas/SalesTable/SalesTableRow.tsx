'use client'

import React from 'react'
import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { SaleWithDetails, CUSTOMER_TYPES, PAYMENT_METHODS } from '@/types/sales'
import { formatCurrency } from '@/lib/utils'
import { SalesTableActions } from './SalesTableActions'

interface SalesTableRowProps {
  sale: SaleWithDetails
  formatDate: (dateString: string) => string
  onViewSale?: (saleId: string) => void
  onViewReceipt?: (saleId: string) => void
  onPrintReceipt?: (saleId: string) => void
  onDownloadPDF?: (saleId: string) => void
  onViewProfit?: (saleId: string) => void
  variant?: 'desktop' | 'mobile'
}

export function SalesTableRow({
  sale,
  formatDate,
  onViewSale,
  onViewReceipt,
  onPrintReceipt,
  onDownloadPDF,
  onViewProfit,
  variant = 'desktop'
}: SalesTableRowProps) {
  // Format profit margin with color coding
  const formatProfitMargin = (margin: number) => {
    const color = margin >= 30 ? 'text-green-600' : margin >= 15 ? 'text-yellow-600' : 'text-red-600'
    return <span className={color}>{margin.toFixed(1)}%</span>
  }

  // Get status badge component
  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: 'Pendente', variant: 'secondary' as const },
      completed: { label: 'Concluída', variant: 'default' as const },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const },
      refunded: { label: 'Estornada', variant: 'outline' as const }
    }

    const statusConfig = config[status as keyof typeof config] || config.pending
    return (
      <Badge variant={statusConfig.variant}>
        {statusConfig.label}
      </Badge>
    )
  }

  // Get payment method display
  const getPaymentMethodDisplay = (method: string) => {
    return PAYMENT_METHODS[method as keyof typeof PAYMENT_METHODS] || method
  }

  if (variant === 'mobile') {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-xs text-muted-foreground">#{sale.id.slice(-8)}</p>
                <p className="font-medium">{sale.customer_name}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{formatCurrency(sale.total)}</p>
                {getStatusBadge(sale.status)}
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Data</p>
                <p>{formatDate(sale.created_at).split(' ')[0]}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Vendedor</p>
                <p>{sale.salesperson_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Itens</p>
                <p>{sale.items_count || sale.sale_items?.length || 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Lucro</p>
                <p className="font-medium text-green-600">
                  {sale.total_profit ? formatCurrency(sale.total_profit) : '-'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Pagamento</p>
                <p>{getPaymentMethodDisplay(sale.payment_method)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Margem</p>
                <p>{sale.profit_margin ? formatProfitMargin(sale.profit_margin) : '-'}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-2 border-t">
              <SalesTableActions
                sale={sale}
                onViewSale={onViewSale}
                onViewReceipt={onViewReceipt}
                onPrintReceipt={onPrintReceipt}
                onDownloadPDF={onDownloadPDF}
                onViewProfit={onViewProfit}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <TableRow>
      <TableCell className="font-mono text-xs whitespace-nowrap">
        #{sale.id.slice(-8)}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">{formatDate(sale.created_at).split(' ')[0]}</span>
          <span className="text-xs text-muted-foreground">{formatDate(sale.created_at).split(' ')[1]}</span>
        </div>
      </TableCell>
      <TableCell className="max-w-[180px]">
        <div className="flex flex-col gap-1">
          <span className="font-medium break-words leading-tight">{sale.customer_name}</span>
          <span className="text-xs text-muted-foreground">
            {CUSTOMER_TYPES[sale.customer_type as keyof typeof CUSTOMER_TYPES]}
          </span>
        </div>
      </TableCell>
      <TableCell className="max-w-[120px]">
        <span className="break-words leading-tight text-sm">
          {sale.salesperson_name || 'N/A'}
        </span>
      </TableCell>
      <TableCell className="text-center whitespace-nowrap">
        {sale.items_count || sale.sale_items?.length || 0}
      </TableCell>
      <TableCell className="text-right font-medium whitespace-nowrap">
        <span className="text-xs sm:text-sm">{formatCurrency(sale.subtotal)}</span>
      </TableCell>
      <TableCell className="text-right whitespace-nowrap">
        <span className="text-xs sm:text-sm">
          {sale.discount_amount ? formatCurrency(sale.discount_amount) : '-'}
        </span>
      </TableCell>
      <TableCell className="text-right font-bold whitespace-nowrap">
        <span className="text-xs sm:text-sm">{formatCurrency(sale.total)}</span>
      </TableCell>
      <TableCell className="text-right font-medium text-green-600 whitespace-nowrap">
        <span className="text-xs sm:text-sm">
          {sale.total_profit ? formatCurrency(sale.total_profit) : '-'}
        </span>
      </TableCell>
      <TableCell className="text-right whitespace-nowrap">
        {sale.profit_margin ? formatProfitMargin(sale.profit_margin) : '-'}
      </TableCell>
      <TableCell className="max-w-[120px]">
        <span className="break-words leading-tight text-sm">
          {getPaymentMethodDisplay(sale.payment_method)}
        </span>
      </TableCell>
      <TableCell className="text-center whitespace-nowrap">
        {getStatusBadge(sale.status)}
      </TableCell>
      <TableCell className="text-center whitespace-nowrap">
        <SalesTableActions
          sale={sale}
          onViewSale={onViewSale}
          onViewReceipt={onViewReceipt}
          onPrintReceipt={onPrintReceipt}
          onDownloadPDF={onDownloadPDF}
          onViewProfit={onViewProfit}
        />
      </TableCell>
    </TableRow>
  )
}
