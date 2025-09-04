'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  CheckCircle,
  Home,
  ShoppingBag
} from 'lucide-react'
import { CustomerAuthGuard } from '@/components/auth/CustomerAuthGuard'
import { useCustomerAuth } from '@/components/auth/CustomerAuthProvider'
import { useCart } from '@/components/(shop)/carrinho/hooks/useCart'
import { useOrderDetails } from '@/hooks/useOrderDetails'
import { OrderStatusCard } from '@/components/(shop)/checkout/OrderStatusCard'
import { PaymentStatusCard } from '@/components/(shop)/checkout/PaymentStatusCard'
import { OrderSummaryCard } from '@/components/(shop)/checkout/OrderSummaryCard'
import { DeliveryAddressCard } from '@/components/(shop)/checkout/DeliveryAddressCard'
import { LoadingState, ErrorState } from '@/components/(shop)/checkout/CheckoutStates'

export default function CheckoutSuccessPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useCustomerAuth()
  const { clearCart } = useCart()

  const orderId = params.id as string
  const { order, loading, error } = useOrderDetails(orderId, {
    customerId: user?.id
  })

  // Verifica se o pagamento foi aprovado e redireciona se não foi
  useEffect(() => {
    if (order && order.payment_status !== 'approved' && order.payment_status !== 'paid') {
      console.log('Payment not approved, redirecting to status page:', order.payment_status)
      router.replace(`/checkout/status/${orderId}`)
    }
  }, [order, orderId, router])

  // limpa carrinho em caso de pagamento aprovado/pago
  useEffect(() => {
    if (order && (order.payment_status === 'approved' || order.payment_status === 'paid')) {
      console.log('Clearing cart for approved payment:', order.payment_status)
      clearCart()
    }
  }, [order, clearCart])

  if (loading) {
    return <LoadingState />
  }

  if (error || !order) {
    return (
      <ErrorState 
        error={error || 'Pedido não encontrado'}
        onGoToOrders={() => router.push('/pedidos')}
      />
    )
  }

  return (
    <CustomerAuthGuard>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Success Header */}
          <Card>
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-green-800 mb-2">
                  Pedido Realizado com Sucesso!
                </h1>
                <p className="text-muted-foreground">
                  Seu pedido #{order.id.slice(-8)} foi registrado e está sendo processado
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => router.push('/pedidos')}>
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Ver Meus Pedidos
                </Button>
                <Button variant="outline" onClick={() => router.push('/produtos')}>
                  <Home className="h-4 w-4 mr-2" />
                  Continuar Comprando
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Order Details */}
            <div className="lg:col-span-2 space-y-6">
              <OrderStatusCard 
                status={order.status}
                createdAt={order.created_at}
              />
              
              <PaymentStatusCard 
                paymentStatus={order.payment_status}
                totalAmount={order.total_amount}
                paymentExternalId={order.payment_external_id}
                showPixActions={false}
              />
              
              <DeliveryAddressCard order={order} />
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <OrderSummaryCard 
                items={order.items || []}
                subtotalAmount={order.subtotal_amount}
                shippingCost={order.shipping_cost}
                couponDiscount={order.coupon_discount}
                totalAmount={order.total_amount}
              />
            </div>
          </div>

          {/* Help Section */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-sm text-muted-foreground">
                <p className="mb-2">
                  Precisa de ajuda com seu pedido?
                </p>
                <p>
                  Entre em contato conosco pelo WhatsApp ou e-mail para suporte.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </CustomerAuthGuard>
  )
}