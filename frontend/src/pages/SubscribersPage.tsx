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

type ProducerSubscribersData = {
  producer?: string
  subscribers?: string[]
}

type UmsUser = {
  id: string
  name: string
  email: string
}

const shortId = (value: string) => (value.length > 8 ? `${value.slice(0, 8)}...` : value)

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] transition disabled:cursor-not-allowed disabled:opacity-60'
const buttonGhost = classNames(
  buttonBase,
  'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
)

const SubscribersPage = () => {
  const { session, canAccess } = useAuth()
  const authFetch = useAuthFetch()
  const token = session?.token ?? ''
  const userId = session?.user.id ?? ''
  const canViewSubscribers = canAccess(ROLES.PRODUCER)

  const [subscribers, setSubscribers] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const [directory, setDirectory] = useState<UmsUser[]>([])
  const [directoryLoading, setDirectoryLoading] = useState(false)
  const [directoryError, setDirectoryError] = useState('')

  const loadSubscribers = async () => {
    if (!userId || !canViewSubscribers) return
    setLoading(true)
    setError('')
    try {
      const res = await authFetch(`/api/twitter/subscriptions/producer/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      const payload = (await res.json().catch(() => null)) as ApiResponse<ProducerSubscribersData> | null
      const data = payload?.data?.subscribers ?? []
      setSubscribers(Array.isArray(data) ? data : [])
      setLastUpdated(new Date())
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Не удалось загрузить подписчиков.')
    } finally {
      setLoading(false)
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
      setDirectoryError(error instanceof Error ? error.message : 'Не удалось загрузить пользователей.')
    } finally {
      setDirectoryLoading(false)
    }
  }

  useEffect(() => {
    void loadSubscribers()
  }, [userId, token, canViewSubscribers])

  useEffect(() => {
    void loadDirectory()
  }, [token])

  const profileMap = useMemo(() => new Map(directory.map((user) => [user.id, user])), [directory])
  const subscribersWithProfiles = useMemo(
    () => subscribers.map((id) => ({ id, profile: profileMap.get(id) })),
    [profileMap, subscribers],
  )
  const knownProfiles = subscribersWithProfiles.filter((entry) => entry.profile).length

  const refreshAll = () => {
    void loadSubscribers()
    void loadDirectory()
  }

  return (
    <AppShell>
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="animate-rise">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Подписчики</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
            Список аудитории
          </h1>
          <p className="mt-3 max-w-xl text-sm text-slate-600">
            Узнайте, кто подписан на вас, и отслеживайте активную аудиторию.
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
        <section className="space-y-6">
          <div className="surface-card animate-rise p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Обзор</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">Сводка аудитории</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Отслеживайте, сколько людей подписано на ваши обновления.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-center text-xs text-slate-500">
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-lg font-semibold text-slate-900">{subscribers.length}</p>
                  <p className="mt-1 uppercase tracking-[0.2em]">Подписчики</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-lg font-semibold text-slate-900">{knownProfiles}</p>
                  <p className="mt-1 uppercase tracking-[0.2em]">Профили</p>
                </div>
              </div>
            </div>
            {!canViewSubscribers ? (
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-400">
                Нужна роль PRODUCER
              </p>
            ) : null}
          </div>

          <div className="surface-card animate-rise p-6" style={{ animationDelay: '0.08s' }}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Подписчики</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">Люди, которые вас читают</h2>
              </div>
              <button type="button" className={classNames(buttonGhost, 'w-full sm:w-auto')} onClick={loadSubscribers}>
                Синхронизировать
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {loading ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                  Загрузка подписчиков...
                </div>
              ) : null}
              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}
              {!loading && subscribers.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
                  Пока у вас нет подписчиков.
                </div>
              ) : null}
              {subscribersWithProfiles.map((entry) => (
                <article key={entry.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {entry.profile?.name ?? `Подписчик ${shortId(entry.id)}`}
                      </p>
                      <p className="text-xs text-slate-500 break-all">
                        {entry.profile?.email ?? 'Профиль недоступен'}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                        ID {shortId(entry.id)}
                      </p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                      Подписчик
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="surface-card animate-rise p-6" style={{ animationDelay: '0.12s' }}>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Статус</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Последнее обновление</p>
                <p className="mt-1 text-sm text-slate-700">
                  {lastUpdated ? lastUpdated.toLocaleString() : 'Ещё нет'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Справочник</p>
                <p className="mt-1 text-sm text-slate-700">
                  {directoryLoading ? 'Синхронизация...' : `Профилей загружено: ${profileMap.size}`}
                </p>
              </div>
            </div>
            {directoryError ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {directoryError}
              </div>
            ) : null}
          </section>

          <section className="surface-card animate-rise p-6" style={{ animationDelay: '0.18s' }}>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Идеи</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                Публикуйте регулярно, чтобы подписчики оставались вовлечёнными.
              </li>
              <li className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                Используйте ID подписчиков для сегментации аудитории.
              </li>
              <li className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                Обновляйте список после появления новых подписчиков.
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </AppShell>
  )
}

export default SubscribersPage
