import { useRef, useState } from 'react'
import { Button, Icon, inputCls } from '../components/ui'
import { initialScans, now, products, type ScanItem, type WarehouseZone } from '../data'

const zones: WarehouseZone[] = ['Zone A', 'Zone B', 'Floor-1', 'Floor-2']

export default function Scan({
  scans = initialScans,
  addScan = () => {},
  onOpenDamaged,
}: {
  scans?: ScanItem[]
  addScan?: (s: ScanItem) => void
  onOpenDamaged?: (batchId: string) => void
}) {
  const [actionMode, setActionMode] = useState<'Dispatch Mode' | 'Damage Mode'>('Dispatch Mode')
  const [flashlight, setFlashlight] = useState(false)
  const [cameraLens, setCameraLens] = useState<'Rear Camera 1x' | 'Front Camera'>('Rear Camera 1x')
  const [sheetExpanded, setSheetExpanded] = useState(false)
  const [fx, setFx] = useState<{ kind: 'ok' | 'err'; n: number; batch: string } | null>(null)
  const [manual, setManual] = useState(false)
  const [code, setCode] = useState('')
  const [codeErr, setCodeErr] = useState('')
  const timer = useRef<number>(0)
  const touchStartY = useRef<number | null>(null)

  const safeScans = Array.isArray(scans) ? scans : initialScans
  const sessionScans = safeScans.filter((s) => s.by.includes('You'))

  const triggerScan = (kind: 'ok' | 'err', customBatch?: string) => {
    clearTimeout(timer.current)
    const batchId =
      customBatch ??
      (kind === 'err'
        ? sessionScans[0]?.batch || 'B-2610-131'
        : `B-2610-${Math.floor(140 + Math.random() * 850)}`)

    const alreadyExists = sessionScans.some((s) => s.batch === batchId)
    if (kind === 'err' || alreadyExists) {
      setFx({ kind: 'err', n: Date.now(), batch: batchId })
      navigator.vibrate?.([70, 40, 80])
      timer.current = window.setTimeout(() => setFx(null), 1800)
      return
    }

    setFx({ kind: 'ok', n: Date.now(), batch: batchId })
    navigator.vibrate?.(40)
    const todayDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    addScan({
      key: String(Date.now() + Math.random()),
      date: todayDate,
      time: now(),
      batch: batchId,
      product: products[Math.floor(Math.random() * products.length)],
      bags: 1,
      weight: '25 Kg',
      zone: zones[sessionScans.length % zones.length],
      by: 'You',
      dir: actionMode === 'Dispatch Mode' ? 'Out' : 'Damaged',
    })
    timer.current = window.setTimeout(() => setFx(null), 1100)
  }

  const submitManual = () => {
    if (!code.trim()) return setCodeErr('Enter a Batch ID')
    const normalized = code.trim().toUpperCase()
    if (!/^B-\d{4}-\d{3}$/i.test(normalized)) {
      setManual(false)
      setCode('')
      return triggerScan('err', normalized)
    }
    triggerScan('ok', normalized)
    setManual(false)
    setCode('')
  }

  return (
    <div data-frame="ScanScreen" className="-m-4 md:m-0 md:mx-auto md:max-w-lg">
      {/* Full-Screen Camera Viewfinder Overlay */}
      <div
        key={fx?.kind === 'err' ? fx.n : 'viewfinder'}
        className={`relative min-h-[630px] overflow-hidden bg-[#081012] text-white shadow-2xl md:rounded-3xl ${
          fx?.kind === 'err' ? 'anim-shake' : ''
        }`}
      >
        {/* Simulated Warehouse Camera Feed */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-24 transition-transform duration-500"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1553413077-190dd305871c?w=1000&auto=format&fit=crop&q=80')",
            transform: cameraLens === 'Front Camera' ? 'scaleX(-1) scale(1.06)' : 'scale(1.12)',
          }}
        />
        <div
          className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
            flashlight
              ? 'bg-[radial-gradient(circle_at_50%_42%,rgba(255,244,180,0.34),rgba(8,16,18,0.88)_72%)]'
              : 'bg-[radial-gradient(circle_at_50%_42%,rgba(0,92,75,0.28),rgba(8,16,18,0.92)_75%)]'
          }`}
        />

        {/* Success Scan: Screen flashes green (20% opacity) / Error Scan: Screen flashes red */}
        {fx?.kind === 'ok' && (
          <div
            key={'flash-ok-' + fx.n}
            className="pointer-events-none absolute inset-0 z-20 bg-success"
            style={{ animation: 'flashGreen 240ms ease-out forwards' }}
          />
        )}
        {fx?.kind === 'err' && (
          <div
            key={'flash-err-' + fx.n}
            className="pointer-events-none absolute inset-0 z-20 bg-error"
            style={{ animation: 'flashRed 350ms ease-out forwards' }}
          />
        )}

        {/* Top Icons: Flashlight Toggle, Camera Reverse & Floating Action Toggle */}
        <div className="relative z-10 flex flex-col gap-3.5 px-5 pt-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-xs font-medium text-white/85">{cameraLens}</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Flashlight Toggle */}
              <button
                type="button"
                onClick={() => setFlashlight((f) => !f)}
                aria-label="Flashlight toggle"
                className={`flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition-all cursor-pointer ${
                  flashlight
                    ? 'border-amber-300 bg-amber-400/25 text-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                    : 'border-white/15 bg-white/10 text-white/85 hover:bg-white/20'
                }`}
              >
                <Icon name="flash" className="size-4" />
                <span>{flashlight ? 'Flash ON' : 'Flash'}</span>
              </button>

              {/* Camera Reverse */}
              <button
                type="button"
                onClick={() =>
                  setCameraLens((l) =>
                    l === 'Rear Camera 1x' ? 'Front Camera' : 'Rear Camera 1x'
                  )
                }
                aria-label="Camera reverse"
                className="grid size-10 place-items-center rounded-full border border-white/15 bg-white/10 text-white/85 transition-colors hover:bg-white/20 cursor-pointer"
              >
                <Icon name="cameraSwitch" className="size-4" />
              </button>
            </div>
          </div>

          {/* Floating Action Toggle: "Dispatch Mode" vs. "Damage Mode" */}
          <div
            className="grid grid-cols-2 rounded-full border border-white/15 bg-black/50 p-1 backdrop-blur-md"
            role="tablist"
          >
            {(['Dispatch Mode', 'Damage Mode'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActionMode(tab)}
                className={`h-9 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  actionMode === tab
                    ? tab === 'Dispatch Mode'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-accent text-white shadow-sm'
                    : 'text-white/65 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Scanner Bounding Box with 4 Corner Markers & Glowing Green Laser */}
        <div className="relative z-10 mx-auto mt-6 aspect-square w-full max-w-[268px]">
          {[
            'left-0 top-0 border-l-4 border-t-4 rounded-tl-2xl',
            'right-0 top-0 border-r-4 border-t-4 rounded-tr-2xl',
            'left-0 bottom-0 border-l-4 border-b-4 rounded-bl-2xl',
            'right-0 bottom-0 border-r-4 border-b-4 rounded-br-2xl',
          ].map((c) => (
            <span
              key={c}
              className={`absolute size-12 transition-colors duration-200 ${
                fx?.kind === 'ok'
                  ? 'border-emerald-400'
                  : fx?.kind === 'err'
                  ? 'border-error'
                  : 'border-white/90'
              } ${c}`}
            />
          ))}

          <div className="pointer-events-none absolute inset-10 flex flex-col items-center justify-center rounded-xl border border-dashed border-white/15">
            <span className="font-mono text-[11px] uppercase tracking-widest text-white/45">
              {actionMode}
            </span>
          </div>

          {/* Glowing Green Laser Line Continuously Animating Up and Down */}
          <span className="laser-green absolute inset-x-3 h-0.5 rounded-full bg-emerald-400 shadow-[0_0_16px_4px_rgba(46,125,50,0.9)]" />

          {/* Lottie Checkmark on Success Scan */}
          {fx?.kind === 'ok' && (
            <div
              key={fx.n}
              className="anim-pop absolute inset-0 m-auto flex flex-col items-center justify-center gap-2"
            >
              <div className="grid size-22 place-items-center rounded-full bg-success shadow-[0_0_0_14px_rgba(46,125,50,0.3)]">
                <svg
                  viewBox="0 0 24 24"
                  className="size-11 fill-none stroke-white stroke-[3]"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path className="lottie-check" d="M5 12l5 5L20 7" />
                </svg>
              </div>
              <span className="rounded-full bg-black/75 px-3 py-1 font-mono text-xs font-bold text-emerald-300">
                {fx.batch} Added ↓
              </span>
            </div>
          )}

          {/* Error Chip: "Already Scanned / Invalid ID" */}
          {fx?.kind === 'err' && (
            <div
              key={fx.n}
              className="anim-pop absolute inset-x-0 top-1/2 mx-auto flex w-max -translate-y-1/2 items-center gap-2 rounded-full border border-white/20 bg-error px-4 py-2.5 text-xs font-bold text-white shadow-2xl"
            >
              <Icon name="alert" className="size-4 shrink-0" />
              <span>Already Scanned / Invalid ID</span>
            </div>
          )}
        </div>

        {/* Live Latest Scanned Pill Sliding Down Above Recent Scans */}
        <div className="relative z-10 mt-3 px-5 text-center">
          {sessionScans[0] ? (
            <div
              key={sessionScans[0].key}
              className="anim-slidein mx-auto inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3.5 py-1 text-xs text-emerald-200"
            >
              <Icon name="check" className="size-3.5 text-emerald-400" />
              <span className="font-mono font-bold">{sessionScans[0].batch}</span>
              <span className="text-white/70">· {sessionScans[0].zone}</span>
            </div>
          ) : (
            <p className="text-xs text-white/60">Align thermal sticker barcode inside corner markers</p>
          )}
        </div>

        {/* Interactive Scan Triggers */}
        <div className="relative z-10 mt-4 grid grid-cols-3 gap-2 px-5 pb-34">
          <Button
            type="button"
            onClick={() => triggerScan('ok')}
            className="h-11 rounded-xl bg-success px-2 text-xs hover:brightness-95"
          >
            <Icon name="check" className="size-4" /> Success Scan
          </Button>
          <Button
            type="button"
            onClick={() => triggerScan('err')}
            className="h-11 rounded-xl bg-error px-2 text-xs hover:brightness-95"
          >
            <Icon name="alert" className="size-4" /> Error Scan
          </Button>
          <Button
            type="button"
            variant="outlined"
            onClick={() => setManual(true)}
            className="h-11 rounded-xl border-white/20 bg-white/10 px-2 text-xs text-white hover:bg-white/20"
          >
            <Icon name="keyboard" className="size-4" /> Manual ID
          </Button>
        </div>

        {/* Bottom Sheet: "Recent Scans (0)" — Swipe up or tap to expand */}
        <div
          onTouchStart={(e) => {
            touchStartY.current = e.touches[0].clientY
          }}
          onTouchEnd={(e) => {
            if (touchStartY.current === null) return
            const deltaY = touchStartY.current - e.changedTouches[0].clientY
            if (deltaY > 30) setSheetExpanded(true)
            if (deltaY < -30) setSheetExpanded(false)
            touchStartY.current = null
          }}
          data-frame="RecentScansBottomSheet"
          className={`absolute inset-x-0 bottom-0 z-30 flex flex-col rounded-t-3xl border-t border-line bg-surface text-ink shadow-[0_-12px_32px_rgba(0,0,0,0.35)] transition-all duration-300 ${
            sheetExpanded ? 'h-[76%]' : 'h-26'
          }`}
        >
          <button
            type="button"
            onClick={() => setSheetExpanded((e) => !e)}
            className="flex w-full flex-col items-center px-5 pb-3 pt-2.5 text-left cursor-pointer"
          >
            <span className="h-1.5 w-11 rounded-full bg-line" />
            <div className="mt-2.5 flex w-full items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-xl bg-primary-soft font-mono text-xs font-bold text-primary">
                  {sessionScans.length}
                </span>
                <div>
                  <div className="text-sm font-bold text-ink">
                    Recent Scans ({sessionScans.length})
                  </div>
                  <div className="text-[11px] text-muted">
                    {sheetExpanded ? 'Swipe down or tap to collapse' : 'Swipe up to expand recent scans'}
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-bg px-3 py-1 text-xs font-semibold text-primary">
                {sheetExpanded ? 'Collapse' : 'Swipe Up'}
                <Icon
                  name="chevron"
                  className={`size-3.5 transition-transform ${
                    sheetExpanded ? 'rotate-90' : '-rotate-90'
                  }`}
                />
              </span>
            </div>
          </button>

          {sheetExpanded && (
            <div className="flex-1 overflow-y-auto border-t border-line px-5 py-3">
              {sessionScans.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted">
                  No scans recorded in this session yet. Tap "Success Scan" above to test.
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {sessionScans.map((s) => (
                    <li
                      key={s.key}
                      className="anim-slidein flex items-center justify-between gap-3 rounded-xl border border-line bg-bg/60 px-3.5 py-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`grid size-9 place-items-center rounded-lg ${
                            s.dir === 'Damaged'
                              ? 'bg-error-soft text-error'
                              : 'bg-success-soft text-success'
                          }`}
                        >
                          <Icon name={s.dir === 'Damaged' ? 'damaged' : 'bag'} className="size-4" />
                        </span>
                        <div>
                          <div className="font-mono text-sm font-bold text-ink">{s.batch}</div>
                          <div className="text-xs text-muted">
                            {s.product} · {s.zone}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            s.dir === 'Damaged'
                              ? 'bg-error-soft text-error'
                              : 'bg-primary-soft text-primary'
                          }`}
                        >
                          {s.dir}
                        </span>
                        {s.dir === 'Damaged' && onOpenDamaged && (
                          <button
                            type="button"
                            onClick={() => onOpenDamaged(s.batch)}
                            className="rounded-lg bg-accent px-2 py-1 text-[11px] font-semibold text-white cursor-pointer"
                          >
                            Attach Proof
                          </button>
                        )}
                        <span className="font-mono text-xs text-muted">{s.time}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Manual Entry Bottom Sheet */}
      {manual && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-ink/45 anim-cross md:items-center"
          onClick={() => setManual(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="anim-sheet w-full max-w-md rounded-t-3xl bg-surface p-6 md:rounded-3xl"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line md:hidden" />
            <h3 className="text-lg font-bold">Enter Batch ID Manually</h3>
            <p className="mt-1 text-sm text-muted">Format: B-YYMM-NNN (e.g. B-2610-205)</p>
            <input
              autoFocus
              className={`${inputCls(!!codeErr)} mt-4 font-mono`}
              placeholder="B-2610-205"
              value={code}
              onChange={(e) => {
                setCode(e.target.value)
                setCodeErr('')
              }}
              onKeyDown={(e) => e.key === 'Enter' && submitManual()}
            />
            {codeErr && (
              <span className="err mt-1.5 block text-xs font-medium text-error">{codeErr}</span>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="text" onClick={() => setManual(false)}>
                Cancel
              </Button>
              <Button onClick={submitManual}>{actionMode}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
