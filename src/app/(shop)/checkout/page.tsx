'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, ChevronRight, ShoppingCart, Loader2 } from 'lucide-react'
import { CustomerAuthGuard } from '@/components/auth/CustomerAuthGuard'
import { AddressSelector } from '@/components/(shop)/checkout/AddressSelector'
import { ShippingCalculator } from '@/components/(shop)/checkout/ShippingCalculator'
import { PayerDataForm } from '@/components/(shop)/checkout/PayerDataForm'
import { OrderSummary } from '@/components/(shop)/checkout/OrderSummary'
import { CouponInput } from '@/components/(shop)/checkout/CouponInput'
import { MercadoPagoPaymentBrick } from '@/components/(shop)/checkout/MercadoPagoPaymentBrick'
import { MercadoPagoStatusBrick } from '@/components/(shop)/checkout/MercadoPagoStatusBrick'
import { useCheckout } from '@/components/(shop)/checkout/hooks/useCheckout'
import { toast } from 'sonner'

export default function CheckoutPage() {
  const {
    currentStep,
    checkoutData,
    loading,
    orderSummary,
    cartItems,
    canProceedToStep,
    validateCurrentStep,
    nextStep,
    previousStep,
    goToStep,
    updateAddress,
    updateShipping,
    removeCoupon,
    validateCoupon,
    calculateShipping,
    createOrderForPayment,
    submitOrder,
    orderSession
  } = useCheckout()

  const [paymentData, setPaymentData] = useState<{
    status: string;
    payment_method?: string;
    payment_id?: string;
    amount?: number;
    preference_id?: string;
    order_id?: string;
  } | null>(null)

  const [pixData, setPixData] = useState<{
    qr_code?: string;
    qr_code_base64?: string;
    ticket_url?: string;
  } | null>(null)

  const [creatingOrder, setCreatingOrder] = useState(false)
  const [customerCpf, setCustomerCpf] = useState<string | null>(null)
  const [updatingCpf, setUpdatingCpf] = useState(false)
  const [loadingCustomerData, setLoadingCustomerData] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const steps = [
    { key: 'address', title: 'Endereço', description: 'Onde entregar' },
    { key: 'shipping', title: 'Entrega', description: 'Como entregar' },
    { key: 'payer-data', title: 'Dados', description: 'CPF para pagamento' },
    { key: 'payment', title: 'Pagamento', description: 'Como pagar' },
    { key: 'review', title: 'Revisão', description: 'Confirmar pedido' }
  ]

  const currentStepIndex = steps.findIndex(step => step.key === currentStep)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  // Função específica para criar pedido e ir para payment
  const handleCreateOrderAndGoToPayment = useCallback(async () => {
    if (isTransitioning) {
      console.log('Já está em transição, ignorando chamada duplicada')
      return
    }

    if (!checkoutData.shipping_address) {
      toast.error('Endereço de entrega obrigatório')
      return
    }

    const validation = validateCurrentStep()
    if (!validation.valid) {
      toast.error('Verifique os dados antes de prosseguir')
      return
    }

    try {
      setIsTransitioning(true)
      setCreatingOrder(true)

      const result = await createOrderForPayment()

      if (result?.success && result.order?.id) {
        setPaymentData({
          status: 'pending',
          preference_id: result.order.payment_external_id || result.order.id,
          order_id: result.order.id,
          amount: orderSummary.total
        })
        goToStep('payment')
      } else {
        throw new Error('Falha ao criar pedido')
      }
    } catch (err) {
      console.error('Error creating order:', err)
      toast.error('Erro ao criar pedido. Tente novamente.')
    } finally {
      setCreatingOrder(false)
      setIsTransitioning(false)
    }
  }, [checkoutData.shipping_address, validateCurrentStep, createOrderForPayment, orderSummary.total, goToStep, isTransitioning])

  // Carrega dados do customer na montagem do componente
  useEffect(() => {
    const loadCustomerData = async () => {
      if (!checkoutData.customer_id) {
        return
      }

      try {
        setLoadingCustomerData(true)

        const response = await fetch(`/api/customers/${checkoutData.customer_id}`)
        const result = await response.json()

        if (result.success && result.customer?.cpf_cnpj) {
          setCustomerCpf(result.customer.cpf_cnpj)
        } else {
          setCustomerCpf(null)
        }
      } catch (error) {
        console.error('Error loading customer data:', error)
      } finally {
        setLoadingCustomerData(false)
      }
    }

    loadCustomerData()
  }, [checkoutData.customer_id])

  // Inicializa estado de pagamento se houver sessão ativa
  useEffect(() => {
    if (orderSession.hasActiveOrder && orderSession.currentOrderSession && !paymentData?.order_id) {
      console.log('Inicializando estado de pagamento da sessão:', orderSession.currentOrderSession.orderId)
      setPaymentData({
        status: 'pending',
        preference_id: orderSession.currentOrderSession.preferenceId,
        order_id: orderSession.currentOrderSession.orderId,
        amount: orderSession.currentOrderSession.total_amount
      })
    }
  }, [orderSession.hasActiveOrder, orderSession.currentOrderSession, paymentData?.order_id])

  // Debug: Monitor checkout state changes
  // Log de debug do estado do checkout
  useEffect(() => {
    console.log('Checkout State:', {
      currentStep,
      customerCpf: customerCpf ? 'HAS_CPF' : 'NO_CPF',
      loadingCustomerData,
      isTransitioning,
      hasShippingAddress: !!checkoutData.shipping_address,
      hasActiveOrder: orderSession.hasActiveOrder,
      paymentDataExists: !!paymentData
    })
  }, [currentStep, customerCpf, loadingCustomerData, isTransitioning, checkoutData.shipping_address, orderSession.hasActiveOrder, paymentData])

  // Cria pedido automaticamente quando chega no step 'payment' sem pedido criado
  useEffect(() => {
    const createOrderWhenInPaymentStep = async () => {
      // Só executa se:
      // 1. Está no step payment
      // 2. Não está carregando dados
      // 3. Não está em transição
      // 4. Não tem pedido criado
      // 5. Tem endereço de entrega
      // 6. Tem CPF cadastrado
      if (
        currentStep === 'payment' &&
        !loadingCustomerData &&
        !isTransitioning &&
        !creatingOrder &&
        !paymentData?.order_id &&
        !orderSession.hasActiveOrder &&
        checkoutData.shipping_address &&
        customerCpf
      ) {
        await handleCreateOrderAndGoToPayment()
      }
    }

    createOrderWhenInPaymentStep()
  }, [
    currentStep,
    loadingCustomerData,
    isTransitioning,
    creatingOrder,
    paymentData?.order_id,
    orderSession.hasActiveOrder,
    checkoutData.shipping_address,
    customerCpf,
    handleCreateOrderAndGoToPayment
  ])

  // Auto-avança do step payer-data quando tem CPF
  useEffect(() => {
    const autoAdvanceFromPayerData = () => {
      // Só executa se:
      // 1. Está no step payer-data
      // 2. Tem CPF cadastrado
      // 3. Não está carregando dados
      // 4. Não está em transição
      if (
        currentStep === 'payer-data' &&
        customerCpf &&
        !loadingCustomerData &&
        !isTransitioning
      ) {
        setTimeout(() => {
          nextStep() // Vai para payment
        }, 1500) // Pequeno delay para mostrar a mensagem
      }
    }

    autoAdvanceFromPayerData()
  }, [currentStep, customerCpf, loadingCustomerData, isTransitioning, nextStep])

  const handleNextStep = async () => {
    const validation = validateCurrentStep()

    if (!validation.valid) {
      Object.entries(validation.errors).forEach(([, errors]) => {
        errors.forEach(error => {
          toast.error(error)
        })
      })
      return
    }

    // tratamento especial para cada step
    switch (currentStep) {
      case 'address':
        nextStep()
        break

      case 'shipping':
        // Vai para escolha de dados do pagador, SEM criar pedido ainda
        nextStep() // Vai para payer-data
        break

      case 'payer-data':
        // Vai para payment, SEM criar pedido ainda
        nextStep() // Vai para payment
        break

      case 'payment':
        // Só permite avanço se pagamento foi processado
        if (!paymentData?.payment_id) {
          toast.error('Complete o pagamento para continuar.')
          return
        }
        nextStep()
        break

      default:
        nextStep()
        break
    }
  }

  const handlePaymentSubmit = async (data: {
    status: string;
    payment_method?: string;
    payment_id?: string;
    amount?: number;
    external_reference?: string;
    qr_code?: string;
    qr_code_base64?: string;
    ticket_url?: string;
  }) => {
    console.log('Payment submitted:', data)

    setPaymentData({
      ...data,
      preference_id: paymentData?.preference_id,
      order_id: paymentData?.order_id
    })

    // vai para o próximo step para mostrar a tela de status
    if (data.payment_id) {
      nextStep() // vai para o step 4 (review/status)
    }

    // mostra mensagem apropriada
    if (data.payment_method === 'pix') {
      toast.success('PIX gerado! Acompanhe o status do pagamento abaixo.')

      // define dados do PIX para exibição
      if (data.qr_code) {
        setPixData({
          qr_code: data.qr_code,
          qr_code_base64: data.qr_code_base64,
          ticket_url: data.ticket_url
        })
      }
    } else if (data.status === 'approved') {
      toast.success('Pagamento aprovado!')
    } else {
      toast.success('Pagamento enviado para processamento.')
    }
  }

  const handlePaymentError = (error: { message?: string; code?: string }) => {
    console.error('Payment error:', error)
    toast.error('Erro no pagamento. Tente novamente.')
  }

  const handlePayerDataSubmit = async (cpfCnpj: string) => {
    try {
      setUpdatingCpf(true)

      const response = await fetch('/api/customers/update-cpf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: checkoutData.customer_id,
          cpf_cnpj: cpfCnpj
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao salvar CPF/CNPJ')
      }

      setCustomerCpf(cpfCnpj)
      toast.success('CPF/CNPJ salvo com sucesso!')

      // O useEffect detectará a mudança em customerCpf e fará a transição automaticamente
      // Removendo a chamada duplicada: await handleCreateOrderAndGoToPayment()

    } catch (error) {
      console.error('Error updating customer CPF:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar CPF/CNPJ'
      toast.error(errorMessage)
      throw error // Re-throw para que o componente possa tratar
    } finally {
      setUpdatingCpf(false)
    }
  }

  // verifica se o carrinho está vazio
  if (cartItems.displayItems.length === 0) {
    return (
      <CustomerAuthGuard>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Carrinho vazio</h2>
              <p className="text-muted-foreground mb-6">
                Adicione alguns produtos ao seu carrinho antes de finalizar a compra
              </p>
              <Button onClick={() => window.location.href = '/produtos'}>
                Continuar Comprando
              </Button>
            </CardContent>
          </Card>
        </div>
      </CustomerAuthGuard>
    )
  }

  return (
    <CustomerAuthGuard>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Finalizar Compra</h1>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              {steps.map((step, index) => (
                <div
                  key={step.key}
                  className={`flex items-center ${index <= currentStepIndex
                    ? 'text-primary'
                    : 'text-muted-foreground'
                    }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${index < currentStepIndex
                    ? 'bg-primary border-primary text-primary-foreground'
                    : index === currentStepIndex
                      ? 'border-primary text-primary'
                      : 'border-muted text-muted-foreground'
                    }`}>
                    {index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-full h-0.5 ml-2 ${index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                      }`} />
                  )}
                </div>
              ))}
            </div>
            <Progress value={progress} className="h-2" />

            <div className="mt-4 text-center">
              <h2 className="text-xl font-semibold">
                {steps[currentStepIndex]?.title}
              </h2>
              <p className="text-muted-foreground text-sm">
                {steps[currentStepIndex]?.description}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Step 1: Address */}
            {currentStep === 'address' && (
              <AddressSelector
                selectedAddress={checkoutData.shipping_address}
                onAddressSelect={updateAddress}
              />
            )}

            {/* Step 2: Shipping */}
            {currentStep === 'shipping' && (
              <ShippingCalculator
                selectedAddress={checkoutData.shipping_address}
                selectedOption={checkoutData.shipping_option}
                onOptionSelect={updateShipping}
                calculateShipping={calculateShipping}
              />
            )}

            {/* Step 3: Payer Data - Só mostra se não tem CPF */}
            {currentStep === 'payer-data' && !customerCpf && !loadingCustomerData && (
              <PayerDataForm
                customerName={checkoutData.customer_name}
                customerEmail={checkoutData.email}
                onPayerDataSubmit={handlePayerDataSubmit}
                loading={updatingCpf || loadingCustomerData}
              />
            )}

            {/* Loading state para payer-data quando tem CPF */}
            {currentStep === 'payer-data' && (customerCpf || loadingCustomerData) && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {loadingCustomerData ? 'Carregando dados do cliente...' : 'CPF já cadastrado, avançando...'}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Payment */}
            {currentStep === 'payment' && checkoutData.shipping_address && (
              <>
                {loadingCustomerData || creatingOrder ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {loadingCustomerData ? 'Carregando dados do cliente...' : 'Criando pedido...'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (paymentData?.order_id || orderSession.hasActiveOrder) ? (
                  <MercadoPagoPaymentBrick
                    preferenceId={paymentData?.order_id || orderSession.currentOrderSession?.orderId || ''}
                    amount={Math.round(orderSummary.total * 100)} // Converter para centavos
                    customerEmail={checkoutData.email}
                    customerName={checkoutData.customer_name}
                    customerCpf={customerCpf}
                    onPaymentSubmit={handlePaymentSubmit}
                    onPaymentError={handlePaymentError}
                  />
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground mb-4">Pronto para finalizar seu pedido?</p>
                      <p className="text-sm text-gray-600 mb-4">
                        Valor total: R$ {orderSummary.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <Button onClick={() => handleCreateOrderAndGoToPayment()} className="mt-4">
                        Criar Pedido e Continuar para Pagamento
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Payment Status Display */}
                {paymentData && (
                  <div className="mt-6">
                    {/* PIX Display */}
                    {paymentData.payment_method === 'pix' && pixData && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
                        <h3 className="font-medium text-blue-800 mb-4">Pagamento via PIX</h3>

                        {/* QR Code */}
                        {pixData.qr_code_base64 && (
                          <div className="flex flex-col items-center mb-6">
                            <p className="text-sm text-blue-600 mb-3">Escaneie o QR Code com seu app do banco:</p>
                            <Image
                              src={`data:image/png;base64,${pixData.qr_code_base64}`}
                              alt="QR Code PIX"
                              width={200}
                              height={200}
                              className="max-w-[200px] h-auto border border-gray-300 rounded"
                            />
                          </div>
                        )}

                        {/* PIX Code */}
                        {pixData.qr_code && (
                          <div className="mb-4">
                            <p className="text-sm text-blue-600 mb-2">Ou copie o código PIX:</p>
                            <div className="bg-white border border-blue-200 rounded p-3">
                              <div className="flex items-center justify-between">
                                <code className="text-xs break-all mr-2 flex-1">{pixData.qr_code}</code>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    navigator.clipboard.writeText(pixData.qr_code!)
                                    toast.success('Código PIX copiado!')
                                  }}
                                >
                                  Copiar
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Instructions */}
                        <div className="text-sm text-blue-600">
                          <p className="mb-2">Instruções:</p>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Abra o app do seu banco</li>
                            <li>Escaneie o QR Code ou cole o código PIX</li>
                            <li>Confirme o pagamento no valor de R$ {(orderSummary.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</li>
                            <li>O pagamento será confirmado automaticamente</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Step 5: Review */}
            {currentStep === 'review' && (
              <>
                {/* Show Status Screen if payment was submitted */}
                {paymentData?.payment_id ? (
                  <MercadoPagoStatusBrick
                    paymentId={paymentData.payment_id}
                    onReady={() => console.log('Status Screen ready')}
                    onError={(error) => console.error('Status Screen error:', error)}
                    className="mb-6"
                  />
                ) : (
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">
                        Confirmar Pedido
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Endereço de Entrega</h4>
                          <div className="text-sm text-muted-foreground">
                            {checkoutData.shipping_address?.name}<br />
                            {checkoutData.shipping_address?.street}, {checkoutData.shipping_address?.number}
                            {checkoutData.shipping_address?.complement && `, ${checkoutData.shipping_address.complement}`}<br />
                            {checkoutData.shipping_address?.neighborhood}, {checkoutData.shipping_address?.city}/{checkoutData.shipping_address?.state}<br />
                            CEP: {checkoutData.shipping_address?.zip_code}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Método de Entrega</h4>
                          <div className="text-sm text-muted-foreground">
                            {checkoutData.shipping_option?.name} - {checkoutData.shipping_option?.delivery_time_description}
                          </div>
                        </div>

                        {checkoutData.coupon_code && (
                          <div>
                            <h4 className="font-medium mb-2">Cupom Aplicado</h4>
                            <div className="text-sm text-muted-foreground">
                              {checkoutData.coupon_code} - Desconto de R$ {checkoutData.coupon_discount?.toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={previousStep}
                disabled={currentStepIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>

              {currentStep !== 'review' ? (
                <Button
                  onClick={handleNextStep}
                  disabled={
                    loading ||
                    creatingOrder ||
                    updatingCpf ||
                    loadingCustomerData ||
                    !canProceedToStep(steps[currentStepIndex + 1]?.key as 'address' | 'shipping' | 'payer-data' | 'payment' | 'review') ||
                    (currentStep === 'payment' && !paymentData?.payment_id) ||
                    (currentStep === 'payer-data' && !customerCpf)
                  }
                >
                  {creatingOrder ? 'Criando pedido...' : updatingCpf ? 'Salvando dados...' : loadingCustomerData ? 'Carregando dados...' : loading ? 'Carregando...' : 'Próximo'}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={submitOrder}
                  disabled={loading}
                  size="lg"
                >
                  {loading ? 'Finalizando...' : 'Finalizar Pedido'}
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <OrderSummary
              items={cartItems.displayItems}
              summary={orderSummary}
              couponCode={checkoutData.coupon_code}
              shippingMethod={checkoutData.shipping_option?.name}
            />

            {/* Coupon Input */}
            {(currentStep === 'address' || currentStep === 'shipping') && (
              <CouponInput
                appliedCoupon={checkoutData.coupon_code ? {
                  code: checkoutData.coupon_code,
                  discount: checkoutData.coupon_discount || 0
                } : null}
                onCouponApply={validateCoupon}
                onCouponRemove={removeCoupon}
                loading={loading}
              />
            )}
          </div>
        </div>
      </div>
    </CustomerAuthGuard>
  )
}
