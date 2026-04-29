import { create } from 'zustand'
import type { ExamAttempt, DomainScore, WrongQuestion } from '../types/history'

const STORAGE_KEY = 'ccxp_exam_history'
const MAX_ATTEMPTS = 50

function load(): ExamAttempt[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function save(attempts: ExamAttempt[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts))
}

interface HistoryState {
  attempts: ExamAttempt[]
  addAttempt: (attempt: ExamAttempt) => void
  setAiAnalysis: (id: string, analysis: string) => void
  clearHistory: () => void
  getBestScore: (mode?: string) => number | null
  getLatestScore: (mode?: string) => number | null
  getAverageScore: (mode?: string) => number | null
  getTrend: (mode?: string) => ExamAttempt[]
  getDomainTrend: (domain: string) => { date: string; pct: number }[]
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  attempts: load(),

  addAttempt(attempt) {
    set(state => {
      const attempts = [attempt, ...state.attempts].slice(0, MAX_ATTEMPTS)
      save(attempts)
      return { attempts }
    })
  },

  setAiAnalysis(id, analysis) {
    set(state => {
      const attempts = state.attempts.map(a => a.id === id ? { ...a, aiAnalysis: analysis } : a)
      save(attempts)
      return { attempts }
    })
  },

  clearHistory() {
    localStorage.removeItem(STORAGE_KEY)
    set({ attempts: [] })
  },

  getBestScore(mode) {
    const attempts = get().attempts.filter(a => !mode || a.mode === mode)
    if (!attempts.length) return null
    return Math.max(...attempts.map(a => a.pct))
  },

  getLatestScore(mode) {
    const attempts = get().attempts.filter(a => !mode || a.mode === mode)
    return attempts[0]?.pct ?? null
  },

  getAverageScore(mode) {
    const attempts = get().attempts.filter(a => !mode || a.mode === mode)
    if (!attempts.length) return null
    return Math.round(attempts.reduce((s, a) => s + a.pct, 0) / attempts.length)
  },

  getTrend(mode) {
    return get().attempts
      .filter(a => !mode || a.mode === mode)
      .slice(0, 10)
      .reverse()
  },

  getDomainTrend(domain) {
    return get().attempts
      .filter(a => a.domainScores.some(d => d.domain === domain))
      .slice(0, 10)
      .reverse()
      .map(a => {
        const ds = a.domainScores.find(d => d.domain === domain)
        return { date: a.date, pct: ds?.pct ?? 0 }
      })
  },
}))

export function buildDomainScores(
  questions: { id: string; domain: string; correct: string }[],
  answers: Record<string, string>
): DomainScore[] {
  const domains = [...new Set(questions.map(q => q.domain))]
  return domains.map(domain => {
    const qs = questions.filter(q => q.domain === domain)
    const correct = qs.filter(q => answers[q.id] === q.correct).length
    return { domain, correct, total: qs.length, pct: Math.round((correct / qs.length) * 100) }
  })
}

export type { WrongQuestion }
