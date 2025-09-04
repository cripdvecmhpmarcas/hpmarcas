'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { runDiagnostics } from '@/lib/dashboard-diagnostics'
import { AlertTriangle, CheckCircle, Info, RefreshCw } from 'lucide-react'

interface DiagnosticResult {
  connection: boolean
  queries: {
    sales: boolean
    customers: boolean
    products: boolean
    sale_items: boolean
    low_stock: boolean
  }
  overall: boolean
}

export function SystemDiagnostics() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<DiagnosticResult | null>(null)
  const [lastRun, setLastRun] = useState<Date | null>(null)

  const handleRunDiagnostics = async () => {
    setIsRunning(true)
    try {
      const diagnosticResults = await runDiagnostics()
      setResults(diagnosticResults)
      setLastRun(new Date())
    } catch (error) {
      console.error('Erro ao executar diagnósticos:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-red-600" />
    )
  }

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"}>
        {success ? "OK" : "FALHA"}
      </Badge>
    )
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Diagnóstico do Sistema
        </CardTitle>
        <CardDescription>
          Execute diagnósticos para verificar o status das conexões e consultas do dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Button
            onClick={handleRunDiagnostics}
            disabled={isRunning}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Executando...' : 'Executar Diagnósticos'}
          </Button>
          {lastRun && (
            <p className="text-sm text-muted-foreground">
              Última execução: {lastRun.toLocaleTimeString()}
            </p>
          )}
        </div>

        {results && (
          <div className="space-y-4">
            <Alert className={results.overall ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <AlertDescription className="flex items-center justify-between">
                <span className="font-medium">
                  Status Geral: {results.overall ? "Sistema Funcionando Corretamente" : "Problemas Detectados"}
                </span>
                {getStatusBadge(results.overall)}
              </AlertDescription>
            </Alert>

            <div className="grid gap-3">
              <h4 className="font-medium">Detalhes dos Testes:</h4>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.connection)}
                  <span>Conectividade Supabase</span>
                </div>
                {getStatusBadge(results.connection)}
              </div>

              <div className="space-y-2">
                <h5 className="font-medium text-sm">Consultas do Dashboard:</h5>
                
                {Object.entries(results.queries).map(([key, success]) => (
                  <div key={key} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(success)}
                      <span className="text-sm capitalize">
                        {key === 'sale_items' ? 'Itens de Venda' : 
                         key === 'low_stock' ? 'Estoque Baixo' :
                         key === 'sales' ? 'Vendas' :
                         key === 'customers' ? 'Clientes' :
                         key === 'products' ? 'Produtos' : key}
                      </span>
                    </div>
                    {getStatusBadge(success)}
                  </div>
                ))}
              </div>
            </div>

            {!results.overall && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Ações Recomendadas:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Execute o script SQL de correção das políticas RLS</li>
                    <li>• Verifique se as variáveis de ambiente estão configuradas</li>
                    <li>• Verifique se o usuário tem permissões adequadas</li>
                    <li>• Consulte os logs do navegador para mais detalhes</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
