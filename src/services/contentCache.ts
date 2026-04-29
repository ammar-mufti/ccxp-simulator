const CACHE_VERSION = '2.0'

interface CacheEntry {
  data: unknown
  generatedAt: number
  version: string
  domain: string
  type: string
}

export const contentCache = {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      const entry: CacheEntry = JSON.parse(raw)
      if (entry.version !== CACHE_VERSION) {
        localStorage.removeItem(key)
        return null
      }
      return entry.data as T
    } catch {
      return null
    }
  },

  set(key: string, data: unknown, domain: string, type: string): void {
    try {
      const entry: CacheEntry = { data, generatedAt: Date.now(), version: CACHE_VERSION, domain, type }
      localStorage.setItem(key, JSON.stringify(entry))
    } catch {
      // localStorage full — evict oldest 3 stage entries
      const entries = Object.keys(localStorage)
        .filter(k => k.startsWith('ccxp_') && k.includes('stage'))
        .map(k => {
          try {
            const e = JSON.parse(localStorage.getItem(k) ?? '{}') as { generatedAt?: number }
            return { key: k, generatedAt: e.generatedAt ?? 0 }
          } catch {
            return { key: k, generatedAt: 0 }
          }
        })
        .sort((a, b) => a.generatedAt - b.generatedAt)
      entries.slice(0, 3).forEach(e => localStorage.removeItem(e.key))
      try {
        localStorage.setItem(key, JSON.stringify({ data, generatedAt: Date.now(), version: CACHE_VERSION, domain, type }))
      } catch { /* silent */ }
    }
  },

  hasContent(domain: string): boolean {
    return !!(localStorage.getItem(`ccxp_${domain}_stage1_summary`) && localStorage.getItem(`ccxp_${domain}_stage2_concepts`))
  },

  getGeneratedDate(domain: string): string | null {
    try {
      const raw = localStorage.getItem(`ccxp_${domain}_stage1_summary`)
      if (!raw) return null
      const entry = JSON.parse(raw) as CacheEntry
      return new Date(entry.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch {
      return null
    }
  },

  clearContent(): void {
    Object.keys(localStorage)
      .filter(k =>
        k.startsWith('ccxp_') &&
        k !== 'ccxp_exam_history' &&
        !k.startsWith('ccxp_progress_') &&
        k !== 'ccxp_exam_date' &&
        k !== 'ccxp_plan_checks' &&
        k !== 'ccxp_learn_progress'
      )
      .forEach(k => localStorage.removeItem(k))
  },

  clearDomain(domain: string): void {
    Object.keys(localStorage)
      .filter(k => k.startsWith(`ccxp_${domain}_`))
      .forEach(k => localStorage.removeItem(k))
  },
}

// Legacy compat — old hooks used these named exports
export function cacheGet<T>(key: string): T | null { return contentCache.get<T>(key) }
export function cacheSet(key: string, data: unknown): void { contentCache.set(key, data, '', '') }
export function cacheKey(domain: string, type: string): string {
  return `ccxp_${domain.replace(/\s+/g, '_').toLowerCase()}_${type}`
}
