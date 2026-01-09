type MessageBannerProps = {
  message: string
  className?: string
}

const MessageBanner = ({ message, className = '' }: MessageBannerProps) => {
  if (!message) return null

  return (
    <p
      role="status"
      aria-live="polite"
      className={`rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 ${className}`}
    >
      {message}
    </p>
  )
}

export default MessageBanner
