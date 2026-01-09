import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../components/AppShell'
import { ROLES } from '../constants/roles'
import { useAuth } from '../providers/AuthProvider'
import { useAuthFetch } from '../hooks/useAuthFetch'

type FeedMessage = {
  id: string
  author: string
  content: string
  timestamp: number
}

type SubscriptionData = {
  subscriber: string
  producers: string[]
}

type ApiResponse<T> = {
  code?: string
  message?: string
  data?: T
}

const shortId = (value: string) => (value.length > 8 ? `${value.slice(0, 8)}...` : value)

const DashboardPage = () => {
  const { session, isAdmin, canAccess } = useAuth()
  const authFetch = useAuthFetch()
  const token = session?.token ?? ''
  const userId = session?.user.id ?? ''
  const canViewFeed = canAccess(ROLES.SUBSCRIBER)
  const canPublish = canAccess(ROLES.PRODUCER)
  const canManageSubscriptions = canAccess(ROLES.SUBSCRIBER)

  const [feed, setFeed] = useState<FeedMessage[]>([])
  const [feedLoading, setFeedLoading] = useState(false)
  const [feedError, setFeedError] = useState('')

  const [composeText, setComposeText] = useState('')
  const [composeBusy, setComposeBusy] = useState(false)
  const [composeError, setComposeError] = useState('')

  const [followingCount, setFollowingCount] = useState<number | null>(null)
  const [postCount, setPostCount] = useState<number | null>(null)

  const initials = useMemo(() => {
    const name = session?.user.name ?? ''
    const chunks = name
      .split(' ')
      .map((part) => part.trim())
      .filter(Boolean)
    if (!chunks.length) return 'U'
    const letters = chunks.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '')
    return letters.join('') || 'U'
  }, [session?.user.name])

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
    } catch (error) {
      setFeedError(error instanceof Error ? error.message : 'Не удалось загрузить ленту.')
    } finally {
      setFeedLoading(false)
    }
  }

  const loadFollowing = async () => {
    if (!userId || !canManageSubscriptions) return
    try {
      const res = await authFetch(`/api/twitter/subscriptions/subscriber/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      const payload = (await res.json().catch(() => null)) as ApiResponse<SubscriptionData> | null
      const producers = payload?.data?.producers ?? []
      setFollowingCount(Array.isArray(producers) ? producers.length : 0)
    } catch {
      setFollowingCount(0)
    }
  }

  const loadPosts = async () => {
    if (!userId || !canPublish) return
    try {
      const res = await authFetch(`/api/twitter/messages/producer/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      const payload = (await res.json().catch(() => null)) as ApiResponse<FeedMessage[]> | null
      const data = Array.isArray(payload?.data) ? payload?.data : []
      setPostCount(data.length)
    } catch {
      setPostCount(0)
    }
  }

  useEffect(() => {
    void loadFeed()
  }, [userId, token, canViewFeed])

  useEffect(() => {
    void loadFollowing()
  }, [userId, token, canManageSubscriptions])

  useEffect(() => {
    void loadPosts()
  }, [userId, token, canPublish])

  const publishMessage = async () => {
    if (!userId || !composeText.trim()) return
    setComposeBusy(true)
    setComposeError('')
    try {
      const res = await authFetch('/api/twitter/messages/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ author: userId, content: composeText.trim() }),
      })
      const payload = (await res.json().catch(() => null)) as ApiResponse<string> | null
      if (payload?.code !== '201') {
        throw new Error(payload?.message || 'Сообщение не создано.')
      }
      setComposeText('')
      await loadFeed()
      await loadPosts()
    } catch (error) {
      setComposeError(error instanceof Error ? error.message : 'Не удалось опубликовать сообщение.')
    } finally {
      setComposeBusy(false)
    }
  }

  return (
    <AppShell>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Bird Social</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Главная</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-600">
            Ваша лента, подписки и место для коротких публикаций.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/console"
            className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-700 transition hover:border-slate-300 sm:w-auto"
          >
            Консоль
          </Link>
          {isAdmin ? (
            <Link
              to="/admin"
              className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-slate-800 sm:w-auto"
            >
              Админ
            </Link>
          ) : null}
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_2fr_1fr]">
        <aside className="space-y-6">
          <section className="surface-card p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-lg font-semibold text-white">
                {initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{session?.user.name}</p>
                <p className="text-xs text-slate-500">{session?.user.email}</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-center text-xs text-slate-500 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white px-2 py-3">
                <p className="text-lg font-semibold text-slate-900">{followingCount ?? '—'}</p>
                <p className="mt-1 uppercase tracking-[0.2em]">Подписки</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-2 py-3">
                <p className="text-lg font-semibold text-slate-900">{postCount ?? '—'}</p>
                <p className="mt-1 uppercase tracking-[0.2em]">Публикации</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-2 py-3">
                <p className="text-lg font-semibold text-slate-900">
                  {session?.user.roles.length ?? 0}
                </p>
                <p className="mt-1 uppercase tracking-[0.2em]">Роли</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {session?.user.roles?.map((role) => (
                <span
                  key={role}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-600"
                >
                  {role}
                </span>
              ))}
            </div>
          </section>

          <section className="surface-card p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Быстрые ссылки</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <Link
                to="/console"
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300"
              >
                <span>Подписки и сообщения</span>
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Открыть</span>
              </Link>
              {canManageSubscriptions ? (
                <Link
                  to="/subscriptions"
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300"
                >
                  <span>Подписки</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Открыть</span>
                </Link>
              ) : null}
              {canViewFeed ? (
                <Link
                  to="/messages"
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300"
                >
                  <span>Сообщения подписок</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Открыть</span>
                </Link>
              ) : null}
              {canPublish ? (
                <Link
                  to="/subscribers"
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300"
                >
                  <span>Ваши подписчики</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Открыть</span>
                </Link>
              ) : null}
              {isAdmin ? (
                <Link
                  to="/admin"
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300"
                >
                  <span>Админ-панель</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Открыть</span>
                </Link>
              ) : null}
            </div>
          </section>
        </aside>

        <section className="space-y-6">
          <div className="surface-card p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--accent)] text-sm font-semibold text-white">
                {initials}
              </div>
              <div className="flex-1">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-400">Новая запись</label>
                <textarea
                  value={composeText}
                  onChange={(event) => setComposeText(event.target.value)}
                  placeholder="Поделитесь новостью с вашей аудиторией..."
                  rows={3}
                  disabled={!canPublish}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void publishMessage()}
                    disabled={!canPublish || composeBusy || !composeText.trim()}
                    className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {composeBusy ? 'Публикую...' : 'Опубликовать'}
                  </button>
                  {!canPublish ? (
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Нужна роль PRODUCER
                    </span>
                  ) : null}
                  {composeError ? <span className="text-xs text-rose-600">{composeError}</span> : null}
                </div>
              </div>
            </div>
          </div>

          <div className="surface-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Лента</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">Последние обновления</h2>
              </div>
              <button
                type="button"
                onClick={() => void loadFeed()}
                className="w-full rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-slate-300 hover:text-slate-900 sm:w-auto"
              >
                Обновить
              </button>
            </div>

            <div className="mt-6 space-y-4">
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
              {!feedLoading && !feed.length ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
                  Пока нет обновлений. Подпишитесь на авторов или опубликуйте первое сообщение.
                </div>
              ) : null}
              {feed.map((message) => (
                <article key={message.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="uppercase tracking-[0.2em]">
                      Пользователь {shortId(message.author)}
                    </span>
                    <span>{new Date(message.timestamp * 1000).toLocaleString()}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-700">{message.content}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="surface-card p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Ваш доступ</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Лента</p>
                <p className="mt-1 text-sm text-slate-700">
                  {canViewFeed ? 'Лента подписчика доступна.' : 'Нужна роль SUBSCRIBER.'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Публикации</p>
                <p className="mt-1 text-sm text-slate-700">
                  {canPublish ? 'Вы можете публиковать обновления.' : 'Нужна роль PRODUCER.'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Подписки</p>
                <p className="mt-1 text-sm text-slate-700">
                  {canManageSubscriptions ? 'Управляйте подписками.' : 'Нужна роль SUBSCRIBER.'}
                </p>
              </div>
            </div>
          </section>

          <section className="surface-card p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Подсказки по ролям</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                Роль SUBSCRIBER открывает ленту от авторов, на которых вы подписаны.
              </li>
              <li className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                Роль PRODUCER позволяет публиковать короткие обновления для подписчиков.
              </li>
              <li className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                Админы управляют ролями в админ-панели.
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </AppShell>
  )
}

export default DashboardPage
