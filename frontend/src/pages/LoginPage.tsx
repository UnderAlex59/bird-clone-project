import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getAuthUrl } from '../config'
import GradientBackdrop from '../components/GradientBackdrop'
import LoginForm from '../components/LoginForm'
import MessageBanner from '../components/MessageBanner'
import OAuthButtons from '../components/OAuthButtons'
import { ROLES } from '../constants/roles'
import { useAuth } from '../providers/AuthProvider'
import { AuthPayload } from '../types/auth'

type LocationState = {
  from?: string
  message?: string
}

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const { login, isAdmin, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state as LocationState | null

  const loginUrl = useMemo(() => getAuthUrl('/auth/login'), [])

  useEffect(() => {
    if (locationState?.message) {
      setMessage(locationState.message)
    }
  }, [locationState?.message])

  useEffect(() => {
    if (isAuthenticated) {
      navigate(isAdmin ? '/admin' : '/console', { replace: true })
    }
  }, [isAdmin, isAuthenticated, navigate])

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!loginUrl) {
      setMessage('Не задан VITE_AUTH_BASE_URL. Укажите адрес сервиса авторизации.')
      return
    }

    setLoading(true)
    setMessage('')

    const payload: AuthPayload = { email, password, rememberMe }

    try {
      const session = await login(loginUrl, payload)
      const fallback = session.user.roles.includes(ROLES.ADMIN) ? '/admin' : '/console'
      navigate(locationState?.from ?? fallback, { replace: true })
    } catch (error) {
      const text =
        error instanceof Error
          ? error.message
          : 'Ошибка авторизации. Проверьте данные и попробуйте снова.'
      setMessage(text)
    } finally {
      setLoading(false)
    }
  }

  const redirectSocial = (path: string) => {
    const target = getAuthUrl(path)

    if (!target) {
      setMessage('Не задан VITE_AUTH_BASE_URL. Укажите адрес сервиса авторизации.')
      return
    }

    window.location.href = target
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[color:var(--page-bg)]">
      <div className="absolute inset-0 grid-wash opacity-50" aria-hidden="true" />
      <GradientBackdrop />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-12 lg:flex-row lg:items-center">
        <section className="surface-card animate-rise flex-1 p-8 sm:p-10">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Bird</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
            Добро пожаловать в Bird
          </h1>
          <p className="mt-4 text-sm text-slate-600">
            Войдите, чтобы управлять лентой, подписками и публиковать сообщения.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Вход</p>
              <p className="mt-2 text-sm text-slate-700">
                Используйте адрес электронной почты и пароль из UMS или вход через GitHub OAuth.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Сообщения</p>
              <p className="mt-2 text-sm text-slate-700">
                Публикуйте короткие обновления и следите за авторами.
              </p>
            </div>
          </div>
        </section>

        <section
          className="surface-card animate-rise w-full p-8 sm:p-10 lg:w-[42%]"
          style={{ animationDelay: '0.08s' }}
        >
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Аккаунт</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Войдите в систему</h2>
          <p className="mt-2 text-sm text-slate-600">
            Введите адрес электронной почты и пароль или продолжите через GitHub.
          </p>

          <div className="mt-6">
            <LoginForm
              email={email}
              password={password}
              rememberMe={rememberMe}
              loading={loading}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onRememberChange={setRememberMe}
              onSubmit={submitLogin}
            />
          </div>

          <OAuthButtons onRedirect={redirectSocial} />

          <MessageBanner className="mt-6" message={message} />
        </section>
      </div>
    </div>
  )
}

export default LoginPage
