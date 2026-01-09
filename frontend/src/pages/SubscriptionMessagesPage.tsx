import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../components/AppShell'
import { ROLES } from '../constants/roles'
import { useAuth } from '../providers/AuthProvider'
import { useAuthFetch } from '../hooks/useAuthFetch'
import { classNames } from '../utils/classNames'

type FeedMessage = {
  id: string
  author: string
  content: string
  timestamp: number
}

type ApiResponse<T> = {
  code?: string
  message?: string
  data?: T
}

type UmsUser = {
  id: string
  name: string
  email: string
}

const shortId = (value: string) => (value.length > 8 ? `${value.slice(0, 8)}...` : value)

const inputClass =
  'mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200'
const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] transition disabled:cursor-not-allowed disabled:opacity-60'
const buttonGhost = classNames(
  buttonBase,
  'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
)

const SubscriptionMessagesPage = () => {
  const { session, canAccess } = useAuth()
  const authFetch = useAuthFetch()
  const token = session?.token ?? ''
  const userId = session?.user.id ?? ''
  const canViewFeed = canAccess(ROLES.SUBSCRIBER)

  const [feed, setFeed] = useState<FeedMessage[]>([])
  const [feedLoading, setFeedLoading] = useState(false)
  const [feedError, setFeedError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const [directory, setDirectory] = useState<UmsUser[]>([])
  const [directoryLoading, setDirectoryLoading] = useState(false)
  const [directoryError, setDirectoryError] = useState('')

  const [query, setQuery] = useState('')

  const loadFeed = async () => {
    if (!userId || !canViewFeed) return
    setFeedLoading(true)
    setFeedError('')
    try {
      const res = await authFetch(`/api/twitter/messages/subscriber/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      const payload = (await res.json().catch(() => null)) as ApiResponse<FeedMessage[]> | null
      const data = Array.isArray(payload?.data) ? payload?.data : []
      setFeed(data)
      setLastUpdated(new Date())
    } catch (error) {
      setFeedError(error instanceof Error ? error.message : 'Не удалось загрузить сообщения.')
    } finally {
      setFeedLoading(false)
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
    void loadFeed()
  }, [userId, token, canViewFeed])

  useEffect(() => {
    void loadDirectory()
  }, [token])

  const creatorMap = useMemo(() => new Map(directory.map((user) => [user.id, user])), [directory])

  const uniqueCreators = useMemo(
    () => new Set(feed.map((message) => message.author)).size,
    [feed],
  )

  const filteredFeed = useMemo(() => {
    const trimmed = query.trim().toLowerCase()
    if (!trimmed) return feed
    return feed.filter((message) => {
      const creatorName = creatorMap.get(message.author)?.name ?? ''
      return (
        message.content.toLowerCase().includes(trimmed) ||
        creatorName.toLowerCase().includes(trimmed) ||
        message.author.toLowerCase().includes(trimmed)
      )
    })
  }, [creatorMap, feed, query])

  return (
    <AppShell>
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="animate-rise">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Сообщения</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
            Обновления подписок
          </h1>
          <p className="mt-3 max-w-xl text-sm text-slate-600">
            Все сообщения от авторов, на которых вы подписаны, в одной ленте.
          </p>
        </div>
        <div className="animate-rise" style={{ animationDelay: '0.08s' }}>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/subscriptions"
              className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-700 transition hover:border-slate-300 sm:w-auto"
            >
              Подписки
            </Link>
            <button type="button" className={classNames(buttonGhost, 'w-full sm:w-auto')} onClick={loadFeed}>
              Обновить
            </button>
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div className="surface-card animate-rise p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Лента</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">Последние сообщения</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Используйте поиск по автору или ключевым словам.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-center text-xs text-slate-500">
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-lg font-semibold text-slate-900">{feed.length}</p>
                  <p className="mt-1 uppercase tracking-[0.2em]">Сообщения</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-lg font-semibold text-slate-900">{uniqueCreators}</p>
                  <p className="mt-1 uppercase tracking-[0.2em]">Авторы</p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400" htmlFor="search">
                Поиск по ленте
              </label>
              <input
                id="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Фильтр по автору или ключевому слову"
                className={inputClass}
                disabled={!canViewFeed}
              />
            </div>
            {!canViewFeed ? (
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-400">
                Нужна роль SUBSCRIBER
              </p>
            ) : null}
          </div>

          <div className="surface-card animate-rise p-6" style={{ animationDelay: '0.08s' }}>
            <div className="space-y-4">
              {feedLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                  Загрузка ленты...
                </div>
              ) : null}
              {feedError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {feedError}
                </div>
              ) : null}
              {!feedLoading && filteredFeed.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
                  Сообщения не найдены. Очистите фильтр или подпишитесь на авторов.
                </div>
              ) : null}
              {filteredFeed.map((message) => {
                const creator = creatorMap.get(message.author)
                return (
                  <article key={message.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="uppercase tracking-[0.2em]">
                        {creator?.name ?? `Пользователь ${shortId(message.author)}`}
                      </span>
                      <span>{new Date(message.timestamp * 1000).toLocaleString()}</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-700">{message.content}</p>
                    <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                      ID {shortId(message.id)}
                    </p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="surface-card animate-rise p-6" style={{ animationDelay: '0.12s' }}>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Сводка</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Последнее обновление</p>
                <p className="mt-1 text-sm text-slate-700">
                  {lastUpdated ? lastUpdated.toLocaleString() : 'Ещё нет'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Известные авторы</p>
                <p className="mt-1 text-sm text-slate-700">
                  {directoryLoading ? 'Синхронизация...' : creatorMap.size}
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
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Подсказки</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                Подписывайтесь на меньшее число авторов для более спокойной ленты.
              </li>
              <li className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                Используйте поиск, чтобы находить темы по авторам.
              </li>
              <li className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                Обновляйте ленту после изменения подписок.
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </AppShell>
  )
}

export default SubscriptionMessagesPage
