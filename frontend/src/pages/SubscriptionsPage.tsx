import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../components/AppShell'
import { ROLES } from '../constants/roles'
import { useAuth } from '../providers/AuthProvider'
import { useAuthFetch } from '../hooks/useAuthFetch'
import { classNames } from '../utils/classNames'

type ApiResponse<T> = {
  code?: string
  message?: string
  data?: T
}

type SubscriptionData = {
  subscriber?: string
  producers?: string[]
}

type UmsRole = {
  role: string
}

type UmsUser = {
  id: string
  name: string
  email: string
  roles?: Array<UmsRole | string>
}

const shortId = (value: string) => (value.length > 8 ? `${value.slice(0, 8)}...` : value)

const hasRole = (roles: UmsUser['roles'], role: string) =>
  (roles ?? []).some((entry) => (typeof entry === 'string' ? entry : entry.role) === role)

const inputClass =
  'mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200'
const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] transition disabled:cursor-not-allowed disabled:opacity-60'
const buttonPrimary = classNames(buttonBase, 'bg-slate-900 text-white hover:bg-slate-800')
const buttonGhost = classNames(
  buttonBase,
  'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
)

const SubscriptionsPage = () => {
  const { session, canAccess } = useAuth()
  const authFetch = useAuthFetch()
  const token = session?.token ?? ''
  const userId = session?.user.id ?? ''
  const canManageSubscriptions = canAccess(ROLES.SUBSCRIBER)

  const [subscriptions, setSubscriptions] = useState<string[]>([])
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const [subscriptionError, setSubscriptionError] = useState('')

  const [directory, setDirectory] = useState<UmsUser[]>([])
  const [directoryLoading, setDirectoryLoading] = useState(false)
  const [directoryError, setDirectoryError] = useState('')

  const [manualId, setManualId] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const loadSubscriptions = async () => {
    if (!userId || !canManageSubscriptions) return
    setSubscriptionLoading(true)
    setSubscriptionError('')
    try {
      const res = await authFetch(`/api/twitter/subscriptions/subscriber/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      const payload = (await res.json().catch(() => null)) as ApiResponse<SubscriptionData> | null
      const producers = payload?.data?.producers ?? []
      setSubscriptions(Array.isArray(producers) ? producers : [])
    } catch (error) {
      setSubscriptionError(error instanceof Error ? error.message : 'Не удалось загрузить подписки.')
    } finally {
      setSubscriptionLoading(false)
    }
  }

  const loadDirectory = async () => {
    if (!token) return
    setDirectoryLoading(true)
    setDirectoryError('')
    try {
      const res = await authFetch('/api/ums/users', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = (await res.json().catch(() => null)) as ApiResponse<UmsUser[]> | null
      const users = Array.isArray(payload?.data) ? payload?.data : []
      setDirectory(users)
    } catch (error) {
      setDirectoryError(error instanceof Error ? error.message : 'Не удалось загрузить авторов.')
    } finally {
      setDirectoryLoading(false)
    }
  }

  useEffect(() => {
    void loadSubscriptions()
  }, [userId, token, canManageSubscriptions])

  useEffect(() => {
    void loadDirectory()
  }, [token])

  const refreshAll = () => {
    void loadSubscriptions()
    void loadDirectory()
  }

  const directoryMap = useMemo(
    () => new Map(directory.map((user) => [user.id, user])),
    [directory],
  )
  const producerDirectory = useMemo(
    () => directory.filter((user) => hasRole(user.roles, ROLES.PRODUCER)),
    [directory],
  )
  const followedSet = useMemo(() => new Set(subscriptions), [subscriptions])
  const suggestedCreators = useMemo(
    () =>
      producerDirectory.filter((user) => user.id !== userId && !followedSet.has(user.id)),
    [producerDirectory, followedSet, userId],
  )

  const persistSubscriptions = async (next: string[]) => {
    if (!userId || !canManageSubscriptions) return
    setSaving(true)
    setSaveError('')
    try {
      const uniqueNext = Array.from(new Set(next))
      const res = await authFetch('/api/twitter/subscriptions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ subscriber: userId, producers: uniqueNext }),
      })
      const payload = (await res.json().catch(() => null)) as ApiResponse<boolean> | null
      const code = payload?.code ?? ''
      if (code !== '200' && code !== '201') {
        throw new Error(payload?.message || 'Не удалось обновить подписки.')
      }
      setSubscriptions(uniqueNext)
      setManualId('')
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Не удалось обновить подписки.')
    } finally {
      setSaving(false)
    }
  }

  const addSubscription = (producerId: string) => {
    if (!producerId || followedSet.has(producerId)) return
    void persistSubscriptions([...subscriptions, producerId])
  }

  const removeSubscription = (producerId: string) => {
    if (!producerId || !followedSet.has(producerId)) return
    void persistSubscriptions(subscriptions.filter((id) => id !== producerId))
  }

  const addManualSubscription = () => {
    const trimmed = manualId.trim()
    if (!trimmed || followedSet.has(trimmed)) return
    void persistSubscriptions([...subscriptions, trimmed])
  }

  return (
    <AppShell>
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="animate-rise">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Подписки</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
            Соберите круг авторов
          </h1>
          <p className="mt-3 max-w-xl text-sm text-slate-600">
            Подписывайтесь на авторов, чьи сообщения вы хотите видеть в ленте.
          </p>
        </div>
        <div className="animate-rise" style={{ animationDelay: '0.08s' }}>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/messages"
              className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-700 transition hover:border-slate-300 sm:w-auto"
            >
              Сообщения
            </Link>
            <button type="button" className={classNames(buttonGhost, 'w-full sm:w-auto')} onClick={refreshAll}>
              Обновить
            </button>
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <section className="surface-card animate-rise p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Обзор</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">Ваши подписки</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Балансируйте ленту между привычными авторами и новыми именами.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-center text-xs text-slate-500">
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-lg font-semibold text-slate-900">{subscriptions.length}</p>
                  <p className="mt-1 uppercase tracking-[0.2em]">Подписки</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-lg font-semibold text-slate-900">{suggestedCreators.length}</p>
                  <p className="mt-1 uppercase tracking-[0.2em]">Рекомендации</p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400" htmlFor="manual-id">
                Добавить по ID автора
              </label>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  id="manual-id"
                  value={manualId}
                  onChange={(event) => setManualId(event.target.value)}
                  placeholder="Вставьте ID автора"
                  className={classNames(inputClass, 'sm:flex-1')}
                  disabled={!canManageSubscriptions || saving}
                />
                <button
                  type="button"
                  className={classNames(buttonPrimary, 'w-full sm:w-auto')}
                  disabled={!canManageSubscriptions || saving || !manualId.trim()}
                  onClick={addManualSubscription}
                >
                  Подписаться
                </button>
              </div>
            </div>

            {saveError ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {saveError}
              </div>
            ) : null}
            {!canManageSubscriptions ? (
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-400">
                Нужна роль SUBSCRIBER
              </p>
            ) : null}
          </section>

          <section className="surface-card animate-rise p-6" style={{ animationDelay: '0.08s' }}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Подписки</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">Текущие авторы</h2>
              </div>
              <button type="button" className={classNames(buttonGhost, 'w-full sm:w-auto')} onClick={loadSubscriptions}>
                Синхронизировать
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {subscriptionLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                  Загрузка подписок...
                </div>
              ) : null}
              {subscriptionError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {subscriptionError}
                </div>
              ) : null}
              {!subscriptionLoading && subscriptions.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
                  Вы пока ни на кого не подписаны. Начните с рекомендаций справа.
                </div>
              ) : null}
              {subscriptions.map((producerId) => {
                const producer = directoryMap.get(producerId)
                return (
                  <article
                    key={producerId}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {producer?.name ?? `Автор ${shortId(producerId)}`}
                        </p>
                        <p className="text-xs text-slate-500 break-all">
                          {producer?.email ?? 'Профиль недоступен'}
                        </p>
                        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                          ID {shortId(producerId)}
                        </p>
                      </div>
                      <button
                        type="button"
                        className={classNames(buttonGhost, 'w-full sm:w-auto')}
                        disabled={!canManageSubscriptions || saving}
                        onClick={() => removeSubscription(producerId)}
                      >
                        Отписаться
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="surface-card animate-rise p-6" style={{ animationDelay: '0.12s' }}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Рекомендации</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">Рекомендуемые авторы</h2>
              </div>
              <button type="button" className={classNames(buttonGhost, 'w-full sm:w-auto')} onClick={loadDirectory}>
                Обновить
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {directoryLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                  Загрузка авторов...
                </div>
              ) : null}
              {directoryError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {directoryError}
                </div>
              ) : null}
              {!directoryLoading && suggestedCreators.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
                  Сейчас нет новых авторов. Загляните позже.
                </div>
              ) : null}
              {suggestedCreators.map((creator) => (
                <article
                  key={creator.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{creator.name}</p>
                      <p className="text-xs text-slate-500 break-all">{creator.email}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                        ID {shortId(creator.id)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={classNames(buttonPrimary, 'w-full sm:w-auto')}
                      disabled={!canManageSubscriptions || saving}
                      onClick={() => addSubscription(creator.id)}
                    >
                      Подписаться
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="surface-card animate-rise p-6" style={{ animationDelay: '0.18s' }}>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Советы</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                Смешивайте быстрые новости и глубокие разборы, чтобы лента оставалась живой.
              </li>
              <li className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                Нажимайте «Обновить» после изменения списка подписок.
              </li>
              <li className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                Используйте ID авторов, если ведёте списки вне приложения.
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </AppShell>
  )
}

export default SubscriptionsPage
