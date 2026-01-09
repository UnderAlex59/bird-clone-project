import GitHubIcon from './icons/GitHubIcon'

type OAuthButtonsProps = {
  onRedirect: (path: string) => void
}

const OAuthButtons = ({ onRedirect }: OAuthButtonsProps) => (
  <div className="mt-8 space-y-4">
    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-slate-400">
      <div className="h-px flex-1 bg-slate-200" />
      <span>или</span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>

    <div className="grid grid-cols-1 gap-3">
      <button
        type="button"
        onClick={() => onRedirect('/oauth2/authorization/github')}
        className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white transition group-hover:shadow-lg">
          <GitHubIcon className="h-5 w-5" />
        </span>
        <div className="text-left">
          <p>Продолжить через GitHub</p>
        </div>
      </button>
    </div>
  </div>
)

export default OAuthButtons
