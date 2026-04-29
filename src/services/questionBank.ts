import type { Question } from '../store/examStore'

export interface SavedQuestionSet {
  id: string
  createdAt: string
  mode: 'full' | 'mini' | 'domain'
  label: string
  domains: string[]
  questions: Question[]
  totalCount: number
  timesUsed: number
  lastUsed: string | null
}

const STORAGE_KEY = 'ccxp_question_bank'
const MAX_SETS = 10

function loadSets(): SavedQuestionSet[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveSets(sets: SavedQuestionSet[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sets))
}

export const questionBank = {
  save(questions: Question[], mode: string, domains: string[]): SavedQuestionSet {
    const sets = loadSets()
    const now = new Date()
    const modeLabel = mode === 'full' ? 'Full Exam' : mode === 'mini' ? 'Mini Drill' : 'Domain Drill'
    const dateLabel = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    const newSet: SavedQuestionSet = {
      id: crypto.randomUUID(),
      createdAt: now.toISOString(),
      mode: mode as SavedQuestionSet['mode'],
      label: `${modeLabel} — ${dateLabel}`,
      domains,
      questions,
      totalCount: questions.length,
      timesUsed: 0,
      lastUsed: null,
    }
    const updated = [newSet, ...sets].slice(0, MAX_SETS)
    saveSets(updated)
    return newSet
  },

  getAll(): SavedQuestionSet[] {
    return loadSets()
  },

  get(id: string): SavedQuestionSet | null {
    return loadSets().find(s => s.id === id) ?? null
  },

  markUsed(id: string): void {
    const sets = loadSets()
    saveSets(sets.map(s =>
      s.id === id ? { ...s, timesUsed: s.timesUsed + 1, lastUsed: new Date().toISOString() } : s
    ))
  },

  delete(id: string): void {
    saveSets(loadSets().filter(s => s.id !== id))
  },

  hasAny(): boolean {
    return loadSets().length > 0
  },

  getLatest(mode?: string): SavedQuestionSet | null {
    const sets = loadSets()
    if (mode) return sets.find(s => s.mode === mode) ?? null
    return sets[0] ?? null
  },
}
