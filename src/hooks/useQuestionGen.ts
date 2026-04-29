import { useCallback } from 'react'
import { callLLM } from '../services/llm'
import type { Question, ExamMode } from '../store/examStore'
import { DOMAIN_WEIGHTS } from '../store/examStore'
import { useAuthStore } from '../store/authStore'

const FALLBACK_QUESTION = (domain: string): Question => ({
  id: crypto.randomUUID(),
  q: `Which of the following best describes a core principle of ${domain}?`,
  a: 'Focusing solely on cost reduction',
  b: 'Placing the customer at the center of all decisions',
  c: 'Ignoring employee feedback',
  d: 'Prioritizing technology over people',
  correct: 'b',
  explanation: 'Customer-centricity is fundamental to all CCXP domains.',
  domain,
})

function parseQuestions(raw: unknown, domain: string, count: number): Question[] {
  try {
    let arr: unknown[] = []
    if (Array.isArray(raw)) {
      arr = raw
    } else if (typeof raw === 'string') {
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
      const match = cleaned.match(/\[[\s\S]*\]/)
      if (match) arr = JSON.parse(match[0])
    } else if (raw && typeof raw === 'object' && 'content' in raw) {
      return parseQuestions((raw as { content: unknown }).content, domain, count)
    }
    if (arr.length > 0) {
      return arr.map(q => ({ ...(q as object), id: crypto.randomUUID(), domain })) as Question[]
    }
  } catch {
    // fall through to fallback
  }
  return Array.from({ length: count }, () => FALLBACK_QUESTION(domain))
}

export function useQuestionGen() {
  const token = useAuthStore(s => s.token) ?? ''

  const generateForMode = useCallback(async (
    mode: ExamMode,
    domain: string | null,
    onProgress: (loaded: number, total: number) => void
  ): Promise<Question[]> => {
    const weights = DOMAIN_WEIGHTS[mode]
    const domains = domain ? [domain] : Object.keys(weights)
    const allQuestions: Question[] = []

    const chunks: Array<{ domain: string; count: number }> = []
    for (const d of domains) {
      const total = domain ? (weights[d] ?? 10) : (weights[d] ?? 0)
      for (let i = 0; i < total; i += 5) {
        chunks.push({ domain: d, count: Math.min(5, total - i) })
      }
    }

    onProgress(0, chunks.length)

    for (let i = 0; i < chunks.length; i++) {
      const { domain: d, count } = chunks[i]
      try {
        const raw = await callLLM({ type: 'generate-questions', domain: d, count }, token)
        allQuestions.push(...parseQuestions(raw, d, count))
      } catch {
        allQuestions.push(...Array.from({ length: count }, () => FALLBACK_QUESTION(d)))
      }
      onProgress(i + 1, chunks.length)
    }

    return allQuestions
  }, [token])

  return { generateForMode }
}
