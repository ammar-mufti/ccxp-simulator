import { useState, useCallback } from 'react'
import { callLLM } from '../services/llm'
import { cacheGet, cacheSet, cacheKey } from '../services/contentCache'
import type { TopicContent, Flashcard, QuizQuestion } from '../store/learnStore'
import { DOMAIN_TOPICS } from '../store/learnStore'
import { useAuthStore } from '../store/authStore'

function parseWorkerJson<T>(raw: unknown, fallback: T): T {
  try {
    if (typeof raw === 'string') {
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
      const arrMatch = cleaned.match(/\[[\s\S]*\]/)
      if (arrMatch) return JSON.parse(arrMatch[0]) as T
      return JSON.parse(cleaned) as T
    }
    if (Array.isArray(raw)) return raw as T
    if (raw && typeof raw === 'object' && 'content' in raw) {
      return parseWorkerJson((raw as { content: unknown }).content, fallback)
    }
    return fallback
  } catch {
    return fallback
  }
}

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
    const ck = cacheKey(domain, 'overview')
    const cached = cacheGet<string>(ck)
    if (cached) { setOverview(cached); return }
    setLoad('overview', true); setErr('overview', null)
    try {
      const raw = await callLLM({ type: 'generate-content', domain, extra: 'overview' }, token)
      const text = typeof raw === 'string' ? raw
        : (raw as { content?: string })?.content ?? ''
      const result = text || `${domain} is a core CCXP domain covering essential customer experience principles.`
      cacheSet(ck, result)
      setOverview(result)
    } catch {
      setErr('overview', 'Failed to load overview')
    } finally {
      setLoad('overview', false)
    }
  }, [domain, token])

  const loadTopics = useCallback(async () => {
    const ck = cacheKey(domain, 'topics')
    const cached = cacheGet<TopicContent[]>(ck)
    if (cached) { setTopics(cached); return }
    setLoad('topics', true); setErr('topics', null)
    try {
      const topicList = DOMAIN_TOPICS[domain] ?? []
      const raw = await callLLM({ type: 'generate-content', domain, extra: 'topics' }, token)
      const result = parseWorkerJson<TopicContent[]>(raw, [])
      const final = result.length > 0 ? result : topicList.map(t => ({
        topic: t,
        explanation: `${t} is a key concept in ${domain}.`,
        example: 'Experienced CX teams apply this in real-world customer interactions.',
        examTrap: 'Watch for questions that confuse this with related but distinct concepts.',
        keyTerms: [],
      }))
      cacheSet(ck, final)
      setTopics(final)
    } catch {
      setErr('topics', 'Failed to load topics')
    } finally {
      setLoad('topics', false)
    }
  }, [domain, token])

  const loadFlashcards = useCallback(async () => {
    const ck = cacheKey(domain, 'flashcards')
    const cached = cacheGet<Flashcard[]>(ck)
    if (cached) { setFlashcards(cached); return }
    setLoad('flashcards', true); setErr('flashcards', null)
    try {
      const raw = await callLLM({ type: 'generate-content', domain, extra: 'flashcards' }, token)
      const result = parseWorkerJson<Flashcard[]>(raw, [])
      const final = result.length > 0 ? result : [
        { front: `What is the primary goal of ${domain}?`, back: 'To improve customer experiences by applying systematic approaches.', why: 'Foundation concept.' },
        { front: 'Name a key framework in this domain', back: 'Multiple frameworks exist; focus on those most tested in CCXP exams.', why: 'Framework recall is heavily tested.' },
      ]
      cacheSet(ck, final)
      setFlashcards(final)
    } catch {
      setErr('flashcards', 'Failed to load flashcards')
    } finally {
      setLoad('flashcards', false)
    }
  }, [domain, token])

  const loadQuiz = useCallback(async () => {
    const ck = cacheKey(domain, 'quiz')
    const cached = cacheGet<QuizQuestion[]>(ck)
    if (cached) { setQuiz(cached); return }
    setLoad('quiz', true); setErr('quiz', null)
    try {
      const raw = await callLLM({ type: 'generate-content', domain, extra: 'quiz' }, token)
      const result = parseWorkerJson<QuizQuestion[]>(raw, [])
      const final = result.length > 0 ? result : [{
        q: `Which approach best represents ${domain}?`,
        a: 'Reactive problem solving only',
        b: 'Proactive customer-centric strategy',
        c: 'Cost reduction focus',
        d: 'Technology-first implementation',
        correct: 'b',
        explanation: `${domain} requires a proactive, strategic approach embedded in all decisions.`,
      }]
      cacheSet(ck, final)
      setQuiz(final)
    } catch {
      setErr('quiz', 'Failed to load quiz')
    } finally {
      setLoad('quiz', false)
    }
  }, [domain, token])

  return { overview, topics, flashcards, quiz, loading, error, loadOverview, loadTopics, loadFlashcards, loadQuiz }
}
