'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useMetricsCards } from './hooks/useMetricsCards'

export function MetricsCards() {
  const { metrics, loading } = useMetricsCards()

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  +{metric.change}
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