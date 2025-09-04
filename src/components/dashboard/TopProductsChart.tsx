'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Package, TrendingUp, Filter } from 'lucide-react'
import { useTopProductsChart } from './hooks/useTopProductsChart'
import type { TimePeriod } from '@/types/dashboard'

type SortBy = 'revenue' | 'quantity' | 'frequency'

interface TopProductData {
  id: string
  name: string
  brand: string
  category: string
  totalSold: number
  totalRevenue: number
  timesSold: number
  shortName: string
}

export function TopProductsChart() {
  const {
    products,
    loading,
    selectedPeriod,
    setSelectedPeriod,
    sortBy,
    setSortBy,
    formatCurrency,
    getBarDataKey,
    getYAxisFormatter,
    getSortLabel
  } = useTopProductsChart()

  const CustomTooltip = ({ active, payload }: {
    active?: boolean
    payload?: Array<{
      color: string
      dataKey: string
      name: string
      value: number
      payload: TopProductData
    }>
  }) => {
    if (active && payload && payload.length && payload[0]) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg max-w-xs">
          <p className="font-medium mb-2">{data.name}</p>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Marca:</span> {data.brand}</p>
            <p><span className="font-medium">Categoria:</span> {data.category}</p>
            <p><span className="font-medium">Quantidade vendida:</span> {data.totalSold}</p>
            <p><span className="font-medium">Receita:</span> {formatCurrency(data.totalRevenue)}</p>
            <p><span className="font-medium">Vendas:</span> {data.timesSold}</p>
          </div>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Top Produtos
            </CardTitle>
            <div className="flex gap-2">
              <div className="h-9 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-9 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gray-100 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Top Produtos
            <Badge variant="secondary" className="ml-2">
              {products.length} produtos
            </Badge>
          </CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={selectedPeriod} onValueChange={(value: TimePeriod) => setSelectedPeriod(value)}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <TrendingUp className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="yesterday">Ontem</SelectItem>
                <SelectItem value="last7days">7 dias</SelectItem>
                <SelectItem value="last30days">30 dias</SelectItem>
                <SelectItem value="thisMonth">Este mês</SelectItem>
                <SelectItem value="lastMonth">Mês passado</SelectItem>
                <SelectItem value="thisYear">Este ano</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Receita</SelectItem>
                <SelectItem value="quantity">Quantidade</SelectItem>
                <SelectItem value="frequency">Frequência</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum produto vendido no período selecionado</p>
            </div>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={products} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="shortName" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={getYAxisFormatter()}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  dataKey={getBarDataKey()}
                  fill="#8884d8"
                  name={getSortLabel()}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}