import { useEffect, useMemo, useState } from 'react'
import AppShell from '../components/AppShell'
import { Role, ROLES } from '../constants/roles'
import { useAuthFetch } from '../hooks/useAuthFetch'
import { useAuth } from '../providers/AuthProvider'
import { classNames } from '../utils/classNames'

const BASES = {
  ums: '/api/ums',
  twitter: '/api/twitter',
} as const

type ServiceKey = keyof typeof BASES

type ResponseSnapshot = {
  ok: boolean
  status: number
  statusText: string
  method: string
  url: string
  durationMs: number
  timestamp: string
  body: string
}

type UMSRole = {
  roleId?: string
  role: string
  description?: string | null
}

type UMSUser = {
  id: string
  name: string
  email: string
  created?: number
  roles: UMSRole[]
}

type ApiResponse<T> = {
  code?: string
  message?: string
  data?: T
}

const sampleIds = {
  userId: '6e27ea06-a716-4c89-af88-813749a8bd48',
  subscriberId: '70a64b54-43c3-4c18-bbec-64590ff7e0cc',
  producerId: '1cd89e11-602a-4186-afbf-e0149b59eb08',
  messageId: '29f484aa-638e-4a9f-97cf-acf2f33acef7',
}

const buildUrl = (service: ServiceKey, path: string) =>
  `${BASES[service]}${path.startsWith('/') ? '' : '/'}${path}`

const inputClass =
  'mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200'
const textareaClass =
  'mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200'
const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] transition disabled:cursor-not-allowed disabled:opacity-60'
const buttonPrimary = classNames(buttonBase, 'bg-slate-900 text-white hover:bg-slate-800')
const buttonGhost = classNames(
  buttonBase,
  'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
)

type ConsoleMode = 'admin' | 'workspace'

type AdminConsolePageProps = {
  mode?: ConsoleMode
}

const AdminConsolePage = ({ mode = 'admin' }: AdminConsolePageProps) => {
  const { session, canAccess } = useAuth()
  const authFetch = useAuthFetch()
  const token = session?.token ?? ''
  const isAdminMode = mode === 'admin'
  const userIdentity = session?.user?.id ?? ''

  const canManageUsers = canAccess(ROLES.ADMIN)
  const canViewProducerFeed = canAccess(ROLES.PRODUCER)
  const canViewSubscriberFeed = canAccess(ROLES.SUBSCRIBER)
  const canCreateMessage = canAccess(ROLES.PRODUCER)
  const canDeleteMessage = canAccess(ROLES.PRODUCER)
  const canManageSubscriptions = canAccess(ROLES.SUBSCRIBER)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [response, setResponse] = useState<ResponseSnapshot | null>(null)

  const [users, setUsers] = useState<UMSUser[]>([])
  const [rolesCatalog, setRolesCatalog] = useState<UMSRole[]>([])
  const [rolesDraft, setRolesDraft] = useState<Record<string, string[]>>({})
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState('')
  const [rolesSaving, setRolesSaving] = useState<string | null>(null)
  const [secretRotating, setSecretRotating] = useState<string | null>(null)

  const [userId, setUserId] = useState('')
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userPassword, setUserPassword] = useState('')
  const [roleAdmin, setRoleAdmin] = useState(false)
  const [roleSubscriber, setRoleSubscriber] = useState(true)
  const [roleProducer, setRoleProducer] = useState(true)

  const [producerId, setProducerId] = useState('')
  const [subscriberId, setSubscriberId] = useState('')
  const [messageAuthor, setMessageAuthor] = useState('')
  const [messageContent, setMessageContent] = useState('')
  const [messageId, setMessageId] = useState('')

  const [subscriptionSubscriber, setSubscriptionSubscriber] = useState('')
  const [subscriptionProducers, setSubscriptionProducers] = useState('')

  useEffect(() => {
    if (!userIdentity) return
    setUserId((prev) => prev || userIdentity)
    setProducerId((prev) => prev || userIdentity)
    setSubscriberId((prev) => prev || userIdentity)
    setMessageAuthor((prev) => prev || userIdentity)
    setSubscriptionSubscriber((prev) => prev || userIdentity)
  }, [userIdentity])

  const availableRoles = useMemo(() => {
    if (rolesCatalog.length) {
      return rolesCatalog.map((role) => role.role)
    }
    const fallback = new Set<string>()
    users.forEach((user) => user.roles?.forEach((role) => fallback.add(role.role)))
    return Array.from(fallback)
  }, [rolesCatalog, users])

  const initialsForUser = (name: string) => {
    const chunks = name
      .split(' ')
      .map((part) => part.trim())
      .filter(Boolean)
    if (!chunks.length) return 'U'
    return chunks.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('')
  }

  const refreshUserDirectory = async () => {
    if (!token || !isAdminMode || !canManageUsers) return
    setUsersLoading(true)
    setUsersError('')
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const [usersRes, rolesRes] = await Promise.all([
        authFetch(buildUrl('ums', '/users'), { headers }),
        authFetch(buildUrl('ums', '/roles'), { headers }),
      ])
      const usersPayload = (await usersRes.json().catch(() => null)) as ApiResponse<UMSUser[]> | null
      const rolesPayload = (await rolesRes.json().catch(() => null)) as ApiResponse<UMSRole[]> | null
      const nextUsers = Array.isArray(usersPayload?.data) ? usersPayload?.data : []
      const nextRoles = Array.isArray(rolesPayload?.data) ? rolesPayload?.data : []
      setUsers(nextUsers)
      setRolesCatalog(nextRoles)
      const nextDraft: Record<string, string[]> = {}
      nextUsers.forEach((user) => {
        nextDraft[user.id] = Array.isArray(user.roles) ? user.roles.map((role) => role.role) : []
      })
      setRolesDraft(nextDraft)
    } catch (fetchError) {
      setUsersError(fetchError instanceof Error ? fetchError.message : 'Не удалось загрузить пользователей.')
    } finally {
      setUsersLoading(false)
    }
  }

  useEffect(() => {
    void refreshUserDirectory()
  }, [token, isAdminMode, canManageUsers])

  const sendRequest = async (method: string, url: string, payload?: unknown) => {
    setBusy(true)
    setError('')
    const started = performance.now()

    try {
      const headers: Record<string, string> = {}
      if (payload) {
        headers['Content-Type'] = 'application/json'
      }
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const res = await authFetch(url, {
        method,
        headers,
        body: payload ? JSON.stringify(payload) : undefined,
      })

      const text = await res.text()
      let formatted = text

      if (text) {
        try {
          formatted = JSON.stringify(JSON.parse(text), null, 2)
        } catch {
          formatted = text
        }
      }

      setResponse({
        ok: res.ok,
        status: res.status,
        statusText: res.statusText || '',
        method,
        url,
        durationMs: Math.round(performance.now() - started),
        timestamp: new Date().toISOString(),
        body: formatted || '<пусто>',
      })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Не удалось выполнить запрос.')
    } finally {
      setBusy(false)
    }
  }

  const callService = (service: ServiceKey, method: string, path: string, payload?: unknown) =>
    sendRequest(method, buildUrl(service, path), payload)

  const rotateUserSecret = async (targetId: string) => {
    if (!token) return
    setSecretRotating(targetId)
    try {
      await callService('ums', 'POST', `/auth/rotate-secret/${targetId}`)
    } finally {
      setSecretRotating(null)
    }
  }

  const guardAction = (allowed: boolean, reason: string, action: () => void) => {
    if (!allowed) {
      setError(reason)
      return
    }
    action()
  }

  const roleHint = (allowed: boolean, requiredRoles: Role[]) =>
    !allowed ? (
      <p className="mt-3 text-xs text-slate-400">
        Нужна роль: {requiredRoles.join(' или ')}
      </p>
    ) : null

  const applySampleIds = () => {
    setUserId(sampleIds.userId)
    setProducerId(sampleIds.producerId)
    setSubscriberId(sampleIds.subscriberId)
    setMessageAuthor(sampleIds.producerId)
    setMessageId(sampleIds.messageId)
    setSubscriptionSubscriber(sampleIds.subscriberId)
    setSubscriptionProducers(`${sampleIds.producerId}, ${sampleIds.userId}`)
  }

  const parseIds = (value: string) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

  const toggleUserRole = (userId: string, role: string) => {
    setRolesDraft((prev) => {
      const current = new Set(prev[userId] ?? [])
      if (current.has(role)) {
        current.delete(role)
      } else {
        current.add(role)
      }
      return { ...prev, [userId]: Array.from(current) }
    })
  }

  const saveUserRoles = async (userId: string) => {
    if (!token) return
    setRolesSaving(userId)
    setUsersError('')
    try {
      const roles = rolesDraft[userId] ?? []
      const res = await authFetch(buildUrl('ums', `/users/user/${userId}/roles`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roles }),
      })
      const payload = (await res.json().catch(() => null)) as ApiResponse<number> | null
      if (payload?.code !== '200') {
        throw new Error(payload?.message || 'Не удалось обновить роли.')
      }

      const roleMap = new Map(rolesCatalog.map((role) => [role.role, role]))
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? {
                ...user,
                roles: roles.map((role) => roleMap.get(role) ?? { role }),
              }
            : user,
        ),
      )
    } catch (saveError) {
      setUsersError(saveError instanceof Error ? saveError.message : 'Не удалось обновить роли.')
    } finally {
      setRolesSaving(null)
    }
  }

  const createUser = () => {
    const roles = []
    if (roleAdmin) {
      roles.push({ role: ROLES.ADMIN, description: 'Администратор системы' })
    }
    if (roleSubscriber) {
      roles.push({ role: ROLES.SUBSCRIBER, description: 'Получатель контента' })
    }
    if (roleProducer) {
      roles.push({ role: ROLES.PRODUCER, description: 'Автор контента' })
    }

    return callService('ums', 'POST', '/users/user', {
      name: userName,
      email: userEmail,
      password: userPassword,
      roles,
    })
  }

  const createMessage = () =>
    callService('twitter', 'POST', '/messages/message', {
      author: messageAuthor,
      content: messageContent,
    })

  const upsertSubscription = (method: 'POST' | 'PUT') =>
    callService('twitter', method, '/subscriptions', {
      subscriber: subscriptionSubscriber,
      producers: parseIds(subscriptionProducers),
    })

  return (
    <AppShell>
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="animate-rise">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
            {isAdminMode ? 'Администрирование' : 'Консоль'}
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
            {isAdminMode ? 'Панель администратора' : 'Консоль и сервисы'}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-slate-600">
            {isAdminMode
              ? 'Управляйте пользователями, ролями и доступом к сервисам.'
              : 'Проверяйте API и управляйте сообщениями и подписками.'}
          </p>
        </div>

        <div className="animate-rise" style={{ animationDelay: '0.08s' }}>
          <div className="surface-card rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between gap-4 text-xs text-slate-600">
              <span className="uppercase tracking-[0.25em]">Состояние</span>
              <span
                className={classNames(
                  'rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em]',
                  busy ? 'bg-slate-900/10 text-slate-700' : 'bg-emerald-100 text-emerald-700',
                )}
              >
                {busy ? 'В работе' : 'Готово'}
              </span>
            </div>
            {isAdminMode ? (
              <button
                type="button"
                className={classNames(buttonGhost, 'mt-3 w-full')}
                onClick={applySampleIds}
              >
                Заполнить примерами
              </button>
            ) : (
              <p className="mt-3 text-xs text-slate-400">Используйте свой ID из профиля.</p>
            )}
          </div>
        </div>
      </header>

      <main className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          {isAdminMode ? (
            <section className="surface-card animate-rise border-l-4 border-indigo-300 p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-indigo-600">Пользователи</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Каталог пользователей</h2>
                  <p className="mt-2 max-w-xl text-sm text-slate-600">
                    Карточки пользователей с переключателями ролей.
                  </p>
                </div>
                <button
                  type="button"
                  className={classNames(buttonGhost, 'px-5 py-2')}
                  onClick={() => void refreshUserDirectory()}
                  disabled={usersLoading || !canManageUsers}
                >
                  {usersLoading ? 'Загрузка...' : 'Обновить'}
                </button>
              </div>

              {usersError ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {usersError}
                </div>
              ) : null}

              {!usersLoading && users.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
                  Пользователи не загружены. Нажмите «Обновить».
                </div>
              ) : null}

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {users.map((user) => (
                  <article key={user.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                        {initialsForUser(user.name)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500 break-all">{user.email}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-400">ID {user.id.slice(0, 8)}...</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {availableRoles.length ? (
                        availableRoles.map((role) => (
                          <label
                            key={`${user.id}-${role}`}
                            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-600"
                          >
                            <input
                              type="checkbox"
                              checked={rolesDraft[user.id]?.includes(role) ?? false}
                              onChange={() => toggleUserRole(user.id, role)}
                              className="h-3 w-3 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
                              disabled={!canManageUsers}
                            />
                            {role}
                          </label>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">Роли недоступны</span>
                      )}
                    </div>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <button
                          type="button"
                          className={classNames(buttonPrimary, 'w-full px-5 py-2 sm:w-auto')}
                          onClick={() => void saveUserRoles(user.id)}
                          disabled={
                            rolesSaving === user.id ||
                            !canManageUsers ||
                            (rolesDraft[user.id]?.length ?? 0) === 0
                          }
                        >
                          {rolesSaving === user.id ? 'Сохранение...' : 'Сохранить роли'}
                        </button>
                        <button
                          type="button"
                          className={classNames(buttonGhost, 'w-full px-5 py-2 sm:w-auto')}
                          onClick={() =>
                            guardAction(canManageUsers, 'Нужна роль ADMIN', () => {
                              void rotateUserSecret(user.id)
                            })
                          }
                          disabled={secretRotating === user.id || !canManageUsers || busy}
                        >
                          {secretRotating === user.id ? 'Сброс...' : 'Сбросить секрет'}
                        </button>
                      </div>
                      <span className="text-xs text-slate-400 sm:whitespace-nowrap sm:text-right">
                        {user.created
                          ? `Создан ${new Date(user.created * 1000).toLocaleDateString()}`
                          : 'Пользователь'}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
              {roleHint(canManageUsers, [ROLES.ADMIN])}
            </section>
          ) : null}

          {isAdminMode ? (
            <section className="surface-card animate-rise border-l-4 border-amber-300 p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-amber-600">UMS</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                    Пользователи и роли
                  </h2>
                </div>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-amber-700">
                  /api/ums
                </span>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    Список пользователей
                  </p>
                  <p className="mt-2 text-sm text-slate-600">Полный список пользователей.</p>
                  <button
                    type="button"
                    className={classNames(buttonPrimary, 'mt-4 w-full')}
                    disabled={busy || !canManageUsers}
                    onClick={() =>
                      guardAction(canManageUsers, 'Нужна роль ADMIN', () =>
                        callService('ums', 'GET', '/users'),
                      )
                    }
                  >
                    Получить
                  </button>
                  {roleHint(canManageUsers, [ROLES.ADMIN])}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    Пользователь по ID
                  </p>
                  <label
                    className="mt-3 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-400"
                    htmlFor="ums-user-id"
                  >
                    ID пользователя
                  </label>
                  <input
                    id="ums-user-id"
                    value={userId}
                    onChange={(event) => setUserId(event.target.value)}
                    placeholder="UUID"
                    className={inputClass}
                    disabled={!canManageUsers}
                  />
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      className={classNames(buttonPrimary, 'flex-1')}
                      disabled={busy || !userId || !canManageUsers}
                      onClick={() =>
                        guardAction(canManageUsers, 'Нужна роль ADMIN', () =>
                          callService('ums', 'GET', `/users/user/${userId}`),
                        )
                      }
                    >
                      Найти
                    </button>
                    <button
                      type="button"
                      className={classNames(buttonGhost, 'flex-1')}
                      disabled={busy || !userId || !canManageUsers}
                      onClick={() =>
                        guardAction(canManageUsers, 'Нужна роль ADMIN', () =>
                          callService('ums', 'DELETE', `/users/user/${userId}`),
                        )
                      }
                    >
                      Удалить
                    </button>
                  </div>
                  {roleHint(canManageUsers, [ROLES.ADMIN])}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    Создать пользователя
                  </p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label
                        className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400"
                        htmlFor="ums-name"
                      >
                        Имя
                      </label>
                      <input
                        id="ums-name"
                        value={userName}
                        onChange={(event) => setUserName(event.target.value)}
                        placeholder="Ирина Петрова"
                        className={inputClass}
                        disabled={!canManageUsers}
                      />
                    </div>
                    <div>
                      <label
                        className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400"
                        htmlFor="ums-email"
                      >
                        Электронная почта
                      </label>
                      <input
                        id="ums-email"
                        type="email"
                        value={userEmail}
                        onChange={(event) => setUserEmail(event.target.value)}
                        placeholder="irina@example.com"
                        className={inputClass}
                        disabled={!canManageUsers}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label
                        className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400"
                        htmlFor="ums-password"
                      >
                        Пароль
                      </label>
                      <input
                        id="ums-password"
                        type="password"
                        value={userPassword}
                        onChange={(event) => setUserPassword(event.target.value)}
                        placeholder="Введите пароль"
                        className={inputClass}
                        disabled={!canManageUsers}
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={roleAdmin}
                        onChange={(event) => setRoleAdmin(event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
                        disabled={!canManageUsers}
                      />
                      Администратор
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={roleSubscriber}
                        onChange={(event) => setRoleSubscriber(event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
                        disabled={!canManageUsers}
                      />
                      Подписчик
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={roleProducer}
                        onChange={(event) => setRoleProducer(event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
                        disabled={!canManageUsers}
                      />
                      Автор
                    </label>
                  </div>
                  <button
                    type="button"
                    className={classNames(buttonPrimary, 'mt-4 w-full')}
                    disabled={busy || !userName || !userEmail || !userPassword || !canManageUsers}
                    onClick={() =>
                      guardAction(canManageUsers, 'Нужна роль ADMIN', () => {
                        void createUser()
                      })
                    }
                  >
                    Создать пользователя
                  </button>
                  {roleHint(canManageUsers, [ROLES.ADMIN])}
                </div>
              </div>
            </section>
          ) : null}

          <section
            className="surface-card animate-rise border-l-4 border-emerald-300 p-6 sm:p-8"
            style={{ animationDelay: '0.08s' }}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-emerald-700">Twitter</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  Сообщения и подписки
                </h2>
              </div>
              {isAdminMode ? (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
                  /api/twitter
                </span>
              ) : null}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Сообщения автора
                </p>
                <label
                  className="mt-3 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-400"
                  htmlFor="twitter-producer-id"
                >
                  ID автора
                </label>
                <input
                  id="twitter-producer-id"
                  value={producerId}
                  onChange={(event) => setProducerId(event.target.value)}
                  placeholder="ID пользователя"
                  className={inputClass}
                  disabled={!canViewProducerFeed}
                />
                <button
                  type="button"
                  className={classNames(buttonPrimary, 'mt-3 w-full')}
                  disabled={busy || !producerId || !canViewProducerFeed}
                  onClick={() =>
                    guardAction(canViewProducerFeed, 'Нужна роль PRODUCER', () =>
                      callService('twitter', 'GET', `/messages/producer/${producerId}`),
                    )
                  }
                >
                  Получить сообщения
                </button>
                {roleHint(canViewProducerFeed, [ROLES.PRODUCER])}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Сообщения подписчика
                </p>
                <label
                  className="mt-3 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-400"
                  htmlFor="twitter-subscriber-id"
                >
                  ID подписчика
                </label>
                <input
                  id="twitter-subscriber-id"
                  value={subscriberId}
                  onChange={(event) => setSubscriberId(event.target.value)}
                  placeholder="ID пользователя"
                  className={inputClass}
                  disabled={!canViewSubscriberFeed}
                />
                <button
                  type="button"
                  className={classNames(buttonPrimary, 'mt-3 w-full')}
                  disabled={busy || !subscriberId || !canViewSubscriberFeed}
                  onClick={() =>
                    guardAction(canViewSubscriberFeed, 'Нужна роль SUBSCRIBER', () =>
                      callService('twitter', 'GET', `/messages/subscriber/${subscriberId}`),
                    )
                  }
                >
                  Получить ленту
                </button>
                {roleHint(canViewSubscriberFeed, [ROLES.SUBSCRIBER])}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Создание и удаление сообщения
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label
                      className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400"
                      htmlFor="twitter-author-id"
                    >
                      ID автора
                    </label>
                    <input
                      id="twitter-author-id"
                      value={messageAuthor}
                      onChange={(event) => setMessageAuthor(event.target.value)}
                      placeholder="ID пользователя"
                      className={inputClass}
                      disabled={!canCreateMessage}
                    />
                  </div>
                  <div>
                    <label
                      className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400"
                      htmlFor="twitter-message-id"
                    >
                      ID сообщения (для удаления)
                    </label>
                    <input
                      id="twitter-message-id"
                      value={messageId}
                      onChange={(event) => setMessageId(event.target.value)}
                      placeholder="ID сообщения"
                      className={inputClass}
                      disabled={!canDeleteMessage}
                    />
                  </div>
                </div>
                <label
                  className="mt-4 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-400"
                  htmlFor="twitter-message-content"
                >
                  Текст сообщения
                </label>
                <textarea
                  id="twitter-message-content"
                  value={messageContent}
                  onChange={(event) => setMessageContent(event.target.value)}
                  placeholder="Напишите сообщение..."
                  className={textareaClass}
                  rows={3}
                  disabled={!canCreateMessage}
                />
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    className={classNames(buttonPrimary, 'flex-1')}
                    disabled={busy || !messageAuthor || !messageContent || !canCreateMessage}
                    onClick={() =>
                      guardAction(canCreateMessage, 'Нужна роль PRODUCER', () => {
                        void createMessage()
                      })
                    }
                  >
                    Опубликовать
                  </button>
                  <button
                    type="button"
                    className={classNames(buttonGhost, 'flex-1')}
                    disabled={busy || !messageId || !canDeleteMessage}
                    onClick={() =>
                      guardAction(canDeleteMessage, 'Нужна роль PRODUCER', () =>
                        callService('twitter', 'DELETE', `/messages/message/${messageId}`),
                      )
                    }
                  >
                    Удалить сообщение
                  </button>
                </div>
                {roleHint(canCreateMessage, [ROLES.PRODUCER])}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Подписки подписчика
                </p>
                <label
                  className="mt-3 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-400"
                  htmlFor="twitter-subscription-id"
                >
                  ID подписчика
                </label>
                <input
                  id="twitter-subscription-id"
                  value={subscriptionSubscriber}
                  onChange={(event) => setSubscriptionSubscriber(event.target.value)}
                  placeholder="ID пользователя"
                  className={inputClass}
                  disabled={!canManageSubscriptions}
                />
                <button
                  type="button"
                  className={classNames(buttonPrimary, 'mt-3 w-full')}
                  disabled={busy || !subscriptionSubscriber || !canManageSubscriptions}
                  onClick={() =>
                    guardAction(canManageSubscriptions, 'Нужна роль SUBSCRIBER', () =>
                      callService('twitter', 'GET', `/subscriptions/subscriber/${subscriptionSubscriber}`),
                    )
                  }
                >
                  Получить подписки
                </button>
                {roleHint(canManageSubscriptions, [ROLES.SUBSCRIBER])}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Управление подписками
                </p>
                <label
                  className="mt-3 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-400"
                  htmlFor="twitter-subscription-producers"
                >
                  ID авторов (через запятую)
                </label>
                <input
                  id="twitter-subscription-producers"
                  value={subscriptionProducers}
                  onChange={(event) => setSubscriptionProducers(event.target.value)}
                  placeholder="id-1, id-2"
                  className={inputClass}
                  disabled={!canManageSubscriptions}
                />
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    className={classNames(buttonPrimary, 'flex-1')}
                    disabled={
                      busy || !subscriptionSubscriber || !subscriptionProducers || !canManageSubscriptions
                    }
                    onClick={() =>
                      guardAction(canManageSubscriptions, 'Нужна роль SUBSCRIBER', () => {
                        void upsertSubscription('POST')
                      })
                    }
                  >
                    Создать
                  </button>
                  <button
                    type="button"
                    className={classNames(buttonGhost, 'flex-1')}
                    disabled={
                      busy || !subscriptionSubscriber || !subscriptionProducers || !canManageSubscriptions
                    }
                    onClick={() =>
                      guardAction(canManageSubscriptions, 'Нужна роль SUBSCRIBER', () => {
                        void upsertSubscription('PUT')
                      })
                    }
                  >
                    Обновить
                  </button>
                </div>
                <button
                  type="button"
                  className={classNames(buttonGhost, 'mt-3 w-full')}
                  disabled={busy || !subscriptionSubscriber || !canManageSubscriptions}
                  onClick={() =>
                    guardAction(canManageSubscriptions, 'Нужна роль SUBSCRIBER', () =>
                      callService('twitter', 'DELETE', `/subscriptions/subscriber/${subscriptionSubscriber}`),
                    )
                  }
                >
                  Удалить подписки
                </button>
                {roleHint(canManageSubscriptions, [ROLES.SUBSCRIBER])}
              </div>
            </div>
          </section>
        </div>

        <aside className="surface-card animate-rise p-6 sm:p-8" style={{ animationDelay: '0.14s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Ответ</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Последний ответ</h2>
            </div>
            <span
              className={classNames(
                'rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em]',
                response?.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-900/10 text-slate-700',
              )}
            >
              {response ? `${response.status}` : 'Нет ответа'}
            </span>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {!token ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Требуется авторизация. Войдите в систему и повторите запрос.
            </div>
          ) : null}

          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
              <div className="flex flex-wrap justify-between gap-2">
                <span className="uppercase tracking-[0.3em]">
                  {response?.method ?? 'Нет запроса'}
                </span>
                <span>{response ? `${response.durationMs} мс` : '—'}</span>
              </div>
              <p className="mt-2 break-all text-[11px] text-slate-500">
                {response?.url ?? 'Запрос ещё не выполнялся.'}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">{response?.timestamp ?? ''}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-900 px-4 py-4 text-xs text-slate-100">
              <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap font-mono">
                {response?.body ?? 'Нет данных.'}
              </pre>
            </div>
          </div>
        </aside>
      </main>
    </AppShell>
  )
}

export default AdminConsolePage
