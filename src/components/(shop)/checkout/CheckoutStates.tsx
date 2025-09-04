import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CustomerAuthGuard } from '@/components/auth/CustomerAuthGuard'

interface LoadingStateProps {
  className?: string
}

export function LoadingState({ className }: LoadingStateProps) {
  return (
    <CustomerAuthGuard>
      <div className={`container mx-auto px-4 py-8 ${className || ''}`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    </CustomerAuthGuard>
  )
}

interface ErrorStateProps {
  error: string
  onRetry?: () => void
  onGoToOrders?: () => void
  className?: string
}

export function ErrorState({ error, onRetry, onGoToOrders, className }: ErrorStateProps) {
  return (
    <CustomerAuthGuard>
      <div className={`container mx-auto px-4 py-8 ${className || ''}`}>
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-red-600 text-xl mb-4">{error}</div>
              <div className="space-x-4">
                {onRetry && (
                  <Button onClick={onRetry} variant="outline">
                    Tentar Novamente
                  </Button>
                )}
                {onGoToOrders && (
                  <Button onClick={onGoToOrders}>
                    Ver Meus Pedidos
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CustomerAuthGuard>
  )
}