import { create } from 'zustand'

export interface Question {
  id: string
  q: string
  a: string
  b: string
  c: string
  d: string
  correct: string
  explanation: string
  domain: string
}

export type ExamMode = 'full' | 'mini' | 'domain'

interface ExamState {
  mode: ExamMode | null
  selectedDomain: string | null
  questions: Question[]
  answers: Record<string, string>
  currentIndex: number
  submitted: boolean
  isLoading: boolean
  loadingMessage: string
  error: string | null
  setMode: (mode: ExamMode, domain?: string) => void
  setQuestions: (questions: Question[]) => void
  answerQuestion: (id: string, answer: string) => void
  navigateTo: (index: number) => void
  submitExam: () => void
  resetExam: () => void
  setLoading: (loading: boolean, message?: string) => void
  setError: (error: string | null) => void
}

export const useExamStore = create<ExamState>((set) => ({
  mode: null,
  selectedDomain: null,
  questions: [],
  answers: {},
  currentIndex: 0,
  submitted: false,
  isLoading: false,
  loadingMessage: 'Generating questions…',
  error: null,

  setMode(mode, domain) {
    set({ mode, selectedDomain: domain ?? null, questions: [], answers: {}, currentIndex: 0, submitted: false })
  },

  setQuestions(questions) {
    set({ questions })
  },

  answerQuestion(id, answer) {
    set(state => ({ answers: { ...state.answers, [id]: answer } }))
  },

  navigateTo(index) {
    set({ currentIndex: index })
  },

  submitExam() {
    set({ submitted: true })
    sessionStorage.removeItem('ccxp_exam_session')
  },

  resetExam() {
    set({ mode: null, selectedDomain: null, questions: [], answers: {}, currentIndex: 0, submitted: false, error: null })
    sessionStorage.removeItem('ccxp_exam_session')
  },

  setLoading(loading, message = 'Generating questions…') {
    set({ isLoading: loading, loadingMessage: message })
  },

  setError(error) {
    set({ error })
  },
}))

export const DOMAIN_WEIGHTS: Record<ExamMode, Record<string, number>> = {
  full: {
    'CX Strategy': 20,
    'Customer-Centric Culture': 17,
    'Voice of Customer': 20,
    'Experience Design': 18,
    'Metrics & Measurement': 15,
    'Organizational Adoption': 10,
  },
  mini: {
    'CX Strategy': 4,
    'Customer-Centric Culture': 3,
    'Voice of Customer': 4,
    'Experience Design': 4,
    'Metrics & Measurement': 3,
    'Organizational Adoption': 2,
  },
  domain: {
    'CX Strategy': 10,
    'Customer-Centric Culture': 10,
    'Voice of Customer': 10,
    'Experience Design': 10,
    'Metrics & Measurement': 10,
    'Organizational Adoption': 10,
  },
}

export const EXAM_DURATIONS: Record<ExamMode, number> = {
  full: 3 * 60 * 60,
  mini: 60 * 60,
  domain: 30 * 60,
}

export const DOMAINS = [
  'CX Strategy',
  'Customer-Centric Culture',
  'Voice of Customer',
  'Experience Design',
  'Metrics & Measurement',
  'Organizational Adoption',
]

export const DOMAIN_COLORS: Record<string, string> = {
  'CX Strategy':              '#4A9EDB',
  'Customer-Centric Culture': '#E8904A',
  'Voice of Customer':        '#7BC67A',
  'Experience Design':        '#C97AC9',
  'Metrics & Measurement':    '#E8C94A',
  'Organizational Adoption':  '#7AC9C9',
}
