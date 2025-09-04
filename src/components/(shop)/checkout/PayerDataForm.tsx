'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, CreditCard, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface PayerDataFormProps {
  customerName: string
  customerEmail: string
  onPayerDataSubmit: (cpfCnpj: string) => Promise<void>
  loading?: boolean
  className?: string
}

export function PayerDataForm({
  customerName,
  customerEmail,
  onPayerDataSubmit,
  loading = false,
  className
}: PayerDataFormProps) {
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Função para aplicar máscara de CPF/CNPJ
  const formatCpfCnpj = (value: string) => {
    // Remove tudo que não é dígito
    const digits = value.replace(/\D/g, '')
    
    if (digits.length <= 11) {
      // CPF: 000.000.000-00
      return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    } else {
      // CNPJ: 00.000.000/0000-00
      return digits
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})/, '$1-$2')
    }
  }

  // Função para validar CPF
  const validateCpf = (cpf: string) => {
    const digits = cpf.replace(/\D/g, '')
    if (digits.length !== 11) return false

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(digits)) return false

    // Validação dos dígitos verificadores
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(digits[i]) * (10 - i)
    }
    let remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(digits[9])) return false

    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(digits[i]) * (11 - i)
    }
    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(digits[10])) return false

    return true
  }

  // Função para validar CNPJ
  const validateCnpj = (cnpj: string) => {
    const digits = cnpj.replace(/\D/g, '')
    if (digits.length !== 14) return false

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(digits)) return false

    // Validação dos dígitos verificadores
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

    let sum = 0
    for (let i = 0; i < 12; i++) {
      sum += parseInt(digits[i]) * weights1[i]
    }
    let remainder = sum % 11
    const digit1 = remainder < 2 ? 0 : 11 - remainder

    if (digit1 !== parseInt(digits[12])) return false

    sum = 0
    for (let i = 0; i < 13; i++) {
      sum += parseInt(digits[i]) * weights2[i]
    }
    remainder = sum % 11
    const digit2 = remainder < 2 ? 0 : 11 - remainder

    if (digit2 !== parseInt(digits[13])) return false

    return true
  }

  // Função para validar CPF ou CNPJ
  const validateDocument = (value: string) => {
    const digits = value.replace(/\D/g, '')
    
    if (digits.length === 11) {
      return validateCpf(value)
    } else if (digits.length === 14) {
      return validateCnpj(value)
    }
    
    return false
  }

  const handleInputChange = (value: string) => {
    const formatted = formatCpfCnpj(value)
    setCpfCnpj(formatted)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!cpfCnpj.trim()) {
      toast.error('CPF ou CNPJ é obrigatório')
      return
    }

    if (!validateDocument(cpfCnpj)) {
      toast.error('CPF ou CNPJ inválido')
      return
    }

    try {
      setSubmitting(true)
      const cleanDocument = cpfCnpj.replace(/\D/g, '')
      await onPayerDataSubmit(cleanDocument)
    } catch (error) {
      console.error('Error submitting payer data:', error)
      toast.error('Erro ao salvar dados. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const isValidDocument = cpfCnpj ? validateDocument(cpfCnpj) : false

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Dados do Pagador
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Para processar o pagamento PIX, precisamos do seu CPF ou CNPJ
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dados do customer */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-sm font-medium">Dados confirmados:</div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>Nome: {customerName}</div>
            <div>Email: {customerEmail}</div>
          </div>
        </div>

        {/* Formulário CPF/CNPJ */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cpf-cnpj" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              CPF ou CNPJ
            </Label>
            <Input
              id="cpf-cnpj"
              type="text"
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              value={cpfCnpj}
              onChange={(e) => handleInputChange(e.target.value)}
              maxLength={18}
              className={`${
                cpfCnpj && !isValidDocument
                  ? 'border-red-500 focus:border-red-500'
                  : cpfCnpj && isValidDocument
                  ? 'border-green-500 focus:border-green-500'
                  : ''
              }`}
              disabled={loading || submitting}
            />
            {cpfCnpj && !isValidDocument && (
              <p className="text-xs text-red-600">
                CPF ou CNPJ inválido
              </p>
            )}
            {cpfCnpj && isValidDocument && (
              <p className="text-xs text-green-600">
                Documento válido
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="text-xs text-muted-foreground">
              Seus dados estão protegidos e serão usados apenas para processar o pagamento
            </div>
            <Button
              type="submit"
              disabled={!isValidDocument || loading || submitting}
              className="min-w-[120px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Continuar'
              )}
            </Button>
          </div>
        </form>

        {/* Informações sobre PIX */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-xs text-blue-800">
            <div className="font-medium mb-1">Por que precisamos do CPF/CNPJ?</div>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Obrigatório para gerar pagamentos PIX</li>
              <li>Facilita a identificação do pagamento</li>
              <li>Garante maior segurança na transação</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}