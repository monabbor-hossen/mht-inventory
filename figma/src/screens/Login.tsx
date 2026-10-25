import { useState, type FormEvent } from 'react'
import { Button, Field, Icon, MhtLogoSvg, Spinner, inputCls } from '../components/ui'
import type { Lang, UserRole } from '../data'

export type Role = UserRole

const roleDefaults: Record<UserRole, { id: string; desc: string }> = {
  'Super Admin': {
    id: 'MHT-ADMIN-01',
    desc: 'Full access: Analytics, Ledger, Data Export & Delete rights.',
  },
  Manager: {
    id: 'MHT-MGR-04',
    desc: 'Receive stock, print barcodes, view ledger & add expenses (No delete rights).',
  },
  Operator: {
    id: 'MHT-OPR-12',
    desc: 'Mobile Only: Outbound Barcode Scanning & Adding Petty Expenses. No financial analytics.',
  },
}

export default function Login({
  onLogin,
  lang = 'EN',
  setLang = () => {},
}: {
  onLogin: (role: Role, user: string) => void
  lang?: Lang
  setLang?: (l: Lang) => void
}) {
  const [role, setRole] = useState<Role>('Super Admin')
  const [user, setUser] = useState(roleDefaults['Super Admin'].id)
  const [pass, setPass] = useState('mht1500sqft')
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState<{ user?: string; pass?: string }>({})
  const [shakeKey, setShakeKey] = useState(0)
  const [loading, setLoading] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const errs = {
      user: user.trim() ? undefined : lang === 'BN' ? 'ইউজার আইডি আবশ্যক' : 'User ID is required',
      pass: pass.trim() ? undefined : lang === 'BN' ? 'পাসওয়ার্ড আবশ্যক' : 'Password is required',
    }
    setErrors(errs)
    if (errs.user || errs.pass) {
      setShakeKey((k) => k + 1)
      return
    }
    setLoading(true)
    setTimeout(() => onLogin(role, user.trim()), 1200)
  }

  return (
    <div
      data-frame="LoginScreen"
      className="anim-cross relative flex min-h-screen flex-col items-center justify-center bg-bg p-4 sm:p-6"
    >
      {/* Top right controls: Language toggle + Frame name */}
      <div className="fixed right-5 top-5 z-20 flex items-center gap-2.5">
        <span className="hidden rounded-full border border-line bg-surface px-3 py-1 font-mono text-[11px] font-medium text-muted shadow-2xs sm:inline-flex">
          Frame: LoginScreen · 1,500 sq ft Warehouse
        </span>
        <div className="inline-flex items-center rounded-full border border-line bg-surface p-0.5 shadow-2xs">
          {(['EN', 'BN'] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                lang === l ? 'bg-primary text-white' : 'text-muted hover:text-ink'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Clean, Centered Card */}
      <div
        key={shakeKey}
        data-frame="LoginCard"
        className={`relative z-10 flex w-full max-w-[430px] flex-col rounded-3xl border border-line bg-surface p-7 shadow-xl sm:p-9 ${
          shakeKey > 0 ? 'anim-shake' : 'anim-fade'
        }`}
      >
        <div className="flex items-center justify-between">
          <Logo />
          <span className="rounded-full bg-primary-soft px-2.5 py-1 font-mono text-[11px] font-bold text-primary">
            1,500 SQ FT
          </span>
        </div>

        <div className="mt-6">
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {lang === 'BN' ? 'এমএইচটি লগইন' : 'Sign in to MHT'}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {lang === 'BN'
              ? 'ভূমিকা নির্বাচন করুন এবং লগইন তথ্য প্রদান করুন'
              : 'Select your warehouse access role and enter your credentials.'}
          </p>
        </div>

        <form onSubmit={submit} noValidate className="mt-6 flex flex-col gap-4">
          <Field label={lang === 'BN' ? 'ভূমিকা নির্বাচন (Role)' : 'Role (Super Admin / Manager / Operator)'}>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => {
                  const next = e.target.value as Role
                  setRole(next)
                  setUser(roleDefaults[next].id)
                }}
                className={`${inputCls()} appearance-none pr-10 font-semibold cursor-pointer`}
              >
                <option value="Super Admin">Super Admin (Full Access & Delete Rights)</option>
                <option value="Manager">Manager (Stock, Print & Ledger · No Delete)</option>
                <option value="Operator">Operator (Mobile Only · Scanner & Petty Cash)</option>
              </select>
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted rotate-90">
                <Icon name="chevron" className="size-4" />
              </span>
            </div>
            <span className="mt-1.5 flex items-center gap-1.5 rounded-xl bg-bg px-3 py-2 text-xs text-muted">
              <Icon name="lock" className="size-3.5 shrink-0 text-primary" />
              <span>{roleDefaults[role].desc}</span>
            </span>
          </Field>

          <Field label={lang === 'BN' ? 'ইউজার আইডি (User ID)' : 'User ID'} error={errors.user}>
            <input
              className={`${inputCls(!!errors.user)} font-mono font-semibold`}
              value={user}
              onChange={(e) => {
                setUser(e.target.value)
                setErrors((x) => ({ ...x, user: undefined }))
              }}
              placeholder="e.g. MHT-ADMIN-01"
              autoComplete="username"
            />
          </Field>

          <Field label={lang === 'BN' ? 'পাসওয়ার্ড (Password)' : 'Password'} error={errors.pass}>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                className={`${inputCls(!!errors.pass)} pr-11`}
                value={pass}
                onChange={(e) => {
                  setPass(e.target.value)
                  setErrors((x) => ({ ...x, pass: undefined }))
                }}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted transition-colors hover:bg-bg hover:text-ink cursor-pointer"
              >
                <Icon name={showPass ? 'eyeOff' : 'eye'} className="size-4" />
              </button>
            </div>
          </Field>

          <Button
            type="submit"
            disabled={loading}
            className="mt-3 h-12 w-full text-[15px] shadow-sm"
            aria-label="Login"
          >
            {loading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Spinner className="size-5" />
              </span>
            ) : lang === 'BN' ? (
              'লগইন (Login)'
            ) : (
              'Login'
            )}
          </Button>
        </form>

        {/* Quick Role Preset Pills for instant testing */}
        <div className="mt-6 border-t border-line pt-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Quick Demo Role Switch
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {(['Super Admin', 'Manager', 'Operator'] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRole(r)
                  setUser(roleDefaults[r].id)
                  setPass('mht1500sqft')
                  setErrors({})
                }}
                className={`rounded-xl border px-2 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  role === r
                    ? 'border-primary bg-primary-soft text-primary'
                    : 'border-line bg-bg text-muted hover:text-ink'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function Logo({ light, compact }: { light?: boolean; compact?: boolean }) {
  return (
    <div className="relative flex items-center gap-2.5" data-component="MHTLogo">
      <MhtLogoSvg light={light} size={compact ? 34 : 38} />
      {!compact && (
        <div className="leading-tight">
          <div className={`text-lg font-bold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>
            MHT
          </div>
          <div className={`text-[11px] font-medium ${light ? 'text-white/65' : 'text-muted'}`}>
            Inventory & Accounts
          </div>
        </div>
      )}
    </div>
  )
}
