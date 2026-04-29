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
    'Access-Control-Max-Age': '86400',
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

// Extracts JSON array or object from LLM text that may contain markdown fences or prose
function extractJson(text: string, shape: 'array' | 'object'): unknown {
  if (!text || !text.trim()) throw new Error('LLM returned empty text')

  // Strip markdown fences
  let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()

  // Try direct parse first (model sometimes outputs pure JSON)
  try { return JSON.parse(clean) } catch { /* continue */ }

  // Extract by expected shape
  const pattern = shape === 'array' ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/
  const match = clean.match(pattern)
  if (match) {
    try { return JSON.parse(match[0]) } catch { /* continue */ }
  }

  // Try from first bracket as last resort
  const startChar = shape === 'array' ? '[' : '{'
  const idx = clean.indexOf(startChar)
  if (idx !== -1) {
    try { return JSON.parse(clean.slice(idx)) } catch { /* continue */ }
  }

  throw new Error(`Could not parse JSON from LLM output. Preview: ${text.slice(0, 200)}`)
}

// Calls Gemini. Throws on HTTP error or empty response.
async function callGemini(prompt: string, apiKey: string, maxTokens: number): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.4 },
      }),
    }
  )

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Gemini HTTP ${res.status}: ${body}`)
  }

  const data = await res.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    error?: { message: string }
  }

  if (data.error) throw new Error(`Gemini API error: ${data.error.message}`)

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  if (!text.trim()) throw new Error('Gemini returned empty content')
  return text
}

// Calls Groq with a specific model. Throws on error.
async function callGroqModel(prompt: string, apiKey: string, model: string, maxTokens: number): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.4,
    }),
  })
  if (res.status === 429) throw new Error(`GROQ_RATE_LIMIT_${model}`)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Groq(${model}) HTTP ${res.status}: ${body}`)
  }
  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }>; error?: { message: string } }
  if (data.error) throw new Error(`Groq(${model}) API error: ${data.error.message}`)
  const text = data.choices?.[0]?.message?.content ?? ''
  if (!text.trim()) throw new Error(`Groq(${model}) returned empty content`)
  return text
}

// Tries 3 providers in order: llama-3.3-70b → llama-3.1-8b-instant → Gemini 2.5 Flash
async function llm(prompt: string, env: Env, maxTokens = 2048): Promise<string> {
  const cap = Math.min(maxTokens, 8192)
  const errors: string[] = []

  // 1. Groq primary — llama-3.3-70b-versatile
  try {
    return await callGroqModel(prompt, env.GROQ_API_KEY, 'llama-3.3-70b-versatile', cap)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    errors.push(`llama-3.3-70b: ${msg}`)
    console.error('Groq primary failed:', msg)
    if (msg.includes('RATE_LIMIT')) await new Promise(r => setTimeout(r, 1000))
  }

  // 2. Groq secondary — llama-3.1-8b-instant (separate quota pool)
  try {
    return await callGroqModel(prompt, env.GROQ_API_KEY, 'llama-3.1-8b-instant', cap)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    errors.push(`llama-3.1-8b: ${msg}`)
    console.error('Groq secondary failed:', msg)
    if (msg.includes('RATE_LIMIT')) await new Promise(r => setTimeout(r, 1000))
  }

  // 3. Gemini 2.5 Flash
  try {
    return await callGemini(prompt, env.GEMINI_API_KEY, cap)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    errors.push(`gemini-2.5-flash: ${msg}`)
    console.error('Gemini fallback failed:', msg)
    throw new Error(`All 3 LLMs failed — ${errors.join(' | ')}`)
  }
}

const DOMAIN_TOPIC_MAP: Record<string, string[]> = {
  'CX Strategy': ['CX Vision & Mission', 'Business Case for CX', 'CX Maturity Models', 'CX Governance & Ownership', 'CX Roadmap & Prioritization', 'Aligning CX to Corporate Strategy'],
  'Customer-Centric Culture': ['Culture Change Management', 'Leadership Buy-in & Sponsorship', 'Employee Engagement in CX', 'CX Champions Network', 'Embedding CX Behaviors'],
  'Voice of Customer': ['VoC Program Design', 'Listening Post Strategy', 'Quantitative vs Qualitative Research', 'Customer Journey Analytics', 'Insight Generation & Storytelling', 'Closing the Feedback Loop'],
  'Experience Design': ['Customer Journey Mapping', 'Service Design Principles', 'Design Thinking Process', 'Moments of Truth', 'Prototyping & Testing', 'Innovation in CX'],
  'Metrics & Measurement': ['NPS CSAT CES Explained', 'Linking CX to Business Outcomes', 'Building a CX Dashboard', 'Statistical Concepts for CX', 'ROI Calculation Methods'],
  'Organizational Adoption': ['Change Management for CX', 'Cross-functional Alignment', 'CX Roles & Responsibilities', 'Governance Structures', 'Sustaining CX Momentum'],
}

const DOMAIN_WEIGHTS_MAP: Record<string, string> = {
  'CX Strategy': '20 questions — 20% of exam',
  'Customer-Centric Culture': '17 questions — 17% of exam',
  'Voice of Customer': '20 questions — 20% of exam',
  'Experience Design': '18 questions — 18% of exam',
  'Metrics & Measurement': '15 questions — 15% of exam',
  'Organizational Adoption': '10 questions — 10% of exam',
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin') ?? ''

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }

    if (url.pathname === '/auth/github/login') {
      return Response.redirect(
        `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&scope=read:user`,
        302
      )
    }

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

    if (url.pathname === '/api/llm' && request.method === 'POST') {
      const authHeader = request.headers.get('Authorization') ?? ''
      const token = authHeader.replace('Bearer ', '')
      const payload = await verifyJwt(token, env.JWT_SECRET)
      if (!payload) return jsonRes({ error: 'Unauthorized' }, 401, origin)

      let body: {
        type: string
        domain: string
        count?: number
        extra?: string
        topics?: string[]
        topic?: string
        messages?: Array<{ role: string; content: string }>
        systemPrompt?: string
        pageContext?: string
        question?: string
        a?: string; b?: string; c?: string; d?: string
        correct?: string
        userAnswer?: string
      }

      try {
        body = await request.json()
      } catch {
        return jsonRes({ error: 'Invalid JSON body' }, 400, origin)
      }

      // ── STAGE 1: Domain snapshot ─────────────────────────────────────────
      if (body.type === 'stage1-summary') {
        const prompt = `You are a CCXP exam coach. Give a concise exam-focused summary of domain: "${body.domain}" for someone sitting the exam this Saturday.

Output ONLY this JSON object — no markdown, no explanation:
{
  "tagline": "One sentence describing this domain purpose",
  "examWeight": "${DOMAIN_WEIGHTS_MAP[body.domain] ?? ''}",
  "mustKnow": [
    "Specific fact 1 with framework or model name",
    "Specific fact 2",
    "Specific fact 3",
    "Specific fact 4",
    "Specific fact 5"
  ],
  "commonMistakes": [
    "Specific mistake 1 candidates make in this domain",
    "Specific mistake 2",
    "Specific mistake 3"
  ],
  "connectedDomains": [
    "Domain name — one sentence why connected"
  ]
}`

        try {
          const raw = await llm(prompt, env, 1024)
          const data = extractJson(raw, 'object')
          return jsonRes({ data }, 200, origin)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          return jsonRes({ error: msg }, 500, origin)
        }
      }

      // ── STAGE 2: Key concepts ─────────────────────────────────────────────
      if (body.type === 'stage2-concepts') {
        const topics = body.topics ?? DOMAIN_TOPIC_MAP[body.domain] ?? []

        // Split into 2 batches to stay within token limits
        const half = Math.ceil(topics.length / 2)
        const batches = [topics.slice(0, half), topics.slice(half)].filter(b => b.length > 0)

        const buildPrompt = (batch: string[]) =>
          `You are a CCXP exam coach writing structured study material.
Generate key concepts for domain: "${body.domain}".
Topics: ${batch.join(', ')}

Output ONLY a raw JSON array with exactly ${batch.length} objects — no markdown, no explanation:
[
  {
    "topic": "exact topic name from list",
    "summary": "One sentence what this concept is",
    "bullets": [
      "Specific key point with framework/model name if relevant",
      "Practical CX application",
      "Connection to other CCXP concepts",
      "What the exam specifically tests here"
    ],
    "examTip": "The specific wrong answer pattern to avoid",
    "keyTerms": [
      {"term": "term", "definition": "one sentence"}
    ]
  }
]`

        try {
          const results = await Promise.all(
            batches.map(batch => llm(buildPrompt(batch), env, 4096))
          )
          const parsed = results.flatMap(raw => {
            const arr = extractJson(raw, 'array')
            return Array.isArray(arr) ? arr : []
          })
          if (parsed.length === 0) throw new Error('No topics parsed from batches')
          return jsonRes({ data: parsed }, 200, origin)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          return jsonRes({ error: msg }, 500, origin)
        }
      }

      // ── STAGE 3: Deep dive ────────────────────────────────────────────────
      if (body.type === 'stage3-deepdive') {
        const prompt = `You are a CCXP exam coach. Write a comprehensive deep dive on:
Topic: "${body.topic}"
Domain: "${body.domain}"

Output ONLY this JSON object — no markdown, no explanation:
{
  "overview": "3-4 sentence comprehensive explanation",
  "howItWorks": [
    "Step 1 — specific and actionable",
    "Step 2",
    "Step 3",
    "Step 4"
  ],
  "realWorldExample": {
    "scenario": "Specific company or industry scenario (3-4 sentences)",
    "application": "How this topic applies in that scenario",
    "outcome": "What good CX looks like as a result"
  },
  "examScenario": {
    "question": "An exam-style scenario question about this topic",
    "wrongAnswer": "The tempting wrong answer and why it looks right",
    "correctAnswer": "The correct answer and why it is the best choice"
  },
  "frameworks": [
    {
      "name": "Framework or model name",
      "description": "What it is and when to use it",
      "stages": ["stage1", "stage2", "stage3"]
    }
  ],
  "memoryAid": "A mnemonic, acronym, or memorable shortcut"
}`

        try {
          const raw = await llm(prompt, env, 3000)
          const data = extractJson(raw, 'object')
          return jsonRes({ data }, 200, origin)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          return jsonRes({ error: msg }, 500, origin)
        }
      }

      // ── STAGE 4: Practice quiz ────────────────────────────────────────────
      if (body.type === 'stage4-quiz') {
        const prompt = `Generate exactly 5 practice questions for CCXP domain: "${body.domain}".
Rules: educational explanations (2-3 sentences), all 4 options plausible, vary types.

Output ONLY a raw JSON array with exactly 5 objects — no markdown, no explanation:
[
  {
    "q": "Specific question text",
    "a": "Plausible option A",
    "b": "Plausible option B",
    "c": "Plausible option C",
    "d": "Plausible option D",
    "correct": "b",
    "explanation": "2-3 sentence educational explanation"
  }
]`

        try {
          const raw = await llm(prompt, env, 3000)
          const data = extractJson(raw, 'array')
          if (!Array.isArray(data) || data.length === 0) throw new Error('Expected non-empty array')
          return jsonRes({ data }, 200, origin)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          return jsonRes({ error: msg }, 500, origin)
        }
      }

      // ── Tutor chat ────────────────────────────────────────────────────────
      if (body.type === 'tutor-chat') {
        const systemPrompt = body.systemPrompt ?? `You are an expert CCXP exam coach helping a CX professional prepare for the CCXP certification exam this Saturday. You have deep knowledge of all 6 CCXP domains: CX Strategy (20%), Customer-Centric Culture (17%), Voice of Customer (20%), Experience Design (18%), Metrics & Measurement (15%), Organizational Adoption (10%). Current context: ${body.pageContext ?? 'General study session'}. Style: concise and exam-focused, use bullet points and bold for key terms, give mnemonics when helpful, keep responses under 200 words unless detail is needed.`

        const messages = (body.messages ?? []).slice(-10)
        const groqMessages = [{ role: 'system', content: systemPrompt }, ...messages]

        let response = ''
        try {
          // Use multi-turn chat format directly with primary Groq model
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.GROQ_API_KEY}` },
            body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: groqMessages, max_tokens: 1024, temperature: 0.5 }),
          })
          if (res.status === 429) throw new Error('rate_limit')
          if (res.ok) {
            const data = await res.json() as { choices: Array<{ message: { content: string } }> }
            response = data.choices?.[0]?.message?.content ?? ''
          }
          if (!response) throw new Error('empty')
        } catch {
          try {
            // Fallback: flatten conversation for single-turn APIs
            const flatPrompt = systemPrompt + '\n\n' + messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')
            response = await llm(flatPrompt, env, 1024)
          } catch {
            response = "I'm having trouble connecting right now. Please try again in a moment."
          }
        }
        return jsonRes({ response }, 200, origin)
      }

      // ── Explain question ─────────────────────────────────────────────────
      if (body.type === 'explain-question') {
        const optLabels: Record<string, string> = { a: body.a ?? '', b: body.b ?? '', c: body.c ?? '', d: body.d ?? '' }
        const correctText = optLabels[body.correct ?? ''] ?? ''
        const userText = optLabels[body.userAnswer ?? ''] ?? ''
        const wasCorrect = body.userAnswer === body.correct

        const prompt = `A CCXP candidate answered this question.

Question: ${body.question}
A: ${body.a}  B: ${body.b}  C: ${body.c}  D: ${body.d}
Correct: (${body.correct?.toUpperCase()}) ${correctText}
They chose: (${body.userAnswer?.toUpperCase()}) ${userText}
${wasCorrect ? 'CORRECT.' : 'WRONG.'}

Explain in 3 parts:
**WHY (${body.correct?.toUpperCase()}) is correct:** [1-2 sentences]
**Why the others are wrong:** ${['a','b','c','d'].filter(o => o !== body.correct).map(o => `(${o.toUpperCase()}) one sentence`).join(', ')}
**💡 Exam Tip:** [one memory tip]

Under 150 words. Bold key CX terms. Domain: ${body.domain}`

        try {
          const raw = await llm(prompt, env, 512)
          return jsonRes({ explanation: raw }, 200, origin)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          return jsonRes({ explanation: `Could not generate explanation: ${msg}` }, 200, origin)
        }
      }

      // ── Generate questions (exam) ─────────────────────────────────────────
      if (body.type === 'generate-questions') {
        const prompt = body.extra && body.extra.length > 100
          ? body.extra
          : `Generate ${body.count ?? 5} CCXP exam questions for domain: "${body.domain}".
Output ONLY a raw JSON array:
[{"q":"...","a":"...","b":"...","c":"...","d":"...","correct":"b","explanation":"max 25 words","sourceTopic":"topic","sourceTopicSlug":"kebab-case"}]`

        try {
          const raw = await llm(prompt, env, 4096)
          const parsed = extractJson(raw, 'array')
          if (Array.isArray(parsed) && parsed.length > 0) return jsonRes(parsed, 200, origin)
          throw new Error('Empty array returned')
        } catch {
          return jsonRes({ content: '' }, 200, origin)
        }
      }

      // ── Study plan ────────────────────────────────────────────────────────
      if (body.type === 'study-plan') {
        const prompt = `CCXP study tips for weakest domains: ${body.domain}.
Generate 3 tips per domain.
Output ONLY raw JSON array:
[{"domain":"...","tips":["tip1","tip2","tip3"]}]`

        try {
          const raw = await llm(prompt, env, 1024)
          const parsed = extractJson(raw, 'array')
          return jsonRes(parsed, 200, origin)
        } catch {
          return jsonRes([], 200, origin)
        }
      }

      // ── Legacy generate-content ───────────────────────────────────────────
      if (body.type === 'generate-content') {
        const extra = body.extra ?? ''
        const maxTok = extra === 'topics' ? 4000 : 2048
        let prompt = ''
        if (extra === 'overview') {
          prompt = `Write a study overview for CCXP domain: "${body.domain}". Max 220 words. Plain text.`
        } else if (extra === 'topics') {
          const topics = DOMAIN_TOPIC_MAP[body.domain] ?? []
          prompt = `Generate study content for ${topics.length} topics in domain: "${body.domain}". Topics: ${topics.join(', ')}
Output ONLY raw JSON array:
[{"topic":"...","explanation":"150 words","example":"2-3 sentences","examTrap":"one sentence","keyTerms":[{"term":"...","definition":"..."}]}]`
        } else if (extra === 'flashcards') {
          prompt = `Generate 10 flashcards for CCXP domain: "${body.domain}".
Output ONLY raw JSON array:
[{"front":"max 20 words","back":"max 40 words","why":"one sentence"}]`
        } else if (extra === 'quiz') {
          prompt = `Generate 5 practice questions for CCXP domain: "${body.domain}".
Output ONLY raw JSON array:
[{"q":"...","a":"...","b":"...","c":"...","d":"...","correct":"b","explanation":"2-3 sentences"}]`
        }

        try {
          const raw = await llm(prompt, env, maxTok)
          if (extra === 'overview') return jsonRes({ content: raw }, 200, origin)
          const parsed = extractJson(raw, 'array')
          if (Array.isArray(parsed) && parsed.length > 0) return jsonRes({ data: parsed }, 200, origin)
          return jsonRes({ content: raw }, 200, origin)
        } catch {
          return jsonRes({ content: '' }, 200, origin)
        }
      }

      return jsonRes({ error: 'Unknown request type' }, 400, origin)
    }

    return jsonRes({ status: 'ccxp-auth worker running' }, 200, origin)
  },
} satisfies ExportedHandler<Env>
