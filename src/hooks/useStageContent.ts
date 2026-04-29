import { useState, useCallback } from 'react'
import { contentCache } from '../services/contentCache'
import { useAuthStore } from '../store/authStore'
import { DOMAIN_TOPICS, toTopicSlug } from '../utils/domainUtils'

type Stage = 'stage1-summary' | 'stage2-concepts' | 'stage3-deepdive' | 'stage4-quiz'

interface Options {
  topic?: string
  topics?: string[]
}

// Returns { data, loading, error, load } — caller controls WHEN to call load()
// This avoids the enabled-flag re-trigger bug where changing enabled doesn't
// re-run the effect because load() reference doesn't change.
export function useStageContent<T>(domain: string, stage: Stage, options?: Options) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const token = useAuthStore(s => s.token)

  const cacheKey = stage === 'stage3-deepdive' && options?.topic
    ? `ccxp_${domain}_stage3_${toTopicSlug(options.topic)}`
    : `ccxp_${domain}_${stage}`

  const load = useCallback(async () => {
    // Return immediately if already loading or already have data
    if (loading) return

    const cached = contentCache.get<T>(cacheKey)
    if (cached) {
      setData(cached)
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (!token) throw new Error('Not authenticated')
      const workerUrl = import.meta.env.VITE_WORKER_URL as string

      const requestBody: Record<string, unknown> = { type: stage, domain }
      if (stage === 'stage2-concepts') {
        requestBody.topics = options?.topics ?? DOMAIN_TOPICS[domain] ?? []
      }
      if (stage === 'stage3-deepdive') {
        requestBody.topic = options?.topic
      }

      const res = await fetch(`${workerUrl}/api/llm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(requestBody),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Worker error ${res.status}: ${text}`)
      }

      const result = await res.json() as { data?: T; error?: string }
      if (result.error) throw new Error(result.error)
      const content = result.data ?? (result as unknown as T)

      contentCache.set(cacheKey, content, domain, stage)
      setData(content)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load'
      console.error(`[useStageContent] ${domain} ${stage}:`, msg)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [domain, stage, options?.topic, token, cacheKey])

  return { data, loading, error, load }
}
