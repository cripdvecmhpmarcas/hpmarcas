import { useState, useEffect, useCallback } from 'react'

export interface StockSettings {
  lowStockLimit: number
  criticalStockLimit: number
  autoAlert: boolean
}

export interface UseStockSettingsReturn {
  settings: StockSettings
  updateSettings: (newSettings: Partial<StockSettings>) => void
  resetToDefaults: () => void
  isLoaded: boolean
}

const DEFAULT_SETTINGS: StockSettings = {
  lowStockLimit: 10,
  criticalStockLimit: 3,
  autoAlert: true
}

export function useStockSettings(): UseStockSettingsReturn {
  const [settings, setSettings] = useState<StockSettings>(DEFAULT_SETTINGS)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const savedSettings = localStorage.getItem('stock_settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings({
          lowStockLimit: parsed.lowStockLimit || DEFAULT_SETTINGS.lowStockLimit,
          criticalStockLimit: parsed.criticalStockLimit || DEFAULT_SETTINGS.criticalStockLimit,
          autoAlert: parsed.autoAlert !== undefined ? parsed.autoAlert : DEFAULT_SETTINGS.autoAlert
        })
      } catch (error) {
        console.error('Erro ao carregar configurações de estoque:', error)
        setSettings(DEFAULT_SETTINGS)
      }
    }
    setIsLoaded(true)
  }, [])

  const updateSettings = useCallback((newSettings: Partial<StockSettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)
    localStorage.setItem('stock_settings', JSON.stringify(updatedSettings))
  }, [settings])

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    localStorage.setItem('stock_settings', JSON.stringify(DEFAULT_SETTINGS))
  }, [])

  return {
    settings,
    updateSettings,
    resetToDefaults,
    isLoaded
  }
}