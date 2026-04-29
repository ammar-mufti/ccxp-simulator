const TTL_MS = 24 * 60 * 60 * 1000

interface CacheEntry<T> {
  data: T
  ts: number
}

export function cacheGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const entry: CacheEntry<T> = JSON.parse(raw)
    if (Date.now() - entry.ts > TTL_MS) {
      localStorage.removeItem(key)
      return null
    }
    return entry.data
  } catch {
    return null
  }
}

export function cacheSet<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, ts: Date.now() }
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // storage full — ignore
  }
}

export function cacheKey(domain: string, type: string): string {
  return `ccxp_${domain.replace(/\s+/g, '_').toLowerCase()}_${type}`
}
