import { create } from 'zustand'
import { getStoredToken, storeToken, clearToken, parseJwt, isTokenValid } from '../services/auth'

interface AuthUser {
  login: string
  avatar: string
  name: string
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  init: () => void
  setToken: (token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  init() {
    const token = getStoredToken()
    if (token && isTokenValid(token)) {
      const payload = parseJwt(token) as { login: string; avatar: string; name: string } | null
      if (payload) {
        set({ token, user: { login: payload.login, avatar: payload.avatar, name: payload.name }, isLoading: false })
        return
      }
    }
    clearToken()
    set({ isLoading: false })
  },

  setToken(token: string) {
    storeToken(token)
    const payload = parseJwt(token) as { login: string; avatar: string; name: string } | null
    if (payload) {
      set({ token, user: { login: payload.login, avatar: payload.avatar, name: payload.name } })
    }
  },

  logout() {
    clearToken()
    set({ user: null, token: null })
  },
}))
