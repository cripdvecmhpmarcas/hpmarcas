/**
 * Melhor Envio API Service
 * Documentação: https://docs.melhorenvio.com.br/reference/introducao-api-melhor-envio
 */

export interface MelhorEnvioConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  sandbox: boolean
  userAgent: string
}

export interface MelhorEnvioAuthResponse {
  token_type: string
  expires_in: number
  access_token: string
  refresh_token: string
}

export interface MelhorEnvioAddress {
  postal_code: string
  address: string
  number: string
  district: string
  city: string
  state_abbr: string
  country_id: string
  latitude?: number
  longitude?: number
}

export interface MelhorEnvioProduct {
  id: string
  width: number
  height: number
  length: number
  weight: number
  insurance_value: number
  quantity: number
}

export interface MelhorEnvioShippingOption {
  id: number
  name: string
  price: string
  custom_price: string
  discount: string
  currency: string
  delivery_time: number
  delivery_range: {
    min: number
    max: number
  }
  custom_delivery_time: number
  custom_delivery_range: {
    min: number
    max: number
  }
  packages: Array<{
    price: string
    discount: string
    format: string
    dimensions: {
      height: number
      width: number
      length: number
    }
    weight: string
    insurance_value: string
  }>
  additional_services: {
    receipt: boolean
    own_hand: boolean
    collect: boolean
  }
  company: {
    id: number
    name: string
    picture: string
  }
  error?: string
}

export interface MelhorEnvioCalculateRequest {
  from: MelhorEnvioAddress
  to: MelhorEnvioAddress
  products: MelhorEnvioProduct[]
  options?: {
    receipt?: boolean
    own_hand?: boolean
    insurance_value?: number
  }
  services?: string // Comma-separated service IDs (1,2,3,17)
}

export class MelhorEnvioService {
  private readonly config: MelhorEnvioConfig
  private readonly baseUrl: string
  private accessToken: string | null = null
  private tokenExpiresAt: number = 0

  constructor(config: MelhorEnvioConfig) {
    this.config = config
    this.baseUrl = config.sandbox 
      ? 'https://sandbox.melhorenvio.com.br/api/v2/me'
      : 'https://melhorenvio.com.br/api/v2/me'
  }

  /**
   * Authenticate with Melhor Envio API using existing access token or OAuth flow
   */
  async authenticate(): Promise<void> {
    try {
      // First, try to use existing access token from environment
      const existingToken = process.env.MELHOR_ENVIO_ACCESS_TOKEN
      if (existingToken) {
        this.accessToken = existingToken
        // Set expiration to 1 day from now (we'll handle refresh when needed)
        this.tokenExpiresAt = Date.now() + (24 * 60 * 60 * 1000)
        console.log('Melhor Envio: Using existing access token')
        return
      }

      // If no access token, throw error with instructions
      throw new Error(
        'Melhor Envio access token not found. ' +
        'Please complete OAuth flow first by accessing /api/shipping/melhor-envio/auth'
      )
    } catch (error) {
      console.error('Melhor Envio authentication error:', error)
      throw error
    }
  }

  /**
   * Ensure we have a valid access token
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken || Date.now() >= this.tokenExpiresAt) {
      await this.authenticate()
    }
  }

  /**
   * Make authenticated request to Melhor Envio API
   */
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    await this.ensureAuthenticated()

    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': this.config.userAgent,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`API request failed: ${response.status} ${errorData}`)
    }

    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      const text = await response.text()
      throw new Error(`Invalid response format: expected JSON, got ${contentType}. Response: ${text.substring(0, 200)}...`)
    }

    return response.json()
  }

  /**
   * Calculate shipping options for given request
   */
  async calculateShipping(request: MelhorEnvioCalculateRequest): Promise<MelhorEnvioShippingOption[]> {
    try {
      const endpoint = '/shipment/calculate'
      const result = await this.makeRequest<MelhorEnvioShippingOption[]>(endpoint, {
        method: 'POST',
        body: JSON.stringify(request),
      })

      return result.filter(option => !option.error)
    } catch (error) {
      console.error('Melhor Envio calculate shipping error:', error)
      throw error
    }
  }

  /**
   * Get available shipping services
   */
  async getServices(): Promise<Array<{ id: number; name: string; company: { name: string } }>> {
    try {
      // Use the public endpoint that doesn't require authentication
      const url = this.config.sandbox 
        ? 'https://sandbox.melhorenvio.com.br/api/v2/me/shipment/services'
        : 'https://melhorenvio.com.br/api/v2/me/shipment/services'
        
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': this.config.userAgent,
        },
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Services request failed: ${response.status} ${errorData}`)
      }

      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        const text = await response.text()
        throw new Error(`Invalid services response format: expected JSON, got ${contentType}. Response: ${text.substring(0, 200)}...`)
      }

      return await response.json()
    } catch (error) {
      console.error('Melhor Envio get services error:', error)
      throw error
    }
  }

  /**
   * Convert CEP string to clean format (only numbers)
   */
  static cleanCep(cep: string): string {
    return cep.replace(/\D/g, '')
  }

  /**
   * Validate CEP format
   */
  static isValidCep(cep: string): boolean {
    const cleaned = MelhorEnvioService.cleanCep(cep)
    return cleaned.length === 8 && /^\d{8}$/.test(cleaned)
  }

  /**
   * Format CEP for display (XXXXX-XXX)
   */
  static formatCep(cep: string): string {
    const cleaned = MelhorEnvioService.cleanCep(cep)
    return cleaned.replace(/^(\d{5})(\d{3})$/, '$1-$2')
  }
}

/**
 * Create configured Melhor Envio service instance
 */
export function createMelhorEnvioService(): MelhorEnvioService {
  const config: MelhorEnvioConfig = {
    clientId: process.env.MELHOR_ENVIO_CLIENT_ID!,
    clientSecret: process.env.MELHOR_ENVIO_CLIENT_SECRET!,
    redirectUri: process.env.MELHOR_ENVIO_REDIRECT_URI!,
    sandbox: process.env.MELHOR_ENVIO_SANDBOX === 'true',
    userAgent: process.env.MELHOR_ENVIO_USER_AGENT || 'HPMarcas (contato@hpmarcas.com.br)',
  }

  if (!config.clientId || !config.clientSecret) {
    throw new Error('Melhor Envio API credentials not configured')
  }

  return new MelhorEnvioService(config)
}