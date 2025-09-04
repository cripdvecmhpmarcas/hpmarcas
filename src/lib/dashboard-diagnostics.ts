import { getSupabaseAdmin } from './supabase'

// Função para verificar e corrigir problemas de conectividade
export async function verifySupabaseConnection() {
  try {
    const supabase = getSupabaseAdmin()

    // Testar conexão básica
    const { data, error } = await supabase
      .from('customers')
      .select('count')
      .limit(1)
      .single()
    console.log('Dados de teste de conexão:', data)
    if (error) {
      console.error('Erro de conectividade Supabase:', error)
      return false
    }

    console.log('Conexão Supabase OK')
    return true
  } catch (error) {
    console.error('Erro geral de conectividade:', error)
    return false
  }
}

// Função para garantir que o cliente padrão existe
export async function ensureDefaultCustomer() {
  try {
    const supabase = getSupabaseAdmin()

    // Verificar se cliente padrão existe
    const { data: existingCustomer, error: findError } = await supabase
      .from('customers')
      .select('id, name')
      .eq('name', 'Cliente Balcão')
      .eq('type', 'retail')
      .eq('is_anonymous', true)
      .maybeSingle()

    if (findError) {
      console.error('Erro ao buscar cliente padrão:', findError)
      throw findError
    }

    if (existingCustomer) {
      return existingCustomer
    }

    // Criar cliente padrão se não existir
    const { data: newCustomer, error: createError } = await supabase
      .from('customers')
      .insert({
        name: 'Cliente Balcão',
        type: 'retail',
        discount: 0,
        status: 'active',
        is_anonymous: true,
        notes: 'Cliente padrão do sistema para vendas no balcão',
      })
      .select('id, name')
      .single()

    if (createError) {
      console.error('Erro ao criar cliente padrão:', createError)
      throw createError
    }

    return newCustomer
  } catch (error) {
    console.error('Erro ao garantir cliente padrão:', error)
    throw error
  }
}

// Função para testar todas as consultas do dashboard
export async function testDashboardQueries() {
  const supabase = getSupabaseAdmin()
  const results = {
    sales: false,
    customers: false,
    products: false,
    sale_items: false,
    low_stock: false
  }

  try {
    // Testar consulta de vendas
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('total, created_at, customer_id')
      .eq('status', 'completed')
      .limit(1)
    console.log('Dados de vendas:', salesData)

    if (!salesError) {
      results.sales = true
    } else {
      console.error('Erro na consulta de vendas:', salesError)
    }

    // Testar consulta de clientes
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .select('id, name, type, is_anonymous')
      .limit(1)
    console.log('Dados de clientes:', customersData)

    if (!customersError) {
      results.customers = true
    } else {
      console.error('Erro na consulta de clientes:', customersError)
    }

    // Testar consulta de produtos
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('status, stock, min_stock, cost, retail_price, category, brand')
      .limit(1)
    console.log('Dados de produtos:', productsData)

    if (!productsError) {
      results.products = true
    } else {
      console.error('Erro na consulta de produtos:', productsError)
    }

    // Testar consulta de itens de venda
    const { data: saleItemsData, error: saleItemsError } = await supabase
      .from('sale_items')
      .select('product_id, quantity, total_price, sales!inner(created_at, status)')
      .limit(1)
    console.log('Dados de itens de venda:', saleItemsData)

    if (!saleItemsError) {
      results.sale_items = true
    } else {
      console.error('Erro na consulta de itens de venda:', saleItemsError)
    }

    // Testar view de estoque baixo
    const { data: lowStockData, error: lowStockError } = await supabase
      .from('low_stock_products')
      .select('*')
      .limit(1)
    console.log('Dados de estoque baixo:', lowStockData)

    if (!lowStockError) {
      results.low_stock = true
    } else {
      console.error('Erro na consulta de estoque baixo:', lowStockError)
    }

  } catch (error) {
    console.error('Erro geral nos testes:', error)
  }

  return results
}

// Função para executar diagnósticos completos
export async function runDiagnostics() {
  console.log('Iniciando diagnósticos do sistema...')

  // Testar conectividade
  const connectionOk = await verifySupabaseConnection()
  console.log('Conectividade:', connectionOk ? 'OK' : 'FALHA')

  // Garantir cliente padrão
  try {
    const defaultCustomer = await ensureDefaultCustomer()
    console.log('liente padrão:', defaultCustomer ? 'OK' : 'FALHA')
  } catch (error) {
    console.log('Cliente padrão: FALHA', error)
  }

  // Testar consultas
  const queryResults = await testDashboardQueries()
  console.log('Resultados dos testes de consulta:')
  Object.entries(queryResults).forEach(([key, success]) => {
    console.log(`  ${success ? '✅' : '❌'} ${key}:`, success ? 'OK' : 'FALHA')
  })

  const allQueriesOk = Object.values(queryResults).every(Boolean)
  console.log('Status geral:', allQueriesOk ? 'TUDO OK' : 'PROBLEMAS DETECTADOS')

  return {
    connection: connectionOk,
    queries: queryResults,
    overall: connectionOk && allQueriesOk
  }
}
