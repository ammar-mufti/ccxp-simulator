import { useCallback } from 'react'
import { llmJson } from '../services/llm'
import type { Question, ExamMode } from '../store/examStore'
import { DOMAIN_WEIGHTS } from '../store/examStore'

const DOMAIN_CONTEXT: Record<string, string> = {
  'CX Strategy': 'vision, business case, maturity models, roadmap, governance',
  'Customer-Centric Culture': 'culture change, employee engagement, leadership buy-in, behaviors',
  'Voice of Customer': 'VoC programs, listening posts, research methods, insight, closed loop',
  'Experience Design': 'journey mapping, service design, design thinking, prototyping',
  'Metrics & Measurement': 'NPS, CSAT, CES, ROI, linkage analysis, dashboards, benchmarking',
  'Organizational Adoption': 'change management, cross-functional alignment, CX roles, governance',
}

function buildPrompt(domain: string, count: number): string {
  return `You are a CCXP exam question writer. Generate exactly ${count} multiple-choice questions for domain: "${domain}".

Rules:
- Realistic CCXP difficulty (CXPA standard)
- 4 choices: a, b, c, d — exactly ONE correct answer
- Explanation must be under 25 words
- Vary types: scenario, definition, best-practice, framework
- Output ONLY a raw JSON array, no markdown, no preamble

Format:
[{"q":"...","a":"...","b":"...","c":"...","d":"...","correct":"b","explanation":"...","id":"${crypto.randomUUID()}"}]

Domain context: ${DOMAIN_CONTEXT[domain] ?? domain}`
}

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

export function useQuestionGen() {
  const generateForMode = useCallback(async (
    mode: ExamMode,
    domain: string | null,
    onProgress: (loaded: number, total: number) => void
  ): Promise<Question[]> => {
    const weights = DOMAIN_WEIGHTS[mode]
    const domains = domain ? [domain] : Object.keys(weights)
    const allQuestions: Question[] = []

    let totalChunks = 0
    const chunks: Array<{ domain: string; count: number }> = []
    for (const d of domains) {
      const total = domain ? weights[d] ?? 10 : weights[d] ?? 0
      for (let i = 0; i < total; i += 5) {
        chunks.push({ domain: d, count: Math.min(5, total - i) })
        totalChunks++
      }
    }

    let loaded = 0
    onProgress(0, totalChunks)

    for (const chunk of chunks) {
      const prompt = buildPrompt(chunk.domain, chunk.count)
      type RawQ = Omit<Question, 'domain'>
      const parsed = await llmJson<RawQ[]>(prompt, [])
      const questions: Question[] = parsed.length > 0
        ? parsed.map(q => ({ ...q, id: crypto.randomUUID(), domain: chunk.domain }))
        : Array.from({ length: chunk.count }, () => FALLBACK_QUESTION(chunk.domain))
      allQuestions.push(...questions)
      loaded++
      onProgress(loaded, totalChunks)
    }

    return allQuestions
  }, [])

  return { generateForMode }
}
