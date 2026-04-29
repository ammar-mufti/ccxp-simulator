import { useState, useCallback } from 'react'
import { llmJson, llmCall } from '../services/llm'
import { cacheGet, cacheSet, cacheKey } from '../services/contentCache'
import type { TopicContent, Flashcard, QuizQuestion } from '../store/learnStore'
import { DOMAIN_TOPICS } from '../store/learnStore'

export function useContentGen(domain: string) {
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
      const prompt = `You are a CCXP exam coach. Write a study overview for domain: "${domain}".
Cover: what it covers, why it matters, connections to other domains, what to expect on the exam. Max 220 words. Plain paragraphs only. Plain text.`
      const text = await llmCall(prompt)
      const result = text || `${domain} is a core CCXP domain covering essential customer experience principles. Study the key topics and frameworks carefully.`
      cacheSet(ck, result)
      setOverview(result)
    } catch {
      setErr('overview', 'Failed to load overview')
    } finally {
      setLoad('overview', false)
    }
  }, [domain])

  const loadTopics = useCallback(async () => {
    const ck = cacheKey(domain, 'topics')
    const cached = cacheGet<TopicContent[]>(ck)
    if (cached) { setTopics(cached); return }
    setLoad('topics', true); setErr('topics', null)
    try {
      const topicList = DOMAIN_TOPICS[domain] ?? []
      const prompt = `You are a CCXP exam coach. Generate study content for ${topicList.length} topics in domain: "${domain}". Topics: ${topicList.join(', ')}

Respond ONLY with raw JSON array:
[{
  "topic": "Topic Name",
  "explanation": "150-word explanation",
  "example": "Real-world example, 2-3 sentences",
  "examTrap": "Common mistake on exam questions about this topic",
  "keyTerms": [{"term": "...","definition": "one sentence"}]
}]
No markdown, no preamble. Raw JSON array only.`
      const result = await llmJson<TopicContent[]>(prompt, [])
      const final = result.length > 0 ? result : topicList.map(t => ({
        topic: t,
        explanation: `${t} is a key concept in ${domain}. Study the core principles and how they apply to customer experience management.`,
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
  }, [domain])

  const loadFlashcards = useCallback(async () => {
    const ck = cacheKey(domain, 'flashcards')
    const cached = cacheGet<Flashcard[]>(ck)
    if (cached) { setFlashcards(cached); return }
    setLoad('flashcards', true); setErr('flashcards', null)
    try {
      const prompt = `Generate 10 flashcards for CCXP domain: "${domain}".
Mix: 4 key terms, 3 scenario-based, 3 framework recall.

Respond ONLY with raw JSON array:
[{"front":"max 20 words","back":"max 40 words","why":"one sentence"}]
No markdown. Raw JSON only.`
      const result = await llmJson<Flashcard[]>(prompt, [])
      const final = result.length > 0 ? result : [
        { front: `What is the primary goal of ${domain}?`, back: 'To improve customer experiences by applying systematic approaches and frameworks.', why: 'Foundation concept for this domain.' },
        { front: 'Name a key framework in this domain', back: 'Multiple frameworks exist; focus on the ones most tested in CCXP exams.', why: 'Framework recall is heavily tested.' },
      ]
      cacheSet(ck, final)
      setFlashcards(final)
    } catch {
      setErr('flashcards', 'Failed to load flashcards')
    } finally {
      setLoad('flashcards', false)
    }
  }, [domain])

  const loadQuiz = useCallback(async () => {
    const ck = cacheKey(domain, 'quiz')
    const cached = cacheGet<QuizQuestion[]>(ck)
    if (cached) { setQuiz(cached); return }
    setLoad('quiz', true); setErr('quiz', null)
    try {
      const prompt = `Generate 5 practice questions for CCXP domain: "${domain}".
Explanations should be educational (2-3 sentences).

Respond ONLY with raw JSON array:
[{"q":"...","a":"...","b":"...","c":"...","d":"...","correct":"b","explanation":"2-3 sentence educational explanation"}]
No markdown. Raw JSON only.`
      const result = await llmJson<QuizQuestion[]>(prompt, [])
      const final = result.length > 0 ? result : [{
        q: `Which approach best represents ${domain}?`,
        a: 'Reactive problem solving only',
        b: 'Proactive customer-centric strategy',
        c: 'Cost reduction focus',
        d: 'Technology-first implementation',
        correct: 'b',
        explanation: `${domain} requires a proactive, strategic approach. Customer-centricity must be embedded in all decisions and processes.`,
      }]
      cacheSet(ck, final)
      setQuiz(final)
    } catch {
      setErr('quiz', 'Failed to load quiz')
    } finally {
      setLoad('quiz', false)
    }
  }, [domain])

  return { overview, topics, flashcards, quiz, loading, error, loadOverview, loadTopics, loadFlashcards, loadQuiz }
}
