import { Link } from 'react-router-dom'
import AppShell from '../components/AppShell'

const UnauthorizedPage = () => (
  <AppShell>
    <div className="surface-card mx-auto max-w-2xl p-8 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Доступ запрещён</p>
      <h1 className="mt-3 text-2xl font-semibold text-slate-900">Нужна роль ADMIN</h1>
      <p className="mt-3 text-sm text-slate-600">
        Раздел администрирования доступен только пользователям с ролью ADMIN.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-slate-800"
      >
        Вернуться на главную
      </Link>
    </div>
  </AppShell>
)

export default UnauthorizedPage
