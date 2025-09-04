"use client"

import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Settings
} from 'lucide-react'
import {
  StockOverview,
  StockMovements,
  LowStockAlert,
  useLowStockAlert
} from '@/components/dashboard/estoque'
import { StockAlertSummary } from '@/components/dashboard/estoque/StockAlertSummary'
import { useStockSettings } from '@/components/dashboard/estoque/hooks/useStockSettings'

export default function EstoquePage() {
  const [activeTab, setActiveTab] = useState('overview')
  const { totalAlert } = useLowStockAlert()
  const { settings, updateSettings, resetToDefaults } = useStockSettings()

  const handleSaveSettings = () => {
    toast.success('Configurações salvas com sucesso!')
  }

  const handleRestoreDefaults = () => {
    resetToDefaults()
    toast.success('Configurações restauradas para os padrões!')
  }

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tab = urlParams.get('tab')
    if (tab && ['overview', 'movements', 'alerts', 'settings'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [])

  return (
    <div className="flex-1">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Gestão de Estoque</h2>
            <p className="text-gray-600 mt-2">
              Gerencie o estoque de produtos, movimentações e alertas de reposição.
            </p>
          </div>
          <StockAlertSummary variant="compact" className="max-w-md" />
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="movements" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Movimentações
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2 relative">
            <AlertTriangle className="h-4 w-4" />
            Alertas
            {totalAlert > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-[20px] text-xs">
                {totalAlert > 99 ? '99+' : totalAlert}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <StockOverview />
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <StockMovements />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <LowStockAlert />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações de Estoque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-2xl mx-auto space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      Alertas de Estoque Baixo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Limite padrão para estoque baixo</label>
                        <div className="flex items-center gap-4">
                          <input
                            type="number"
                            className="w-20 px-3 py-2 border rounded-md text-sm"
                            value={settings.lowStockLimit}
                            onChange={(e) => updateSettings({ lowStockLimit: parseInt(e.target.value) || 1 })}
                            min="1"
                          />
                          <span className="text-sm text-muted-foreground">unidades</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Produtos com estoque igual ou menor serão marcados como &quot;estoque baixo&quot;
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Limite para estoque crítico</label>
                        <div className="flex items-center gap-4">
                          <input
                            type="number"
                            className="w-20 px-3 py-2 border rounded-md text-sm"
                            value={settings.criticalStockLimit}
                            onChange={(e) => updateSettings({ criticalStockLimit: parseInt(e.target.value) || 0 })}
                            min="0"
                          />
                          <span className="text-sm text-muted-foreground">unidades</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Produtos com estoque igual ou menor serão marcados como &quot;crítico&quot;
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="autoAlert"
                          className="rounded"
                          checked={settings.autoAlert}
                          onChange={(e) => updateSettings({ autoAlert: e.target.checked })}
                        />
                        <label htmlFor="autoAlert" className="text-sm font-medium">
                          Exibir alertas automaticamente no dashboard
                        </label>
                      </div>

                    </div>

                    <div className="pt-4 border-t flex gap-3">
                      <Button onClick={handleSaveSettings}>
                        Salvar Configurações
                      </Button>
                      <Button variant="outline" onClick={handleRestoreDefaults}>
                        Restaurar Padrões
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="text-center text-sm text-muted-foreground">
                  <p>Outras configurações de estoque estarão disponíveis em futuras atualizações.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
