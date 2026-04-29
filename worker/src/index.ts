interface Env {
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string
  JWT_SECRET: string
  GROQ_API_KEY: string
  GEMINI_API_KEY: string
}

const ALLOWED_ORIGIN = 'https://ammar-mufti.github.io'
const LOCAL_ORIGIN = 'http://localhost:5173'

function cors(origin: string): Record<string, string> {
  const allowed = origin === LOCAL_ORIGIN ? LOCAL_ORIGIN : ALLOWED_ORIGIN
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

function jsonRes(data: unknown, status = 200, origin = '') {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors(origin) },
  })
}

async function signJwt(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 86400 * 7 }))
  const data = `${header}.${body}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return `${data}.${sigB64}`
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin') ?? ''

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(origin) })
    }

    // GitHub OAuth login redirect
    if (url.pathname === '/auth/github/login') {
      const redirect = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&scope=read:user`
      return Response.redirect(redirect, 302)
    }

    // GitHub OAuth callback
    if (url.pathname === '/auth/github/callback') {
      const code = url.searchParams.get('code')
      if (!code) return jsonRes({ error: 'No code' }, 400, origin)

      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code }),
      })
      const tokenData = await tokenRes.json() as { access_token?: string }
      const accessToken = tokenData.access_token
      if (!accessToken) return jsonRes({ error: 'Token exchange failed' }, 400, origin)

      const userRes = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'ccxp-auth-worker' },
      })
      const user = await userRes.json() as { login: string; avatar_url: string; name: string }

      const jwt = await signJwt({ login: user.login, avatar: user.avatar_url, name: user.name ?? user.login }, env.JWT_SECRET)

      // Redirect back to app with token
      const appUrl = `${ALLOWED_ORIGIN}/ccxp-simulator/login?token=${jwt}`
      return Response.redirect(appUrl, 302)
    }

    // Groq proxy
    if (url.pathname === '/api/generate-questions' && request.method === 'POST') {
      const body = await request.text()
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.GROQ_API_KEY}` },
        body,
      })
      const data = await groqRes.text()
      return new Response(data, { status: groqRes.status, headers: { 'Content-Type': 'application/json', ...cors(origin) } })
    }

    return jsonRes({ status: 'ccxp-auth worker running' }, 200, origin)
  },
} satisfies ExportedHandler<Env>
