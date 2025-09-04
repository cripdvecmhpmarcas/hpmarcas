import { NextRequest, NextResponse } from 'next/server'

/**
 * Melhor Envio OAuth2 Callback Endpoint
 * This endpoint receives the authorization code after user consent
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    // Note: state parameter could be used for CSRF protection in the future
    // const state = searchParams.get('state')

    if (error) {
      return NextResponse.json({
        error: 'Authorization denied',
        details: error,
        description: searchParams.get('error_description')
      }, { status: 400 })
    }

    if (!code) {
      return NextResponse.json({
        error: 'Authorization code not received'
      }, { status: 400 })
    }

    // Now we have the authorization code, let's exchange it for tokens
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

    // Create a success page with tokens
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Melhor Envio - Autorização Concluída</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .success {
            color: #28a745;
            border: 2px solid #28a745;
            background-color: #d4edda;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .token-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
            font-family: monospace;
        }
        .warning {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }
        .copy-btn {
            background-color: #007bff;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
            margin-left: 10px;
        }
        .copy-btn:hover {
            background-color: #0056b3;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success">
            <h2>✅ Autorização Concluída com Sucesso!</h2>
            <p>Sua aplicação foi autorizada no Melhor Envio sandbox.</p>
        </div>

        <div class="warning">
            <strong>⚠️ IMPORTANTE:</strong> Salve o access token abaixo em suas variáveis de ambiente para usar a API.
        </div>

        <h3>Informações do Token</h3>
        <div class="token-info">
            <strong>Access Token:</strong><br>
            <span id="access-token">${tokenData.access_token}</span>
            <button class="copy-btn" onclick="copyToClipboard('access-token')">Copiar</button>
        </div>

        <div class="token-info">
            <strong>Refresh Token:</strong><br>
            <span id="refresh-token">${tokenData.refresh_token}</span>
            <button class="copy-btn" onclick="copyToClipboard('refresh-token')">Copiar</button>
        </div>

        <div class="token-info">
            <strong>Válido por:</strong> ${Math.floor(tokenData.expires_in / 86400)} dias<br>
            <strong>Tipo:</strong> ${tokenData.token_type}
        </div>

        <h3>Próximos Passos</h3>
        <ol>
            <li>Copie o <strong>Access Token</strong> acima</li>
            <li>Adicione no seu arquivo <code>.env</code>:</li>
        </ol>

        <div class="token-info">
            MELHOR_ENVIO_ACCESS_TOKEN=${tokenData.access_token}
        </div>

        <p>Após adicionar o token, sua aplicação poderá usar a API do Melhor Envio!</p>

        <p><a href="/api/shipping/test">🧪 Testar Integração</a></p>
    </div>

    <script>
        function copyToClipboard(elementId) {
            const element = document.getElementById(elementId);
            const textArea = document.createElement('textarea');
            textArea.value = element.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);

            const button = element.nextElementSibling;
            const originalText = button.textContent;
            button.textContent = '✓ Copiado!';
            setTimeout(() => {
                button.textContent = originalText;
            }, 2000);
        }
    </script>
</body>
</html>
    `

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })

  } catch (error) {
    console.error('Error in OAuth callback:', error)
    return NextResponse.json({
      error: 'Error processing OAuth callback'
    }, { status: 500 })
  }
}
