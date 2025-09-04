// Configurações SSL para desenvolvimento
// Este arquivo ajuda a resolver problemas SSL em ambiente de desenvolvimento

if (process.env.NODE_ENV === 'development') {
  // Desabilitar verificação SSL rigorosa apenas em desenvolvimento
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

  // Configurar timeout mais alto para requests em desenvolvimento
  process.env["NODE_TIMEOUT"] = "30000"
}

// Função para configurar fetch com configurações SSL específicas
export function configureFetchForDevelopment() {
  if (process.env.NODE_ENV === 'development') {
    // Configurações específicas para desenvolvimento
    const originalFetch = global.fetch

    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const config: RequestInit = {
        ...init,
        // Adicionar timeout maior para desenvolvimento
        signal: init?.signal || AbortSignal.timeout(30000),
        // Headers específicos para desenvolvimento
        headers: {
          ...init?.headers,
          'User-Agent': 'HP-Marcas-Development/1.0',
        }
      }

      try {
        return await originalFetch(input, config)
      } catch (error) {
        console.warn('Fetch error in development:', error)
        throw error
      }
    }
  }
}

// Configuração de URLs para ambiente correto
export function getBaseUrl(): string {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }

  return process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}

// Configuração do Mercado Pago para desenvolvimento
export function getMercadoPagoConfig() {
  return {
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
    options: {
      timeout: 30000, // Timeout maior para desenvolvimento
      retries: 2,     // Retry em caso de falha
      // Configurações para desenvolvimento
      ...(process.env.NODE_ENV === 'development' && {
        sandbox: false // Manter false mesmo em dev se usando chaves de produção
      })
    }
  }
}
