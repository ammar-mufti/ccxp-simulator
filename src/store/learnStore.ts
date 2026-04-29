import { create } from 'zustand'

export interface TopicContent {
  topic: string
  explanation: string
  example: string
  examTrap: string
  keyTerms: { term: string; definition: string }[]
}

export interface Flashcard {
  front: string
  back: string
  why: string
}

export interface QuizQuestion {
  q: string
  a: string
  b: string
  c: string
  d: string
  correct: string
  explanation: string
}

interface DomainProgress {
  topicsRead: string[]
  flashcardsKnown: number[]
  quizScore: number | null
}

interface LearnState {
  activeDomain: string | null
  activeTab: Record<string, number>
  progress: Record<string, DomainProgress>
  setActiveDomain: (domain: string) => void
  setActiveTab: (domain: string, tab: number) => void
  markTopicRead: (domain: string, topic: string) => void
  markFlashcardKnown: (domain: string, index: number) => void
  setQuizScore: (domain: string, score: number) => void
  getDomainProgress: (domain: string) => number
}

function loadProgress(): Record<string, DomainProgress> {
  try {
    return JSON.parse(localStorage.getItem('ccxp_learn_progress') ?? '{}')
  } catch {
    return {}
  }
}

function saveProgress(p: Record<string, DomainProgress>) {
  localStorage.setItem('ccxp_learn_progress', JSON.stringify(p))
}

export const useLearnStore = create<LearnState>((set, get) => ({
  activeDomain: null,
  activeTab: {},
  progress: loadProgress(),

  setActiveDomain(domain) {
    set({ activeDomain: domain })
  },

  setActiveTab(domain, tab) {
    set(state => ({ activeTab: { ...state.activeTab, [domain]: tab } }))
  },

  markTopicRead(domain, topic) {
    set(state => {
      const p = { ...state.progress }
      if (!p[domain]) p[domain] = { topicsRead: [], flashcardsKnown: [], quizScore: null }
      if (!p[domain].topicsRead.includes(topic)) {
        p[domain] = { ...p[domain], topicsRead: [...p[domain].topicsRead, topic] }
      }
      saveProgress(p)
      return { progress: p }
    })
  },

  markFlashcardKnown(domain, index) {
    set(state => {
      const p = { ...state.progress }
      if (!p[domain]) p[domain] = { topicsRead: [], flashcardsKnown: [], quizScore: null }
      const known = p[domain].flashcardsKnown
      if (!known.includes(index)) {
        p[domain] = { ...p[domain], flashcardsKnown: [...known, index] }
      }
      saveProgress(p)
      return { progress: p }
    })
  },

  setQuizScore(domain, score) {
    set(state => {
      const p = { ...state.progress }
      if (!p[domain]) p[domain] = { topicsRead: [], flashcardsKnown: [], quizScore: null }
      p[domain] = { ...p[domain], quizScore: score }
      saveProgress(p)
      return { progress: p }
    })
  },

  getDomainProgress(domain) {
    const p = get().progress[domain]
    if (!p) return 0
    const topicCount = DOMAIN_TOPICS[domain]?.length ?? 5
    const topicsScore = Math.min((p.topicsRead.length / topicCount) * 60, 60)
    const flashScore = Math.min((p.flashcardsKnown.length / 10) * 20, 20)
    const quizScore = p.quizScore !== null ? (p.quizScore / 5) * 20 : 0
    return Math.round(topicsScore + flashScore + quizScore)
  },
}))

export const DOMAIN_TOPICS: Record<string, string[]> = {
  'CX Strategy': [
    'CX Vision & Mission',
    'Business Case for CX',
    'CX Maturity Models',
    'CX Governance & Ownership',
    'CX Roadmap & Prioritization',
    'Aligning CX to Corporate Strategy',
  ],
  'Customer-Centric Culture': [
    'Culture Change Management',
    'Leadership Buy-in & Sponsorship',
    'Employee Engagement in CX',
    'CX Champions Network',
    'Embedding CX Behaviors',
  ],
  'Voice of Customer': [
    'VoC Program Design',
    'Listening Post Strategy',
    'Quantitative vs Qualitative Research',
    'Customer Journey Analytics',
    'Insight Generation & Storytelling',
    'Closing the Feedback Loop',
  ],
  'Experience Design': [
    'Customer Journey Mapping',
    'Service Design Principles',
    'Design Thinking Process',
    'Moments of Truth',
    'Prototyping & Testing',
    'Innovation in CX',
  ],
  'Metrics & Measurement': [
    'NPS CSAT CES Explained',
    'Linking CX to Business Outcomes',
    'Building a CX Dashboard',
    'Statistical Concepts for CX',
    'ROI Calculation Methods',
  ],
  'Organizational Adoption': [
    'Change Management for CX',
    'Cross-functional Alignment',
    'CX Roles & Responsibilities',
    'Governance Structures',
    'Sustaining CX Momentum',
  ],
}

export const DOMAIN_WEIGHTS_DISPLAY: Record<string, number> = {
  'CX Strategy': 20,
  'Customer-Centric Culture': 17,
  'Voice of Customer': 20,
  'Experience Design': 18,
  'Metrics & Measurement': 15,
  'Organizational Adoption': 10,
}
