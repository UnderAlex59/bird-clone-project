import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'

type GuardProps = {
  children: ReactNode
}

export const RequireAuth = ({ children }: GuardProps) => {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}

export const RequireAdmin = ({ children }: GuardProps) => {
  const { isAuthenticated, isAdmin } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (!isAdmin) {
    return <Navigate to="/forbidden" replace />
  }

  return <>{children}</>
}
