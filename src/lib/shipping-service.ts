/**
 * Shipping Service - Abstraction layer for shipping calculations
 * Integrates with Melhor Envio API and provides fallback to mock calculations
 */

import { createMelhorEnvioService, MelhorEnvioService, type MelhorEnvioCalculateRequest } from './melhor-envio'
import type { ShippingCalculationRequest, ShippingOption, ShippingMethod } from '@/types/checkout'

export interface ShippingServiceConfig {
  storeZipCode: string
  storeAddress: {
    name: string
    phone: string
    email: string
    document: string
    address: string
    district: string
    city: string
    state: string
    country: string
  }
}

export class ShippingService {
  private melhorEnvio: MelhorEnvioService | null = null
  private config: ShippingServiceConfig
  private useMelhorEnvio: boolean

  constructor(config: ShippingServiceConfig, useMelhorEnvio = true) {
    this.config = config
    this.useMelhorEnvio = useMelhorEnvio

    if (useMelhorEnvio) {
      try {
        this.melhorEnvio = createMelhorEnvioService()
      } catch (error) {
        console.warn('Melhor Envio service not available, falling back to mock:', error)
        this.useMelhorEnvio = false
      }
    }
  }

  /**
   * Calculate shipping options for given request
   */
  async calculateShipping(request: ShippingCalculationRequest): Promise<ShippingOption[]> {
    if (this.useMelhorEnvio) {
      try {
        return await this.calculateWithMelhorEnvio(request)
      } catch (error) {
        console.error('Melhor Envio calculation failed, falling back to mock:', error)
        return this.calculateMockShipping(request)
      }
    }

    return this.calculateMockShipping(request)
  }

  /**
   * Calculate shipping using Melhor Envio API
   */
  private async calculateWithMelhorEnvio(request: ShippingCalculationRequest): Promise<ShippingOption[]> {
    const { origin_zip_code, destination_zip_code, items } = request

    // Validate CEPs
    if (!MelhorEnvioService.isValidCep(origin_zip_code) || !MelhorEnvioService.isValidCep(destination_zip_code)) {
      throw new Error('CEP inválido. Use o formato 12345678')
    }

    // Convert items to Melhor Envio format
    const products = items.map((item, index) => ({
      id: `item-${index}`,
      width: item.width,
      height: item.height,
      length: item.length,
      weight: item.weight,
      insurance_value: item.value,
      quantity: 1,
    }))

    // Prepare request
    const melhorEnvioRequest: MelhorEnvioCalculateRequest = {
      from: {
        postal_code: MelhorEnvioService.cleanCep(origin_zip_code),
        address: process.env.STORE_ADDRESS_FROM_ADDRESS || '',
        number: '1000',
        district: process.env.STORE_ADDRESS_FROM_DISTRICT || '',
        city: process.env.STORE_ADDRESS_FROM_CITY || '',
        state_abbr: process.env.STORE_ADDRESS_FROM_STATE_ABBR || '',
        country_id: process.env.STORE_ADDRESS_FROM_COUNTRY_ID || 'BR',
      },
      to: {
        postal_code: MelhorEnvioService.cleanCep(destination_zip_code),
        address: 'Rua Destino',
        number: '100',
        district: 'Centro',
        city: 'Cidade Destino',
        state_abbr: 'SP',
        country_id: 'BR',
      },
      products,
      services: '1,2,3,17', // PAC, SEDEX, SEDEX 10, PAC Mini
    }

    // Calculate shipping with Melhor Envio
    if (!this.melhorEnvio) {
      throw new Error('Melhor Envio service not initialized')
    }
    const melhorEnvioOptions = await this.melhorEnvio.calculateShipping(melhorEnvioRequest)

    // Convert to our format
    const shippingOptions: ShippingOption[] = melhorEnvioOptions.map((option) => {
      const basePrice = parseFloat(option.price)
      // Add discrete markup of R$ 5.00
      const price = basePrice + 5.00
      // Use service ID to ensure uniqueness
      const method = `service-${option.id}` as ShippingMethod

      return {
        method,
        name: `${option.company.name} ${option.name}`,
        price,
        delivery_time_days: option.delivery_time,
        delivery_time_description: this.formatDeliveryTime(option.delivery_time),
        carrier: option.company.name,
      }
    })

    // Add store pickup option if same city
    const sameCity = this.isSameCity(origin_zip_code, destination_zip_code)
    if (sameCity) {
      shippingOptions.push({
        method: 'pickup',
        name: 'Retirada na loja',
        price: 0,
        delivery_time_days: 0,
        delivery_time_description: 'Imediato',
        carrier: 'Loja',
      })
    }

    return shippingOptions.sort((a, b) => a.price - b.price)
  }

  /**
   * Mock shipping calculation (fallback)
   */
  private calculateMockShipping(request: ShippingCalculationRequest): ShippingOption[] {
    const { origin_zip_code, destination_zip_code, items } = request

    const cleanOrigin = origin_zip_code.replace(/\D/g, '')
    const cleanDestination = destination_zip_code.replace(/\D/g, '')

    if (cleanOrigin.length !== 8 || cleanDestination.length !== 8) {
      throw new Error('CEP inválido. Use o formato 12345678')
    }

    // Calculate total weight
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)

    // Simulate regional shipping based on CEP regions
    const originRegion = Math.floor(parseInt(cleanOrigin.substring(0, 2)) / 10)
    const destRegion = Math.floor(parseInt(cleanDestination.substring(0, 2)) / 10)
    const distance = Math.abs(originRegion - destRegion)

    // Base prices and delivery times
    const basePrice = Math.max(8.50, totalWeight * 0.5) // minimum R$ 8.50
    const distanceMultiplier = 1 + (distance * 0.15) // 15% per region difference
    const weightMultiplier = totalWeight > 5 ? 1 + ((totalWeight - 5) * 0.1) : 1

    // Standard delivery (PAC equivalent)
    const standardPrice = Math.round((basePrice * distanceMultiplier * weightMultiplier) * 100) / 100
    const standardDays = Math.max(3, Math.min(15, 3 + distance + Math.floor(totalWeight / 2)))

    // Express delivery (SEDEX equivalent)
    const expressPrice = Math.round((standardPrice * 1.8) * 100) / 100
    const expressDays = Math.max(1, Math.floor(standardDays / 2))

    const options: ShippingOption[] = [
      {
        method: 'standard',
        name: 'Correios PAC',
        price: standardPrice + 5.00, // Add discrete markup
        delivery_time_days: standardDays,
        delivery_time_description: `${standardDays} dias úteis`,
        carrier: 'Correios',
      },
      {
        method: 'express',
        name: 'Correios SEDEX',
        price: expressPrice + 5.00, // Add discrete markup
        delivery_time_days: expressDays,
        delivery_time_description: `${expressDays} dias úteis`,
        carrier: 'Correios',
      },
    ]

    // Add store pickup if same city
    const sameCity = this.isSameCity(origin_zip_code, destination_zip_code)
    if (sameCity) {
      options.push({
        method: 'pickup',
        name: 'Retirada na loja',
        price: 0,
        delivery_time_days: 0,
        delivery_time_description: 'Imediato',
        carrier: 'Loja',
      })
    }

    return options
  }

  /**
   * Map Melhor Envio service to our shipping method enum
   */
  private mapMelhorEnvioServiceToMethod(companyName: string, serviceName: string): ShippingMethod {
    const service = `${companyName} ${serviceName}`.toLowerCase()

    if (service.includes('sedex') || service.includes('express') || service.includes('rápid')) {
      return 'express'
    }

    return 'standard'
  }

  /**
   * Format delivery time for display
   */
  private formatDeliveryTime(days: number): string {
    if (days === 0) return 'Imediato'
    if (days === 1) return '1 dia útil'
    return `${days} dias úteis`
  }

  /**
   * Check if origin and destination are in the same city (first 5 digits of CEP)
   */
  private isSameCity(originZip: string, destinationZip: string): boolean {
    const cleanOrigin = originZip.replace(/\D/g, '')
    const cleanDestination = destinationZip.replace(/\D/g, '')
    return cleanOrigin.substring(0, 5) === cleanDestination.substring(0, 5)
  }
}

/**
 * Create configured shipping service instance
 */
export function createShippingService(): ShippingService {
  const config: ShippingServiceConfig = {
    storeZipCode: process.env.NEXT_PUBLIC_STORE_ZIPCODE || '01310-100',
    storeAddress: {
      name: process.env.STORE_ADDRESS_FROM_NAME || 'HP Marcas Perfumes',
      phone: process.env.STORE_ADDRESS_FROM_PHONE || '(11) 99999-9999',
      email: process.env.STORE_ADDRESS_FROM_EMAIL || 'contato@hpmarcas.com.br',
      document: process.env.STORE_ADDRESS_FROM_DOCUMENT || '00.000.000/0001-00',
      address: process.env.STORE_ADDRESS_FROM_ADDRESS || 'Av. Paulista, 1000',
      district: process.env.STORE_ADDRESS_FROM_DISTRICT || 'Bela Vista',
      city: process.env.STORE_ADDRESS_FROM_CITY || 'São Paulo',
      state: process.env.STORE_ADDRESS_FROM_STATE_ABBR || 'SP',
      country: process.env.STORE_ADDRESS_FROM_COUNTRY_ID || 'BR',
    },
  }

  // Only use Melhor Envio if credentials are configured
  const useMelhorEnvio = !!(
    process.env.MELHOR_ENVIO_CLIENT_ID &&
    process.env.MELHOR_ENVIO_CLIENT_SECRET
  )

  return new ShippingService(config, useMelhorEnvio)
}
