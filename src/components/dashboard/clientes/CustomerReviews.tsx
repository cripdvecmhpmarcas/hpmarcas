"use client"

import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Star, 
  MessageSquare, 
  ThumbsUp, 
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  MoreHorizontal,
  Package,
  Award
} from 'lucide-react'
import { useCustomerReviews } from './hooks/useCustomerReviews'

interface CustomerReviewsProps {
  customerId: string | null
  className?: string
}

export function CustomerReviews({ customerId, className }: CustomerReviewsProps) {
  const { 
    reviews, 
    loading, 
    error, 
    refreshData, 
    reviewStats,
    loadMore,
    hasMore 
  } = useCustomerReviews(customerId)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <MessageSquare className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      approved: 'text-green-600 bg-green-100',
      pending: 'text-yellow-600 bg-yellow-100',
      rejected: 'text-red-600 bg-red-100'
    }
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100'
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      approved: 'Aprovada',
      pending: 'Pendente',
      rejected: 'Rejeitada'
    }
    return labels[status as keyof typeof labels] || status
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ))
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <MessageSquare className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar reviews: {error}
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            className="ml-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Estatísticas de Reviews */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{reviewStats.total}</p>
                <p className="text-sm text-muted-foreground">Total Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {reviewStats.avgRating.toFixed(1)}
                </p>
                <p className="text-sm text-muted-foreground">Média</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{reviewStats.approved}</p>
                <p className="text-sm text-muted-foreground">Aprovadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ThumbsUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{reviewStats.helpful}</p>
                <p className="text-sm text-muted-foreground">Úteis</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{reviewStats.pending}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Reviews */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Reviews do Cliente</h3>
          <Button variant="outline" size="sm" onClick={refreshData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {loading && reviews.length === 0 ? (
          <CustomerReviewsSkeleton />
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma review encontrada
              </h3>
              <p className="text-gray-500">
                Este cliente ainda não deixou reviews de produtos.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Package className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {review.product_name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {review.product_brand}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center">
                              {renderStars(review.rating)}
                            </div>
                            <span className="text-sm font-medium">
                              {review.rating}/5
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {review.verified_purchase && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            <Award className="h-3 w-3 mr-1" />
                            Compra Verificada
                          </Badge>
                        )}
                        <Badge className={getStatusColor(review.status)}>
                          {getStatusIcon(review.status)}
                          <span className="ml-1">{getStatusLabel(review.status)}</span>
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {review.title && (
                      <div>
                        <h5 className="font-medium text-gray-900">{review.title}</h5>
                      </div>
                    )}

                    {review.comment && (
                      <div>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {review.comment}
                        </p>
                      </div>
                    )}

                    {(review.pros || review.cons) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {review.pros && (
                          <div>
                            <h6 className="font-medium text-green-700 text-sm mb-2">
                              👍 Pontos Positivos
                            </h6>
                            <p className="text-sm text-gray-600">{review.pros}</p>
                          </div>
                        )}
                        {review.cons && (
                          <div>
                            <h6 className="font-medium text-red-700 text-sm mb-2">
                              👎 Pontos Negativos
                            </h6>
                            <p className="text-sm text-gray-600">{review.cons}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t">
                      <span>Publicado em {formatDate(review.created_at)}</span>
                      {review.recommend !== null && (
                        <span className={review.recommend ? 'text-green-600' : 'text-red-600'}>
                          {review.recommend ? '✅ Recomenda' : '❌ Não recomenda'}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loading}
                  className="min-w-[150px]"
                >
                  {loading ? (
                    <>
                      <MoreHorizontal className="h-4 w-4 mr-2 animate-pulse" />
                      Carregando...
                    </>
                  ) : (
                    <>
                      <MoreHorizontal className="h-4 w-4 mr-2" />
                      Carregar Mais
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function CustomerReviewsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-24 mt-1" />
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Skeleton key={j} className="h-4 w-4" />
                      ))}
                    </div>
                    <Skeleton className="h-4 w-8" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-16 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-12 w-full" />
              </div>
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
            <div className="flex justify-between pt-4 border-t">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}