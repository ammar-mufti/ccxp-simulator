import { create } from 'zustand'

export interface TutorMessage {
  role: 'user' | 'assistant'
  content: string
}

interface TutorState {
  messages: TutorMessage[]
  isOpen: boolean
  isLoading: boolean
  pageContext: string
  addMessage: (role: TutorMessage['role'], content: string) => void
  setOpen: (open: boolean) => void
  setLoading: (loading: boolean) => void
  setPageContext: (context: string) => void
  clearHistory: () => void
}

function loadMessages(): TutorMessage[] {
  try {
    return JSON.parse(sessionStorage.getItem('ccxp_tutor_history') ?? '[]')
  } catch {
    return []
  }
}

export const useTutorStore = create<TutorState>((set, get) => ({
  messages: loadMessages(),
  isOpen: false,
  isLoading: false,
  pageContext: 'General study session',

  addMessage(role, content) {
    set(state => {
      const messages = [...state.messages, { role, content }]
      sessionStorage.setItem('ccxp_tutor_history', JSON.stringify(messages))
      return { messages }
    })
  },

  setOpen(open) {
    set({ isOpen: open })
  },

  setLoading(loading) {
    set({ isLoading: loading })
  },

  setPageContext(context) {
    if (context !== get().pageContext) set({ pageContext: context })
  },

  clearHistory() {
    sessionStorage.removeItem('ccxp_tutor_history')
    set({ messages: [] })
  },
}))
