import { AuthApiResponse, AuthPayload, AuthSession } from '../types/auth'

const mapAuthError = (message: string | undefined, code: string | undefined, status: number) => {
  const normalized = (message ?? '').trim().toLowerCase()

  if (normalized.includes('invalid credentials') || code === '401' || status === 401) {
    return 'Неверный адрес электронной почты или пароль.'
  }
  if (normalized.includes('email and password')) {
    return 'Введите адрес электронной почты и пароль.'
  }
  if (normalized.includes('email already registered')) {
    return 'Адрес электронной почты уже зарегистрирован.'
  }
  if (normalized.includes('user not found')) {
    return 'Пользователь не найден.'
  }
  if (normalized.includes('unauthorized')) {
    return 'Требуется авторизация.'
  }
  if (status >= 500) {
    return 'Сервис авторизации временно недоступен. Попробуйте позже.'
  }

  return 'Ошибка авторизации. Проверьте введённые данные и попробуйте снова.'
}

const parseJson = (rawText: string) => {
  if (!rawText) return null
  try {
    return JSON.parse(rawText) as AuthApiResponse
  } catch {
    return null
  }
}

const isAuthSession = (value: AuthApiResponse['data']): value is AuthSession =>
  !!value &&
  typeof value === 'object' &&
  'token' in value &&
  'user' in value &&
  'expiresAt' in value

// Sends credentials to auth endpoint; throws if service responds with error.
export const login = async (url: string, payload: AuthPayload): Promise<AuthSession> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: payload.email, password: payload.password }),
  })

  const rawText = await response.text()
  const data = parseJson(rawText)

  if (!response.ok || !data || !isAuthSession(data.data)) {
    const message = mapAuthError(data?.message, data?.code, response.status)
    throw new Error(message)
  }

  return data.data
}
