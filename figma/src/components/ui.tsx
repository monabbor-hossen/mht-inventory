import { useEffect, useState, type ReactNode, type ButtonHTMLAttributes, type PointerEvent } from 'react'

export const iconPaths: Record<string, string> = {
  dashboard: 'M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z',
  inbound: 'M12 3v12m0 0-4-4m4 4 4-4M4 17v3h16v-3',
  scan: 'M3 7V3h4M17 3h4v4M21 17v4h-4M7 21H3v-4M7 8v8M10 8v8M13 8v8M17 8v8',
  damaged: 'M12 3 2 20h20L12 3Zm0 6v5m0 3.5h.01',
  accounts: 'M4 4h16v16H4zM4 9h16M9 9v11',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 14H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9.7 3V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.1Z',
  bell: 'M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0',
  bag: 'M6 7h12l1 14H5zM9 7V5a3 3 0 0 1 6 0v2',
  truck: 'M3 6h11v10H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  wallet: 'M3 7h18v12H3zM3 7l3-3h12v3M16 13h2',
  alert: 'M12 3 2 20h20zM12 10v4M12 17h.01',
  check: 'M5 12l5 5L20 7',
  x: 'M6 6l12 12M18 6 6 18',
  print: 'M6 9V3h12v6M6 18H4v-7h16v7h-2M8 14h8v7H8z',
  plus: 'M12 5v14M5 12h14',
  keyboard: 'M3 6h18v12H3zM7 10h.01M11 10h.01M15 10h.01M7 14h10',
  calendar: 'M4 5h16v15H4zM4 9h16M8 3v4M16 3v4',
  chevron: 'M9 6l6 6-6 6',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
  menu: 'M4 6h16M4 12h16M4 18h16',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  eyeOff: 'M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a16 16 0 0 1-3.2 4.3M6.6 6.6C4 8.3 2 12 2 12s3.5 7 10 7a10.6 10.6 0 0 0 5.4-1.6',
  flash: 'M13 2 4 14h7l-1 8 9-12h-7l1-8Z',
  cameraSwitch: 'M20 7h-3l-2-2H9L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Zm-8 10a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm-5-4 2-2m8 4 2-2',
  camera: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2v11ZM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  cloudCheck: 'M6.5 19H18a4 4 0 0 0 .9-7.9A5.5 5.5 0 0 0 8.2 9a4.5 4.5 0 0 0-1.7 8.7M9.5 14.5l2 2 4-4',
  cloudSync: 'M6.5 19H18a4 4 0 0 0 .9-7.9A5.5 5.5 0 0 0 8.2 9a4.5 4.5 0 0 0-1.7 8.7M10 13a2.5 2.5 0 0 1 4.5-1m0 0v-2m0 2h-2M14 15a2.5 2.5 0 0 1-4.5 1',
  cloudOff: 'M2 2l20 20M5.8 5.8A4.5 4.5 0 0 0 6.5 19H17m2.4-2.6A4 4 0 0 0 18 11.1a5.5 5.5 0 0 0-8.6-3.9',
  download: 'M12 3v12m0 0-4-4m4 4 4-4M4 17v3h16v-3',
  trash: 'M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14',
  edit: 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z',
  sync: 'M21 12a9 9 0 0 0-15.4-6.4L3 8m0-5v5h5M3 12a9 9 0 0 0 15.4 6.4L21 16m0 5v-5h-5',
  code: 'm16 18 6-6-6-6M8 6l-6 6 6 6',
  collapse: 'M15 18l-6-6 6-6M4 4v16',
  car: 'M5 17H3v-5l2-5h10l3 5h3v5h-2m-12 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0Zm10 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0ZM5 12h12',
  hardhat: 'M2 18h20v2H2v-2Zm2-2a8 8 0 0 1 16 0H4Zm6-7V5h4v4',
  bulb: 'M9 18h6m-5 3h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2Z',
  coffee: 'M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v7a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8Zm3-5v2m4-2v2m4-2v2',
  lock: 'M5 11h14v10H5V11Zm3 0V7a4 4 0 1 1 8 0v4',
  zone: 'M3 5h18v14H3V5Zm0 7h18M12 5v14',
}

export function Icon({ name, className = 'size-5' }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.85} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden data-svg-icon={name}>
      <path d={iconPaths[name] || iconPaths.dashboard} />
    </svg>
  )
}

export function MhtLogoSvg({ light = false, size = 38 }: { light?: boolean; size?: number }) {
  const bg = light ? '#FFFFFF' : '#005C4B'
  const fg = light ? '#005C4B' : '#FFFFFF'
  const accent = '#FF9800'
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Mht Vector Logo">
      <rect width="40" height="40" rx="11" fill={bg} />
      <path d="M9 28V12.5L15.8 21.5L22.5 12.5V28" stroke={fg} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M27.5 12.5V28M24.5 18.5H31.5" stroke={fg} strokeWidth="3" strokeLinecap="round" />
      <circle cx="31.5" cy="12.5" r="2.6" fill={accent} />
    </svg>
  )
}

type Variant = 'filled' | 'tonal' | 'outlined' | 'text' | 'accent' | 'danger'
const variants: Record<Variant, string> = {
  filled: 'bg-primary text-white hover:bg-primary-dark hover:shadow-md active:shadow-sm',
  accent: 'bg-accent text-white hover:brightness-95 hover:shadow-md active:shadow-sm',
  tonal: 'bg-primary-soft text-primary hover:bg-[#cbe7e2]',
  outlined: 'border border-line bg-white text-ink hover:bg-ink/[.04] hover:border-muted/40',
  text: 'text-primary hover:bg-primary/[.08]',
  danger: 'bg-error text-white hover:brightness-95 hover:shadow-md',
}

export type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  loading?: boolean
  showIcon?: boolean
  iconName?: string
  label?: string
}

export function Button({
  variant = 'filled',
  loading = false,
  showIcon = false,
  iconName,
  label,
  className = '',
  children,
  disabled,
  onPointerDown,
  ...rest
}: PrimaryButtonProps) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number; s: number }[]>([])
  const down = (e: PointerEvent<HTMLButtonElement>) => {
    if (disabled || loading) return
    const r = e.currentTarget.getBoundingClientRect()
    const s = Math.max(r.width, r.height) / 2
    const id = Date.now()
    setRipples((p) => [...p, { id, x: e.clientX - r.left - s / 2, y: e.clientY - r.top - s / 2, s }])
    setTimeout(() => setRipples((p) => p.filter((x) => x.id !== id)), 600)
    onPointerDown?.(e)
  }
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      onPointerDown={down}
      data-component="PrimaryButton"
      className={`relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-full px-5 h-10 text-sm font-semibold transition-all duration-150 active:scale-[.98] disabled:opacity-55 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-pointer ${variants[variant]} ${className}`}
    >
      {loading ? <Spinner className="size-4" /> : showIcon && iconName ? <Icon name={iconName} className="size-4" /> : null}
      {label ?? children}
      {ripples.map((r) => (
        <span key={r.id} className="ripple" style={{ left: r.x, top: r.y, width: r.s, height: r.s }} />
      ))}
    </button>
  )
}

export const PrimaryButton = Button

export function SearchField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <input
      type="search"
      aria-label="Search batch, product, zone or team member"
      placeholder="Search batch, product, zone or team…"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 w-full rounded-xl border border-line bg-bg px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 sm:w-80"
    />
  )
}

export const Spinner = ({ className = 'size-4' }: { className?: string }) => (
  <span className={`${className} inline-block rounded-full border-2 border-current border-t-transparent animate-spin`} />
)

export const inputCls = (error?: boolean) =>
  `typing w-full h-12 rounded-xl border bg-white px-3.5 text-[15px] outline-none transition-all duration-150 placeholder:text-muted/60 hover:border-muted/50 focus:ring-4 disabled:bg-bg disabled:opacity-60 ${
    error ? 'border-error focus:border-error focus:ring-error/15' : 'border-line focus:border-primary focus:ring-primary/15'
  }`

export function Field({ label, error, children, hint }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block" data-component="FormField">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
      {children}
      {error ? (
        <span className="err mt-1.5 flex items-center gap-1 text-xs font-medium text-error">
          <Icon name="alert" className="size-3.5 shrink-0" />
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  )
}

export function Card({ children, className = '', frameName }: { children: ReactNode; className?: string; frameName?: string }) {
  return (
    <div data-frame={frameName} className={`rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.03)] ${className}`}>
      {children}
    </div>
  )
}

export function Toast({ message, tone = 'success', onDone }: { message: string; tone?: 'success' | 'warning' | 'error'; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200)
    return () => clearTimeout(t)
  }, [onDone])
  const badgeColor = tone === 'error' ? 'bg-error' : tone === 'warning' ? 'bg-accent' : 'bg-emerald-500'
  return (
    <div className="anim-toast-tr fixed right-4 top-20 z-50 flex items-center gap-3 rounded-2xl border border-white/10 bg-ink px-4 py-3.5 text-sm font-medium text-white shadow-2xl md:right-8">
      <span className={`grid size-6 shrink-0 place-items-center rounded-full ${badgeColor}`}>
        <Icon name={tone === 'error' ? 'x' : 'check'} className="size-4" />
      </span>
      <span>{message}</span>
      <button onClick={onDone} className="ml-1 rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white cursor-pointer" aria-label="Dismiss">
        <Icon name="x" className="size-3.5" />
      </button>
    </div>
  )
}

export function Barcode({ value, className = '' }: { value: string; className?: string }) {
  const safeVal = value.trim() || 'B-0000-000'
  const bars: number[] = []
  for (let i = 0; i < safeVal.length * 4 + 14; i++) {
    const c = safeVal.charCodeAt(i % safeVal.length) + i * 7
    bars.push((c % 3) + 1)
  }
  let x = 0
  return (
    <svg viewBox={`0 0 ${bars.reduce((a, b) => a + b * 2, 0)} 56`} preserveAspectRatio="none" className={className} aria-label={`Barcode ${safeVal}`}>
      {bars.map((w, i) => {
        const el = i % 2 === 0 ? <rect key={i} x={x} y={0} width={w} height={56} fill="#111827" /> : null
        x += w * 2
        return el
      })}
    </svg>
  )
}
