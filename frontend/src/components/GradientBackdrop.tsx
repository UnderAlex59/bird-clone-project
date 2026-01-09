type GradientBackdropProps = {
  className?: string
}

const GradientBackdrop = ({ className = '' }: GradientBackdropProps) => (
  <div
    className={`pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] ${className}`}
  >
    <div
      className="absolute -left-24 -top-16 h-80 w-80 rounded-full blur-[90px]"
      style={{ backgroundColor: 'var(--glow-1)' }}
    />
    <div
      className="absolute right-[-40px] top-24 h-72 w-72 rounded-full blur-[100px]"
      style={{ backgroundColor: 'var(--glow-2)' }}
    />
    <div
      className="absolute bottom-[-40px] left-20 h-64 w-64 rounded-full blur-[110px]"
      style={{ backgroundColor: 'var(--glow-3)' }}
    />
  </div>
)

export default GradientBackdrop
