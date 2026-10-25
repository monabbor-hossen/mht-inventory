import { useEffect, useState } from 'react'
import { Button, Card, Field, Icon, inputCls } from '../components/ui'
import { initialDamages, now, products, type DamageItem, type DamageReason } from '../data'

const reasons: DamageReason[] = [
  'Torn Bag',
  'Moisture/Water Damage',
  'Weight Shortage',
  'Quality Issue',
]

const sampleDamagePhotos = [
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&h=360&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1553413077-190dd305871c?w=500&h=360&fit=crop&auto=format',
]

export default function Damaged({
  damages = initialDamages,
  initialBatch,
  onAddDamage = () => {},
  toast = () => {},
}: {
  damages?: DamageItem[]
  initialBatch?: string
  onAddDamage?: (item: DamageItem) => void
  toast?: (m: string) => void
}) {
  const safeDamages = Array.isArray(damages) ? damages : initialDamages
  const [batch, setBatch] = useState(initialBatch || 'B-2610-124')
  const [bags, setBags] = useState('6')
  const [reason, setReason] = useState<DamageReason>('Torn Bag')
  const [notes, setNotes] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [cameraModal, setCameraModal] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const [errors, setErrors] = useState<{ batch?: string; bags?: string }>({})

  useEffect(() => {
    if (initialBatch) setBatch(initialBatch)
  }, [initialBatch])

  const takeSimulatedPhoto = () => {
    setCapturing(true)
    setTimeout(() => {
      setCapturing(false)
      setPhotoUrl(sampleDamagePhotos[safeDamages.length % sampleDamagePhotos.length])
      setCameraModal(false)
    }, 420)
  }

  const handleSubmit = () => {
    const bagNum = Number(bags) || 0
    const errs = {
      batch: batch.trim() ? undefined : 'Batch ID is required',
      bags: bagNum > 0 ? undefined : 'Enter damaged bag count (> 0)',
    }
    setErrors(errs)
    if (errs.batch || errs.bags) return

    const item: DamageItem = {
      id: `DMG-${105 + safeDamages.length}`,
      batch: batch.trim().toUpperCase(),
      product: products[safeDamages.length % products.length],
      bags: bagNum,
      reason,
      time: now(),
      by: 'You',
      photoUrl: photoUrl ?? undefined,
      notes: notes.trim() || `Logged under ${reason} inspection.`,
    }
    onAddDamage(item)
    toast(`Logged ${bagNum} damaged bags (${item.batch}) under ${reason}`)
    setBatch(`B-2610-${Math.floor(130 + Math.random() * 800)}`)
    setBags('4')
    setNotes('')
    setPhotoUrl(null)
  }

  return (
    <div data-frame="DamageReturnScreen" className="mx-auto flex max-w-4xl flex-col gap-6">
      {/* Centered Form Card */}
      <Card frameName="DamageReturnFormCard" className="mx-auto w-full max-w-xl p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-error-soft text-error">
              <Icon name="damaged" className="size-6" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-ink">Damage & Return Management</h2>
              <p className="text-xs text-muted">
                Record damaged sacks from scan or manual entry & capture proof
              </p>
            </div>
          </div>
          <span className="hidden rounded-full bg-accent-soft px-3 py-1 font-mono text-xs font-bold text-accent sm:inline-block">
            QA Quarantine
          </span>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          {/* Batch ID (Auto-filled from scan or manual text entry) + Damaged Bag count */}
          <div className="grid gap-4 sm:grid-cols-[1fr_130px]">
            <Field label="Batch ID (Auto-filled from Scan or Manual)" error={errors.batch}>
              <div className="relative">
                <input
                  className={`${inputCls(!!errors.batch)} font-mono font-bold pr-24`}
                  value={batch}
                  placeholder="B-2610-124"
                  onChange={(e) => {
                    setBatch(e.target.value.toUpperCase())
                    setErrors((x) => ({ ...x, batch: undefined }))
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setBatch(`B-2610-${Math.floor(100 + Math.random() * 899)}`)
                    setErrors((x) => ({ ...x, batch: undefined }))
                  }}
                  className="absolute right-2 top-2 flex h-8 items-center gap-1 rounded-lg bg-primary-soft px-2.5 text-xs font-bold text-primary hover:bg-[#cbe7e2] cursor-pointer"
                >
                  <Icon name="scan" className="size-3.5" /> Scan
                </button>
              </div>
            </Field>

            <Field label="Bags Affected" error={errors.bags}>
              <input
                inputMode="numeric"
                className={`${inputCls(!!errors.bags)} font-mono font-bold`}
                value={bags}
                onChange={(e) => {
                  setBags(e.target.value.replace(/\D/g, ''))
                  setErrors((x) => ({ ...x, bags: undefined }))
                }}
              />
            </Field>
          </div>

          {/* Reason for Damage Dropdown */}
          <Field label="Reason for Damage">
            <div className="relative">
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as DamageReason)}
                className={`${inputCls()} appearance-none pr-10 font-semibold cursor-pointer`}
              >
                {reasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted rotate-90">
                <Icon name="chevron" className="size-4" />
              </span>
            </div>
          </Field>

          {/* Photo Attachment: "Capture Proof" button -> camera modal -> thumbnail with Remove icon */}
          <Field label="Photo Attachment">
            {!photoUrl ? (
              <button
                type="button"
                onClick={() => setCameraModal(true)}
                className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-bg/60 text-sm font-bold text-primary transition-all hover:border-primary hover:bg-primary-soft/40 cursor-pointer"
              >
                <span className="grid size-10 place-items-center rounded-full bg-primary-soft text-primary">
                  <Icon name="camera" className="size-5" />
                </span>
                <span>Capture Proof</span>
              </button>
            ) : (
              <div className="anim-fade flex items-center justify-between gap-4 rounded-2xl border border-line bg-bg p-3">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <img
                      src={photoUrl}
                      alt="Captured damage proof thumbnail"
                      className="h-18 w-24 rounded-xl border border-line bg-ink/10 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoUrl(null)}
                      aria-label="Remove proof photo"
                      className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-error text-white shadow-md transition-transform hover:scale-110 cursor-pointer"
                    >
                      <Icon name="x" className="size-3.5" />
                    </button>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-ink">PROOF_{batch}.JPG</div>
                    <div className="mt-0.5 text-xs text-muted">
                      Attached · {reason}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPhotoUrl(null)}
                  className="inline-flex items-center gap-1 rounded-xl border border-error/25 bg-error-soft px-3 py-1.5 text-xs font-bold text-error hover:brightness-95 cursor-pointer"
                >
                  <Icon name="trash" className="size-3.5" /> Remove
                </button>
              </div>
            )}
          </Field>

          <Field label="Notes / Inspection Remarks">
            <input
              className={inputCls()}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Torn stitch on Floor-1 pallet edge"
            />
          </Field>

          <Button
            type="button"
            variant="danger"
            onClick={handleSubmit}
            className="mt-2 h-12 w-full text-[15px]"
          >
            <Icon name="damaged" className="size-4" /> Submit Damage & Return Report
          </Button>
        </div>
      </Card>

      {/* Quarantined Damage Ledger History */}
      <Card frameName="DamageHistoryCard" className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div>
            <h3 className="font-bold text-ink">Quarantined Damage & Return Log</h3>
            <p className="text-xs text-muted">
              Verified damaged bags deducted from active 1,500 sq ft stock
            </p>
          </div>
          <span className="rounded-full bg-error-soft px-3 py-1 font-mono text-xs font-bold text-error">
            {safeDamages.reduce((s, d) => s + d.bags, 0)} Damaged Bags
          </span>
        </div>
        <ul className="divide-y divide-line">
          {safeDamages.map((d) => (
            <li
              key={d.id}
              className="anim-fade flex flex-wrap items-center justify-between gap-4 px-6 py-4 hover:bg-bg/60"
            >
              <div className="flex items-center gap-3.5">
                {d.photoUrl ? (
                  <img
                    src={d.photoUrl}
                    alt={d.reason}
                    className="size-12 rounded-xl border border-line bg-ink/10 object-cover"
                  />
                ) : (
                  <span className="grid size-12 place-items-center rounded-xl bg-error-soft text-error">
                    <Icon name="damaged" className="size-5" />
                  </span>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-ink">{d.batch}</span>
                    <span className="rounded-md bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
                      {d.reason}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted">
                    {d.product} · {d.notes}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-bold text-error">{d.bags} Bags</div>
                <div className="text-xs text-muted">
                  {d.time} · {d.by}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {/* Camera Simulation Modal */}
      {cameraModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 anim-cross"
          onClick={() => setCameraModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            data-frame="CaptureProofModal"
            className="anim-pop w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-[#0c1417] text-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                Capture Proof · {batch}
              </div>
              <button
                type="button"
                onClick={() => setCameraModal(false)}
                className="rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <Icon name="x" className="size-4" />
              </button>
            </div>

            <div className="relative aspect-4/3 w-full overflow-hidden bg-black">
              <img
                src={sampleDamagePhotos[safeDamages.length % sampleDamagePhotos.length]}
                alt="Camera viewfinder preview"
                className={`h-full w-full object-cover transition-all duration-300 ${
                  capturing ? 'scale-105 brightness-150' : 'opacity-85'
                }`}
              />
              <div className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-dashed border-white/50" />
              <div className="absolute bottom-3 left-3 rounded-lg bg-black/65 px-2.5 py-1 font-mono text-[11px] text-emerald-300">
                {reason.toUpperCase()} · {bags} BAGS
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4">
              <Button
                type="button"
                variant="text"
                onClick={() => setCameraModal(false)}
                className="text-white/75 hover:bg-white/10"
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={takeSimulatedPhoto}
                aria-label="Capture Proof Shutter"
                className="grid size-14 place-items-center rounded-full border-4 border-white bg-accent text-white shadow-lg transition-transform active:scale-90 cursor-pointer"
              >
                <Icon name="camera" className="size-6" />
              </button>
              <span className="font-mono text-xs text-white/60">1,500 SQFT QA</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
