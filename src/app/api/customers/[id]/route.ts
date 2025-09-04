import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const customerId = params.id

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'ID do customer requerido' },
        { status: 400 }
      )
    }

    // Usando Service Role Client para operações administrativas
    const supabase = createServiceRoleClient()

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, name, email, cpf_cnpj, type, status')
      .eq('id', customerId)
      .single()

    if (customerError) {
      if (customerError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Customer nao encontrado' },
          { status: 404 }
        )
      }
      console.error('Error fetching customer:', customerError)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar customer' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      customer
    })

  } catch (error) {
    console.error('Get customer error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
