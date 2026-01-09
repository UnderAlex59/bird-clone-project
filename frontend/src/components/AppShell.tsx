import { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import GradientBackdrop from './GradientBackdrop'
import { ROLES } from '../constants/roles'
import { useAuth } from '../providers/AuthProvider'
import { classNames } from '../utils/classNames'

type AppShellProps = {
  children: ReactNode
}

const AppShell = ({ children }: AppShellProps) => {
  const { session, isAdmin, logout, canAccess } = useAuth()
  const canViewSubscriberTools = canAccess(ROLES.SUBSCRIBER)
  const canViewProducerTools = canAccess(ROLES.PRODUCER)

  return (
    <div className="relative min-h-screen overflow-hidden bg-[color:var(--page-bg)]">
      <div className="absolute inset-0 grid-wash opacity-50" aria-hidden="true" />
      <GradientBackdrop />

      <header className="relative border-b border-[color:var(--border)] bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link to="/" className="text-lg font-semibold text-slate-900">
              Bird
            </Link>
            <nav className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  classNames(
                    'border-b-2 pb-1 transition',
                    isActive ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500',
                  )
                }
              >
                Главная
              </NavLink>
              <NavLink
                to="/console"
                className={({ isActive }) =>
                  classNames(
                    'border-b-2 pb-1 transition',
                    isActive ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500',
                  )
                }
              >
                Консоль
              </NavLink>
              {canViewSubscriberTools ? (
                <NavLink
                  to="/subscriptions"
                  className={({ isActive }) =>
                    classNames(
                      'border-b-2 pb-1 transition',
                      isActive ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500',
                    )
                  }
                >
                  Подписки
                </NavLink>
              ) : null}
              {canViewSubscriberTools ? (
                <NavLink
                  to="/messages"
                  className={({ isActive }) =>
                    classNames(
                      'border-b-2 pb-1 transition',
                      isActive ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500',
                    )
                  }
                >
                  Сообщения
                </NavLink>
              ) : null}
              {canViewProducerTools ? (
                <NavLink
                  to="/subscribers"
                  className={({ isActive }) =>
                    classNames(
                      'border-b-2 pb-1 transition',
                      isActive ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500',
                    )
                  }
                >
                  Подписчики
                </NavLink>
              ) : null}
              {isAdmin ? (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    classNames(
                      'border-b-2 pb-1 transition',
                      isActive ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500',
                    )
                  }
                >
                  Админ-панель
                </NavLink>
              ) : null}
            </nav>
          </div>

          {session ? (
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 sm:gap-4">
              <div className="hidden text-right sm:block">
                <p className="font-medium text-slate-900">{session.user.name}</p>
                <p className="text-xs text-slate-500">{session.user.email}</p>
              </div>
              <div className="hidden flex-wrap gap-2 md:flex">
                {session.user.roles.map((role) => (
                  <span
                    key={role}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-600"
                  >
                    {role}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={logout}
                className="w-full rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-slate-300 hover:text-slate-900 sm:w-auto"
              >
                Выйти
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="w-full rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-slate-300 hover:text-slate-900 sm:w-auto"
            >
              Войти
            </Link>
          )}
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
    </div>
  )
}

export default AppShell
