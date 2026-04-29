import { useCallback } from 'react'
import { callLLM } from '../services/llm'
import type { Question, ExamMode } from '../store/examStore'
import { DOMAIN_WEIGHTS } from '../store/examStore'
import { useAuthStore } from '../store/authStore'

const CHUNK_SIZE = 5

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

function parseQuestions(raw: unknown, domain: string): Question[] {
  try {
    let arr: unknown[] = []
    if (Array.isArray(raw)) {
      arr = raw
    } else if (typeof raw === 'string') {
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
      const match = cleaned.match(/\[[\s\S]*\]/)
      if (match) arr = JSON.parse(match[0])
    } else if (raw && typeof raw === 'object' && 'content' in raw) {
      return parseQuestions((raw as { content: unknown }).content, domain)
    }
    if (arr.length > 0) {
      return arr.map(q => ({ ...(q as object), id: crypto.randomUUID(), domain })) as Question[]
    }
  } catch {
    // fall through
  }
  return []
}

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function useQuestionGen() {
  const token = useAuthStore(s => s.token) ?? ''

  const generateForMode = useCallback(async (
    mode: ExamMode,
    domain: string | null,
    onProgress: (loaded: number, total: number, domainLabel: string, uniqueCount: number, targetCount: number) => void
  ): Promise<Question[]> => {
    const weights = DOMAIN_WEIGHTS[mode]
    const domains = domain ? [domain] : Object.keys(weights)

    // Shared seen set across ALL domains to prevent cross-domain duplicates
    const seenQuestions = new Set<string>()
    const allQuestions: Question[] = []

    // Calculate total chunks for progress tracking
    const totalChunks = domains.reduce((sum, d) => {
      const total = domain ? (weights[d] ?? 10) : (weights[d] ?? 0)
      return sum + Math.ceil(total / CHUNK_SIZE)
    }, 0)
    let chunksLoaded = 0
    onProgress(0, totalChunks, '', 0, 0)

    for (const d of domains) {
      const targetCount = domain ? (weights[d] ?? 10) : (weights[d] ?? 0)
      const domainQuestions: Question[] = []
      let attempts = 0
      const maxAttempts = Math.ceil(targetCount / CHUNK_SIZE) + 3 // allow extra retries

      while (domainQuestions.length < targetCount && attempts < maxAttempts) {
        const needed = targetCount - domainQuestions.length
        const chunkSize = Math.min(needed, CHUNK_SIZE)

        // Build exclusion hint from already-seen question topics (first 10)
        const exclusionNote = seenQuestions.size > 0
          ? `\nDo NOT repeat these question topics already used: ${[...seenQuestions].slice(0, 10).join(' | ')}`
          : ''

        try {
          const raw = await callLLM(
            { type: 'generate-questions', domain: d, count: chunkSize, extra: exclusionNote },
            token
          )
          const batch = parseQuestions(raw, d)

          // Deduplicate against global seen set
          const uniqueBatch = batch.filter(q => {
            const key = q.q.trim().toLowerCase()
            if (seenQuestions.has(key)) return false
            seenQuestions.add(key)
            return true
          })

          domainQuestions.push(...uniqueBatch)
        } catch {
          // On error, pad with fallbacks (also deduplicated by their fixed text)
          const fallback = FALLBACK_QUESTION(d)
          const key = fallback.q.trim().toLowerCase()
          if (!seenQuestions.has(key)) {
            seenQuestions.add(key)
            domainQuestions.push(fallback)
          }
        }

        attempts++
        chunksLoaded++
        onProgress(chunksLoaded, totalChunks, d, domainQuestions.length, targetCount)
      }

      // If still short after max attempts, pad with fallbacks
      while (domainQuestions.length < targetCount) {
        domainQuestions.push(FALLBACK_QUESTION(d))
      }

      allQuestions.push(...domainQuestions.slice(0, targetCount))
    }

    // Final deduplication pass (safety net)
    const finalSeen = new Set<string>()
    const dedupedQuestions = allQuestions.filter(q => {
      const key = q.q.trim().toLowerCase()
      if (finalSeen.has(key)) return false
      finalSeen.add(key)
      return true
    })

    console.log('Total generated:', allQuestions.length)
    console.log('Unique questions:', dedupedQuestions.length)

    // Fisher-Yates shuffle for random order every exam
    return fisherYates(dedupedQuestions)
  }, [token])

  return { generateForMode }
}
