import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'

const SESSION_EXPIRED_MESSAGE =
  'Сессия недействительна. Войдите снова.'

export const useAuthFetch = () => {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  return useCallback(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const response = await fetch(input, init)

      if (response.status === 401) {
        logout()
        navigate('/login', {
          replace: true,
          state: {
            from: location.pathname,
            message: SESSION_EXPIRED_MESSAGE,
          },
        })
      }

      return response
    },
    [logout, navigate, location.pathname],
  )
}
