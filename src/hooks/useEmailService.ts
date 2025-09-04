import { useState, useCallback } from 'react'

interface EmailSendOptions {
  type: 'order-confirmation' | 'payment-confirmed'
  orderId: string
  testMode?: boolean
}

interface EmailSendResult {
  success: boolean
  emailId?: string
  error?: string
}

interface UseEmailServiceReturn {
  sending: boolean
  error: string | null
  lastResult: EmailSendResult | null
  sendEmail: (options: EmailSendOptions) => Promise<EmailSendResult>
  testEmailService: () => Promise<EmailSendResult>
  clearError: () => void
}

export function useEmailService(): UseEmailServiceReturn {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<EmailSendResult | null>(null)

  const sendEmail = useCallback(async (options: EmailSendOptions): Promise<EmailSendResult> => {
    try {
      setSending(true)
      setError(null)

      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar email')
      }

      setLastResult(result)
      return result

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      const errorResult = { success: false, error: errorMessage }
      setLastResult(errorResult)
      return errorResult
    } finally {
      setSending(false)
    }
  }, [])

  const testEmailService = useCallback(async (): Promise<EmailSendResult> => {
    return sendEmail({ type: 'order-confirmation', orderId: '', testMode: true })
  }, [sendEmail])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    sending,
    error,
    lastResult,
    sendEmail,
    testEmailService,
    clearError,
  }
}
