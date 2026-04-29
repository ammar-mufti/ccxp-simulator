import { callGroq } from './groq'
import { callGemini } from './gemini'

function extractJson(text: string): string {
  // Strip markdown fences
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  // Try to extract array
  const arrMatch = cleaned.match(/\[[\s\S]*\]/)
  if (arrMatch) return arrMatch[0]
  // Try to extract object
  const objMatch = cleaned.match(/\{[\s\S]*\}/)
  if (objMatch) return objMatch[0]
  return cleaned
}

export function parseJsonSafe<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(extractJson(text)) as T
  } catch {
    return fallback
  }
}

export async function llmCall(prompt: string): Promise<string> {
  try {
    return await callGroq(prompt)
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'RATE_LIMIT') {
      await new Promise(r => setTimeout(r, 3000))
    }
    try {
      return await callGemini(prompt)
    } catch {
      return ''
    }
  }
}

export async function llmJson<T>(prompt: string, fallback: T, retryOnFail = true): Promise<T> {
  const raw = await llmCall(prompt)
  if (!raw) return fallback
  const parsed = parseJsonSafe<T>(raw, fallback)
  // If fallback returned and retry allowed, try once more with stricter prompt
  if (parsed === fallback && retryOnFail) {
    const strictPrompt = prompt + '\n\nCRITICAL: Output ONLY a raw JSON array. No text before or after. No markdown.'
    const raw2 = await llmCall(strictPrompt)
    return parseJsonSafe<T>(raw2, fallback)
  }
  return parsed
}
