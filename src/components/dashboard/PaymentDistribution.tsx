'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { CreditCard, CalendarDays, BarChart3 } from 'lucide-react'
import { usePaymentDistribution } from './hooks/usePaymentDistribution'
import type { PaymentDistributionData, TimePeriod } from '@/types/dashboard'

type ChartType = 'pie' | 'bar'

export function PaymentDistribution() {
  const {
    paymentData,
    loading,
    selectedPeriod,
    setSelectedPeriod,
    chartType,
    setChartType,
    formatCurrency,
    formatPercentage,
    getChartColors
  } = usePaymentDistribution()

  const CustomTooltip = ({ active, payload }: {
    active?: boolean
    payload?: Array<{
      name: string
      value: number
      payload: PaymentDistributionData
    }>
  }) => {
    if (active && payload && payload.length && payload[0]) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{data.method}</p>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Vendas:</span> {data.count}</p>
            <p><span className="font-medium">Receita:</span> {formatCurrency(data.total)}</p>
            <p><span className="font-medium">Percentual:</span> {formatPercentage(data.percentage)}</p>
          </div>
        </div>
      )
    }
    return null
  }

  const COLORS = getChartColors()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Distribuição de Pagamentos
            </CardTitle>
            <div className="flex gap-2">
              <div className="h-9 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Distribuição de Pagamentos
            <Badge variant="secondary" className="ml-2">
              {paymentData.length} métodos
            </Badge>
          </CardTitle>
          <div className="flex gap-2">
            <Select value={selectedPeriod} onValueChange={(value: TimePeriod) => setSelectedPeriod(value)}>
              <SelectTrigger className="w-[150px]">
                <CalendarDays className="h-4 w-4 mr-2" />
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
            <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
              <SelectTrigger className="w-[100px]">
                <BarChart3 className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pie">Pizza</SelectItem>
                <SelectItem value="bar">Barras</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {paymentData.length === 0 ? (
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            <div className="text-center">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma venda encontrada no período selecionado</p>
            </div>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'pie' ? (
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ method, percentage }) => `${method} (${formatPercentage(percentage)})`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {paymentData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              ) : (
                <BarChart data={paymentData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="method" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="count"
                    fill="#8884d8"
                    name="Vendas"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
        {paymentData.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            {paymentData.map((item, index) => (
              <div key={item.method} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm font-medium">{item.method}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{item.count} vendas</div>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(item.total)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}