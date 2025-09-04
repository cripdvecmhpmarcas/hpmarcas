import { NextRequest, NextResponse } from 'next/server'

/**
 * Melhor Envio OAuth2 Authorization Flow
 * GET /api/shipping/melhor-envio/auth - Get authorization URL
 * POST /api/shipping/melhor-envio/auth - Exchange code for token
 */

export async function GET() {
  try {
    const clientId = process.env.MELHOR_ENVIO_CLIENT_ID
    const redirectUri = process.env.MELHOR_ENVIO_REDIRECT_URI
    const sandbox = process.env.MELHOR_ENVIO_SANDBOX === 'true'

    if (!clientId || !redirectUri) {
      return NextResponse.json({
        error: 'Melhor Envio credentials not configured'
      }, { status: 500 })
    }

    const baseUrl = sandbox 
      ? 'https://sandbox.melhorenvio.com.br'
      : 'https://melhorenvio.com.br'

    const authUrl = new URL(`${baseUrl}/oauth/authorize`)
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('state', 'shipping-integration') // opcional
    authUrl.searchParams.set('scope', '') // escopo vazio para acesso básico

    return NextResponse.json({
      success: true,
      authorization_url: authUrl.toString(),
      instructions: [
        '1. Clique no link de autorização abaixo',
        '2. Faça login na sua conta do Melhor Envio (sandbox)',
        '3. Autorize a aplicação',
        '4. Você será redirecionado de volta com um código',
        '5. Use o código no endpoint POST para obter o token'
      ]
    })

  } catch (error) {
    console.error('Error generating auth URL:', error)
    return NextResponse.json({
      error: 'Error generating authorization URL'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({
        error: 'Authorization code is required'
      }, { status: 400 })
    }

    const clientId = process.env.MELHOR_ENVIO_CLIENT_ID
    const clientSecret = process.env.MELHOR_ENVIO_CLIENT_SECRET
    const redirectUri = process.env.MELHOR_ENVIO_REDIRECT_URI
    const sandbox = process.env.MELHOR_ENVIO_SANDBOX === 'true'

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json({
        error: 'Melhor Envio credentials not configured'
      }, { status: 500 })
    }

    const tokenUrl = sandbox 
      ? 'https://sandbox.melhorenvio.com.br/oauth/token'
      : 'https://melhorenvio.com.br/oauth/token'

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': process.env.MELHOR_ENVIO_USER_AGENT || 'HPMarcas (contato@hpmarcas.com.br)',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: code
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      return NextResponse.json({
        error: `Token exchange failed: ${response.status} ${errorData}`
      }, { status: response.status })
    }

    const tokenData = await response.json()

    // Salvar tokens em variáveis de ambiente ou banco de dados
    // Por agora, apenas retornar para o desenvolvedor
    return NextResponse.json({
      success: true,
      message: 'Tokens obtidos com sucesso!',
      instructions: [
        'IMPORTANTE: Salve estes tokens em local seguro:',
        `ACCESS_TOKEN: ${tokenData.access_token}`,
        `REFRESH_TOKEN: ${tokenData.refresh_token}`,
        `EXPIRES_IN: ${tokenData.expires_in} segundos`,
        '',
        'Adicione o ACCESS_TOKEN nas variáveis de ambiente como:',
        'MELHOR_ENVIO_ACCESS_TOKEN=<access_token_aqui>',
        '',
        'O refresh_token pode ser usado para renovar o access_token'
      ],
      token_data: {
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        // Não expor tokens sensíveis na resposta
        has_access_token: !!tokenData.access_token,
        has_refresh_token: !!tokenData.refresh_token
      }
    })

  } catch (error) {
    console.error('Error exchanging code for token:', error)
    return NextResponse.json({
      error: 'Error exchanging authorization code for token'
    }, { status: 500 })
  }
}