import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { AuthProvider } from './providers/AuthProvider'
import { AuthSession } from './types/auth'
import { saveSession } from './utils/authStorage'
import './index.css'

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  return atob(padded)
}

const applyOAuthSession = () => {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  const encoded = url.searchParams.get('auth')
  if (!encoded) return

  try {
    const payload = decodeBase64Url(encoded)
    const session = JSON.parse(payload) as AuthSession
    if (session?.token && session?.user && session?.expiresAt) {
      saveSession(session, true)
    }
  } catch {
    // Ignore malformed payloads and keep the user on login.
  } finally {
    url.searchParams.delete('auth')
    window.history.replaceState({}, document.title, url.toString())
  }
}

applyOAuthSession()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
