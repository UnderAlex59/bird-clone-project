import { AuthSession } from '../types/auth'

const STORAGE_KEY = 'bird.auth.session'

const isExpired = (session: AuthSession) =>
  !session.expiresAt || session.expiresAt * 1000 <= Date.now()

export const loadSession = () => {
  const raw = sessionStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const session = JSON.parse(raw) as AuthSession
    if (!session?.token || !session?.user || isExpired(session)) {
      clearSession()
      return null
    }
    return session
  } catch {
    clearSession()
    return null
  }
}

export const saveSession = (session: AuthSession, remember: boolean) => {
  const target = remember ? localStorage : sessionStorage
  const fallback = remember ? sessionStorage : localStorage
  target.setItem(STORAGE_KEY, JSON.stringify(session))
  fallback.removeItem(STORAGE_KEY)
}

export const clearSession = () => {
  sessionStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(STORAGE_KEY)
}
