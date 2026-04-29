const WORKER_URL = import.meta.env.VITE_WORKER_URL

export function startGithubLogin() {
  window.location.href = `${WORKER_URL}/auth/github/login`
}

export function getStoredToken(): string | null {
  return localStorage.getItem('ccxp_jwt')
}

export function storeToken(token: string) {
  localStorage.setItem('ccxp_jwt', token)
}

export function clearToken() {
  localStorage.removeItem('ccxp_jwt')
}

export function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

export function isTokenValid(token: string): boolean {
  const payload = parseJwt(token)
  if (!payload) return false
  const exp = payload.exp as number
  return exp * 1000 > Date.now()
}
