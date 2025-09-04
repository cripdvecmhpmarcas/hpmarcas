import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customer_id, cpf_cnpj } = body

    // Validação dos dados obrigatórios
    if (!customer_id || !cpf_cnpj) {
      return NextResponse.json(
        { success: false, error: 'Customer ID e CPF/CNPJ são obrigatórios' },
        { status: 400 }
      )
    }

    // Validação básica do formato do CPF/CNPJ
    const cleanDocument = cpf_cnpj.replace(/\D/g, '')
    if (cleanDocument.length !== 11 && cleanDocument.length !== 14) {
      return NextResponse.json(
        { success: false, error: 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos' },
        { status: 400 }
      )
    }

    // Usando Service Role Client para operações administrativas
    const supabase = createServiceRoleClient()

    // Verifica se o customer existe
    const { data: existingCustomer, error: customerError } = await supabase
      .from('customers')
      .select('id, name, email')
      .eq('id', customer_id)
      .single()

    if (customerError || !existingCustomer) {
      return NextResponse.json(
        { success: false, error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    // Verifica se já existe outro customer com o mesmo CPF/CNPJ
    const { data: duplicateCustomer, error: duplicateError } = await supabase
      .from('customers')
      .select('id')
      .eq('cpf_cnpj', cleanDocument)
      .neq('id', customer_id)
      .single()

    if (!duplicateError && duplicateCustomer) {
      return NextResponse.json(
        { success: false, error: 'Este CPF/CNPJ já está sendo usado por outro cliente' },
        { status: 409 }
      )
    }

    // Atualiza o CPF/CNPJ do customer
    const { data: updatedCustomer, error: updateError } = await supabase
      .from('customers')
      .update({
        cpf_cnpj: cleanDocument,
        updated_at: new Date().toISOString()
      })
      .eq('id', customer_id)
      .select('id, name, email, cpf_cnpj')
      .single()

    if (updateError) {
      console.error('Error updating customer CPF/CNPJ:', updateError)
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar CPF/CNPJ' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      customer: updatedCustomer,
      message: 'CPF/CNPJ atualizado com sucesso'
    })

  } catch (error) {
    console.error('Update CPF/CNPJ error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Customer CPF/CNPJ update API is running'
  })
}
