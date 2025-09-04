'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, DollarSign, Receipt, Target } from 'lucide-react'
import { SalesStats } from '@/types/sales'

interface SalesStatsCardsProps {
  stats: SalesStats | null
  loading: boolean
  className?: string
}

export function SalesStatsCards({ stats, loading, className }: SalesStatsCardsProps) {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatPercentage = (value: number): string => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const calculateGrowth = (): number => {
    if (!stats || !stats.sales_by_period || stats.sales_by_period.length < 2) {
      return 0
    }
    
    const current = stats.sales_by_period[stats.sales_by_period.length - 1]?.revenue || 0
    const previous = stats.sales_by_period[stats.sales_by_period.length - 2]?.revenue || 0
    
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  const growth = calculateGrowth()

  const metrics = [
    {
      title: 'Total de Vendas',
      value: stats ? stats.total_sales.toString() : '0',
      icon: Receipt,
      description: 'transações',
      trend: stats && stats.sales_today > 0 ? 'up' : 'neutral',
      change: stats ? `${stats.sales_today} hoje` : '0 hoje'
    },
    {
      title: 'Receita Total',
      value: stats ? formatCurrency(stats.total_revenue) : formatCurrency(0),
      icon: DollarSign,
      description: 'faturamento',
      trend: growth > 0 ? 'up' : growth < 0 ? 'down' : 'neutral',
      change: formatPercentage(growth)
    },
    {
      title: 'Lucro Líquido',
      value: stats ? formatCurrency(stats.total_profit) : formatCurrency(0),
      icon: TrendingUp,
      description: 'margem',
      trend: stats && stats.profit_margin > 20 ? 'up' : stats && stats.profit_margin > 10 ? 'neutral' : 'down',
      change: stats ? formatPercentage(stats.profit_margin) : '0%'
    },
    {
      title: 'Ticket Médio',
      value: stats ? formatCurrency(stats.avg_ticket) : formatCurrency(0),
      icon: Target,
      description: 'por venda',
      trend: 'neutral',
      change: stats ? `${stats.total_sales} vendas` : '0 vendas'
    }
  ]

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {metrics.map((metric, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.title}
            </CardTitle>
            <metric.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">{metric.value}</div>
            <div className="flex items-center gap-1 text-xs">
              {metric.trend === 'up' && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {metric.change}
                </Badge>
              )}
              {metric.trend === 'down' && (
                <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-100">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  {metric.change}
                </Badge>
              )}
              {metric.trend === 'neutral' && (
                <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                  {metric.change}
                </Badge>
              )}
              <span className="text-muted-foreground ml-1">{metric.description}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}