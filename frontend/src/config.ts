// Central place to read environment configuration for auth endpoints.
type RuntimeConfig = {
  AUTH_BASE_URL?: string
  VITE_AUTH_BASE_URL?: string
}

const appConfig =
  typeof window === 'undefined'
    ? undefined
    : (window as { __APP_CONFIG__?: RuntimeConfig }).__APP_CONFIG__
const runtimeAuthBase =
  appConfig?.AUTH_BASE_URL?.trim() || appConfig?.VITE_AUTH_BASE_URL?.trim() || ''

const rawAuthBase = (import.meta.env.VITE_AUTH_BASE_URL ?? '').trim()
const defaultAuthBase = import.meta.env.DEV ? '' : '/api/ums'
export const AUTH_BASE_URL = runtimeAuthBase || rawAuthBase || defaultAuthBase

export const getAuthUrl = (path: string) => {
  if (!AUTH_BASE_URL) return ''

  const normalizedBase = AUTH_BASE_URL.endsWith('/')
    ? AUTH_BASE_URL.slice(0, -1)
    : AUTH_BASE_URL
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return `${normalizedBase}${normalizedPath}`
}
