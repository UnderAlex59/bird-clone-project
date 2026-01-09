import { createContext, ReactNode, useContext, useMemo, useState } from 'react'
import { AuthPayload, AuthSession } from '../types/auth'
import { clearSession, loadSession, saveSession } from '../utils/authStorage'
import { login as loginRequest } from '../services/auth'
import { Role, ROLES } from '../constants/roles'

type AuthContextValue = {
  session: AuthSession | null
  roles: Role[]
  isAuthenticated: boolean
  isAdmin: boolean
  hasRole: (role: Role) => boolean
  canAccess: (...allowedRoles: Role[]) => boolean
  login: (url: string, payload: AuthPayload) => Promise<AuthSession>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(() => loadSession())

  const login = async (url: string, payload: AuthPayload) => {
    const nextSession = await loginRequest(url, payload)
    saveSession(nextSession, payload.rememberMe)
    setSession(nextSession)
    return nextSession
  }

  const logout = () => {
    clearSession()
    setSession(null)
  }

  const roles = session?.user?.roles ?? []
  const isAdmin = roles.includes(ROLES.ADMIN)
  const hasRole = (role: Role) => roles.includes(role)
  const canAccess = (...allowedRoles: Role[]) => allowedRoles.some((role) => roles.includes(role))

  const value = useMemo(
    () => ({
      session,
      roles,
      isAuthenticated: !!session,
      isAdmin,
      hasRole,
      canAccess,
      login,
      logout,
    }),
    [session, roles, isAdmin],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
