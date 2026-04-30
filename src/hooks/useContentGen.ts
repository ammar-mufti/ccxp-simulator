import { useState, useCallback } from 'react'
import { callLLM } from '../services/llm'
import { cacheGet, cacheSet, cacheKey } from '../services/contentCache'
import type { TopicContent, Flashcard, QuizQuestion } from '../store/learnStore'
import { DOMAIN_TOPICS } from '../store/learnStore'
import { useAuthStore } from '../store/authStore'

function extractArray<T>(raw: unknown): T[] | null {
  if (Array.isArray(raw) && raw.length > 0) return raw as T[]

  if (raw && typeof raw === 'object') {
    // New shape: { data: [...] }
    if ('data' in raw && Array.isArray((raw as { data: unknown }).data)) {
      const arr = (raw as { data: unknown[] }).data
      if (arr.length > 0) return arr as T[]
    }
    // Old shape: { content: "..." } — try to parse the string
    if ('content' in raw && typeof (raw as { content: unknown }).content === 'string') {
      return extractArray<T>((raw as { content: string }).content)
    }
  }

  if (typeof raw === 'string' && raw.length > 0) {
    try {
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
      const match = cleaned.match(/\[[\s\S]*\]/)
      if (match) {
        const parsed = JSON.parse(match[0])
        if (Array.isArray(parsed) && parsed.length > 0) return parsed as T[]
      }
    } catch {
      // fall through
    }
  }

  return null
}

function extractText(raw: unknown): string {
  if (typeof raw === 'string' && raw.length > 0) return raw
  if (raw && typeof raw === 'object') {
    if ('content' in raw && typeof (raw as { content: unknown }).content === 'string') {
      return (raw as { content: string }).content
    }
    if ('data' in raw && typeof (raw as { data: unknown }).data === 'string') {
      return (raw as { data: string }).data
    }
  }
  return ''
}

// Static fallbacks so the UI is never empty
const FALLBACK_TOPICS: Record<string, TopicContent[]> = Object.fromEntries(
  Object.entries(DOMAIN_TOPICS).map(([domain, topicList]) => [
    domain,
    topicList.map(t => ({
      topic: t,
      explanation: `${t} is a key concept in the ${domain} domain of the CCXP exam. Master this area to improve your overall score.`,
      example: `A CX leader applies ${t} when redesigning customer touchpoints to align with business outcomes.`,
      examTrap: `Don't confuse this concept with adjacent terms — exam questions often test precise understanding.`,
      keyTerms: [],
    })),
  ])
)

export function useContentGen(domain: string) {
  const token = useAuthStore(s => s.token) ?? ''
  const [overview, setOverview] = useState<string | null>(null)
  const [topics, setTopics] = useState<TopicContent[] | null>(null)
  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null)
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null)
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<Record<string, string | null>>({})

  const setLoad = (key: string, val: boolean) => setLoading(p => ({ ...p, [key]: val }))
  const setErr = (key: string, val: string | null) => setError(p => ({ ...p, [key]: val }))

  const loadOverview = useCallback(async () => {
    const ck = cacheKey('ccxp', domain, 'overview')
    const cached = cacheGet<string>(ck)
    if (cached) { setOverview(cached); return }
    setLoad('overview', true); setErr('overview', null)
    try {
      const raw = await callLLM({ type: 'generate-content', domain, extra: 'overview' }, token)
      const text = extractText(raw)
      const result = text || `${domain} is a core CCXP domain covering essential customer experience principles. Study this area to strengthen your certification readiness.`
      cacheSet(ck, result)
      setOverview(result)
    } catch (err) {
      console.error('loadOverview failed:', err)
      setErr('overview', 'Failed to load overview — click Retry')
    } finally {
      setLoad('overview', false)
    }
  }, [domain, token])

  const loadTopics = useCallback(async () => {
    const ck = cacheKey('ccxp', domain, 'topics')
    const cached = cacheGet<TopicContent[]>(ck)
    if (cached) { setTopics(cached); return }
    setLoad('topics', true); setErr('topics', null)
    try {
      const raw = await callLLM({ type: 'generate-content', domain, extra: 'topics' }, token)
      const parsed = extractArray<TopicContent>(raw)
      const result = parsed ?? FALLBACK_TOPICS[domain] ?? []
      cacheSet(ck, result)
      setTopics(result)
    } catch (err) {
      console.error('loadTopics failed:', err)
      // Use fallback instead of showing error — content is too important
      const fallback = FALLBACK_TOPICS[domain] ?? []
      setTopics(fallback)
    } finally {
      setLoad('topics', false)
    }
  }, [domain, token])

  const loadFlashcards = useCallback(async () => {
    const ck = cacheKey('ccxp', domain, 'flashcards')
    const cached = cacheGet<Flashcard[]>(ck)
    if (cached) { setFlashcards(cached); return }
    setLoad('flashcards', true); setErr('flashcards', null)
    try {
      const raw = await callLLM({ type: 'generate-content', domain, extra: 'flashcards' }, token)
      const parsed = extractArray<Flashcard>(raw)
      const result = parsed ?? [
        { front: `What is the primary goal of ${domain}?`, back: 'To improve customer experiences through systematic, strategic approaches aligned to business outcomes.', why: 'Foundation concept tested on nearly every CCXP exam.' },
        { front: `Name a key deliverable from ${domain}`, back: 'Documented frameworks, metrics, and action plans that drive measurable CX improvement.', why: 'Deliverables distinguish domains on scenario questions.' },
        { front: 'What does "closing the loop" mean in CX?', back: 'Acting on customer feedback and communicating back to the customer what was done as a result.', why: 'Frequently tested in VoC and CX Strategy domains.' },
        { front: 'Define CX Maturity Model', back: 'A staged framework measuring how advanced an organisation is in embedding customer experience into culture and operations.', why: 'Maturity model questions appear in CX Strategy and Culture domains.' },
        { front: 'NPS formula', back: '% Promoters minus % Detractors. Scored 0-10: Promoters 9-10, Passives 7-8, Detractors 0-6.', why: 'NPS calculation is directly tested.' },
      ]
      cacheSet(ck, result)
      setFlashcards(result)
    } catch (err) {
      console.error('loadFlashcards failed:', err)
      setErr('flashcards', 'Failed to load flashcards — click Retry')
    } finally {
      setLoad('flashcards', false)
    }
  }, [domain, token])

  const loadQuiz = useCallback(async () => {
    const ck = cacheKey('ccxp', domain, 'quiz')
    const cached = cacheGet<QuizQuestion[]>(ck)
    if (cached) { setQuiz(cached); return }
    setLoad('quiz', true); setErr('quiz', null)
    try {
      const raw = await callLLM({ type: 'generate-content', domain, extra: 'quiz' }, token)
      const parsed = extractArray<QuizQuestion>(raw)
      const result = parsed ?? [{
        q: `Which approach best represents the core purpose of ${domain}?`,
        a: 'Reactive problem solving after customer complaints',
        b: 'Proactive, strategy-driven improvement of customer experiences',
        c: 'Cost reduction through process automation',
        d: 'Technology-first implementation without customer input',
        correct: 'b',
        explanation: `${domain} requires a proactive, systematic approach that places the customer at the centre of business strategy. Reactive approaches and cost-first thinking contradict CCXP principles.`,
      }]
      cacheSet(ck, result)
      setQuiz(result)
    } catch (err) {
      console.error('loadQuiz failed:', err)
      setErr('quiz', 'Failed to load quiz — click Retry')
    } finally {
      setLoad('quiz', false)
    }
  }, [domain, token])

  return { overview, topics, flashcards, quiz, loading, error, loadOverview, loadTopics, loadFlashcards, loadQuiz }
}
