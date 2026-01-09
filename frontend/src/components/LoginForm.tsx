import { FormEvent } from 'react'
import { Switch } from '@headlessui/react'
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import { classNames } from '../utils/classNames'

type LoginFormProps = {
  email: string
  password: string
  rememberMe: boolean
  loading: boolean
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onRememberChange: (value: boolean) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200'

const LoginForm = ({
  email,
  password,
  rememberMe,
  loading,
  onEmailChange,
  onPasswordChange,
  onRememberChange,
  onSubmit,
}: LoginFormProps) => (
  <form className="space-y-6" onSubmit={onSubmit}>
    <div className="space-y-2">
      <label className="text-sm text-slate-600" htmlFor="email">
        Электронная почта
      </label>
      <div className="group relative">
        <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
          <EnvelopeIcon className="h-5 w-5" />
        </span>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          className={inputClass}
          placeholder="name@company.com"
        />
      </div>
    </div>

    <div className="space-y-2">
      <label className="text-sm text-slate-600" htmlFor="password">
        Пароль
      </label>
      <div className="group relative">
        <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
          <LockClosedIcon className="h-5 w-5" />
        </span>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          className={inputClass}
          placeholder="Введите пароль"
        />
      </div>
    </div>

    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Switch
          checked={rememberMe}
          onChange={onRememberChange}
          className={classNames(
            rememberMe ? 'bg-slate-900' : 'bg-slate-200',
            'relative inline-flex h-7 w-12 items-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 focus:ring-offset-white',
          )}
        >
          <span className="sr-only">Переключить запоминание</span>
          <span
            className={classNames(
              rememberMe ? 'translate-x-6' : 'translate-x-1',
              'inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition',
            )}
          />
        </Switch>
        <div>
          <p className="text-sm font-semibold text-slate-900">Запомнить меня</p>
          <p className="text-xs text-slate-500">Сохранить сессию на этом устройстве.</p>
        </div>
      </div>
    </div>

    <button
      type="submit"
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-[0_18px_45px_rgba(15,23,42,0.2)] transition hover:-translate-y-[1px] hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading ? 'Вход...' : 'Войти'}
      <span aria-hidden="true">-&gt;</span>
    </button>
  </form>
)

export default LoginForm
