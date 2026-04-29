interface Env {
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string
  JWT_SECRET: string
  GROQ_API_KEY: string
  GEMINI_API_KEY: string
}

const ALLOWED_ORIGINS = ['https://ammar-mufti.github.io', 'http://localhost:5173']

function corsHeaders(origin: string): Record<string, string> {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

function jsonRes(data: unknown, status = 200, origin = '') {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  })
}

async function signJwt(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 86400 * 7 }))
  const data = `${header}.${body}`
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return `${data}.${sigB64}`
}

async function verifyJwt(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const [header, body, sig] = token.split('.')
    const data = `${header}.${body}`
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'],
    )
    const sigBytes = Uint8Array.from(atob(sig.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(data))
    if (!valid) return null
    const payload = JSON.parse(atob(body)) as Record<string, unknown>
    if ((payload.exp as number) * 1000 < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

function extractJson(text: string): string {
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  const arr = cleaned.match(/\[[\s\S]*\]/)
  if (arr) return arr[0]
  const obj = cleaned.match(/\{[\s\S]*\}/)
  if (obj) return obj[0]
  return cleaned
}

function buildPrompt(type: string, domain: string, count?: number, extra?: string): string {
  if (type === 'generate-questions') {
    const domainContext: Record<string, string> = {
      'CX Strategy': 'vision, business case, maturity models, roadmap, governance',
      'Customer-Centric Culture': 'culture change, employee engagement, leadership buy-in, behaviors',
      'Voice of Customer': 'VoC programs, listening posts, research methods, insight, closed loop',
      'Experience Design': 'journey mapping, service design, design thinking, prototyping',
      'Metrics & Measurement': 'NPS, CSAT, CES, ROI, linkage analysis, dashboards, benchmarking',
      'Organizational Adoption': 'change management, cross-functional alignment, CX roles, governance',
    }
    return `You are a CCXP exam question writer. Generate exactly ${count ?? 5} multiple-choice questions for domain: "${domain}".

Rules:
- Realistic CCXP difficulty (CXPA standard)
- 4 choices: a, b, c, d — exactly ONE correct answer
- Explanation must be under 25 words
- Vary types: scenario, definition, best-practice, framework
- Output ONLY a raw JSON array, no markdown, no preamble

Format:
[{"q":"...","a":"...","b":"...","c":"...","d":"...","correct":"b","explanation":"..."}]

Domain context: ${domainContext[domain] ?? domain}`
  }

  if (type === 'generate-content') {
    if (extra === 'overview') {
      return `You are a CCXP exam coach. Write a study overview for domain: "${domain}".
Cover: what it covers, why it matters, connections to other domains, what to expect on the exam. Max 220 words. Plain paragraphs only. Plain text.`
    }
    if (extra === 'topics') {
      const topicMap: Record<string, string[]> = {
        'CX Strategy': ['CX Vision & Mission', 'Business Case for CX', 'CX Maturity Models', 'CX Governance & Ownership', 'CX Roadmap & Prioritization', 'Aligning CX to Corporate Strategy'],
        'Customer-Centric Culture': ['Culture Change Management', 'Leadership Buy-in & Sponsorship', 'Employee Engagement in CX', 'CX Champions Network', 'Embedding CX Behaviors'],
        'Voice of Customer': ['VoC Program Design', 'Listening Post Strategy', 'Quantitative vs Qualitative Research', 'Customer Journey Analytics', 'Insight Generation & Storytelling', 'Closing the Feedback Loop'],
        'Experience Design': ['Customer Journey Mapping', 'Service Design Principles', 'Design Thinking Process', 'Moments of Truth', 'Prototyping & Testing', 'Innovation in CX'],
        'Metrics & Measurement': ['NPS CSAT CES Explained', 'Linking CX to Business Outcomes', 'Building a CX Dashboard', 'Statistical Concepts for CX', 'ROI Calculation Methods'],
        'Organizational Adoption': ['Change Management for CX', 'Cross-functional Alignment', 'CX Roles & Responsibilities', 'Governance Structures', 'Sustaining CX Momentum'],
      }
      const topics = topicMap[domain] ?? []
      return `You are a CCXP exam coach. Generate study content for ${topics.length} topics in domain: "${domain}". Topics: ${topics.join(', ')}

Respond ONLY with raw JSON array:
[{"topic":"Topic Name","explanation":"150-word explanation","example":"Real-world example, 2-3 sentences","examTrap":"Common mistake on exam questions about this topic","keyTerms":[{"term":"...","definition":"one sentence"}]}]
No markdown, no preamble. Raw JSON array only.`
    }
    if (extra === 'flashcards') {
      return `Generate 10 flashcards for CCXP domain: "${domain}".
Mix: 4 key terms, 3 scenario-based, 3 framework recall.

Respond ONLY with raw JSON array:
[{"front":"max 20 words","back":"max 40 words","why":"one sentence"}]
No markdown. Raw JSON only.`
    }
    if (extra === 'quiz') {
      return `Generate 5 practice questions for CCXP domain: "${domain}".
Explanations should be educational (2-3 sentences).

Respond ONLY with raw JSON array:
[{"q":"...","a":"...","b":"...","c":"...","d":"...","correct":"b","explanation":"2-3 sentence educational explanation"}]
No markdown. Raw JSON only.`
    }
  }

  if (type === 'study-plan') {
    return `You are a CCXP exam coach. A student just finished a practice exam.
Their weakest domains are: ${domain}.
Generate 3 specific study tips for each domain.

Respond ONLY with raw JSON array:
[{"domain":"...","tips":["tip1","tip2","tip3"]}]
No markdown. Raw JSON only.`
  }

  return `Answer this CCXP question about ${domain}.`
}

async function callGroq(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
      temperature: 0.4,
    }),
  })
  if (res.status === 429) throw new Error('RATE_LIMIT')
  if (!res.ok) throw new Error(`Groq ${res.status}`)
  const data = await res.json() as { choices: Array<{ message: { content: string } }> }
  return data.choices?.[0]?.message?.content ?? ''
}

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 2048, temperature: 0.4 },
      }),
    }
  )
  if (!res.ok) throw new Error(`Gemini ${res.status}`)
  const data = await res.json() as { candidates: Array<{ content: { parts: Array<{ text: string }> } }> }
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

async function llm(prompt: string, env: Env): Promise<string> {
  try {
    return await callGroq(prompt, env.GROQ_API_KEY)
  } catch (err) {
    if (err instanceof Error && err.message === 'RATE_LIMIT') {
      await new Promise(r => setTimeout(r, 3000))
    }
    try {
      return await callGemini(prompt, env.GEMINI_API_KEY)
    } catch {
      return ''
    }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin') ?? ''

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }

    // GitHub OAuth login
    if (url.pathname === '/auth/github/login') {
      return Response.redirect(
        `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&scope=read:user`,
        302
      )
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
      if (!tokenData.access_token) return jsonRes({ error: 'Token exchange failed' }, 400, origin)

      const userRes = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'ccxp-auth-worker' },
      })
      const user = await userRes.json() as { login: string; avatar_url: string; name: string }
      const jwt = await signJwt({ login: user.login, avatar: user.avatar_url, name: user.name ?? user.login }, env.JWT_SECRET)

      return Response.redirect(`https://ammar-mufti.github.io/ccxp-simulator/login?token=${jwt}`, 302)
    }

    // LLM proxy
    if (url.pathname === '/api/llm' && request.method === 'POST') {
      // Validate JWT
      const authHeader = request.headers.get('Authorization') ?? ''
      const token = authHeader.replace('Bearer ', '')
      const payload = await verifyJwt(token, env.JWT_SECRET)
      if (!payload) return jsonRes({ error: 'Unauthorized' }, 401, origin)

      const body = await request.json() as { type: string; domain: string; count?: number; extra?: string }
      const prompt = buildPrompt(body.type, body.domain, body.count, body.extra)
      const raw = await llm(prompt, env)

      // For overview, return plain text; for everything else try to parse JSON
      if (body.extra === 'overview') {
        return jsonRes({ content: raw }, 200, origin)
      }

      try {
        const parsed = JSON.parse(extractJson(raw))
        return jsonRes(parsed, 200, origin)
      } catch {
        return jsonRes({ content: raw }, 200, origin)
      }
    }

    return jsonRes({ status: 'ccxp-auth worker running' }, 200, origin)
  },
} satisfies ExportedHandler<Env>
