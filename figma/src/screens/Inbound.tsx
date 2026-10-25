import { useState } from 'react'
import { Barcode, Button, Card, Field, Icon, MhtLogoSvg, Spinner, inputCls } from '../components/ui'
import {
  now,
  supplierSuggestions,
  type OriginType,
  type ScanItem,
  type WarehouseZone,
} from '../data'

const genId = () =>
  `B-${new Date().toISOString().slice(2, 7).replace('-', '')}-${Math.floor(100 + Math.random() * 900)}`

const printers = [
  'TSC TE244 via Network (192.168.1.45:9100)',
  'TSC TE244 via USB (USB001 · Desk 1)',
  'TSC TTP-244 Pro via Network (192.168.1.48)',
]

const origins: OriginType[] = ['Middle East', 'Local', 'Others']
const zones: WarehouseZone[] = ['Zone A', 'Zone B', 'Floor-1', 'Floor-2']

export default function Inbound({
  toast = () => {},
  onInboundCreated,
}: {
  toast?: (m: string) => void
  onInboundCreated?: (s: ScanItem) => void
}) {
  const [supplier, setSupplier] = useState('Nabil Auto Flour & Rice Mills')
  const [showSuggest, setShowSuggest] = useState(false)
  const [origin, setOrigin] = useState<OriginType>('Local')
  const [challan, setChallan] = useState('LC-DHK-2026-8841')
  const [batch, setBatch] = useState(genId)
  const [unitWeightMode, setUnitWeightMode] = useState<'25 Kg' | '50 Kg' | 'Custom'>('25 Kg')
  const [customWeight, setCustomWeight] = useState('35 Kg')
  const [bags, setBags] = useState('450')
  const [zone, setZone] = useState<WarehouseZone>('Zone A')
  const [printer, setPrinter] = useState(printers[0])
  const [errors, setErrors] = useState<{
    supplier?: string
    challan?: string
    bags?: string
  }>({})
  const [printing, setPrinting] = useState(false)
  const [progress, setProgress] = useState(0)

  const date = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const bagCount = Number(bags) || 0
  const effectiveWeight = unitWeightMode === 'Custom' ? customWeight || '35 Kg' : unitWeightMode
  const numericKg = parseFloat(effectiveWeight) || 25
  const totalTonnes = ((bagCount * numericKg) / 1000).toFixed(2)

  const matchingSuppliers = supplierSuggestions.filter((s) =>
    s.toLowerCase().includes(supplier.toLowerCase())
  )

  const validate = () => {
    const e = {
      supplier: supplier.trim() ? undefined : 'Supplier Name is required',
      challan: challan.trim() ? undefined : 'Challan / LC Number is required',
      bags: bagCount > 0 ? undefined : 'Enter Total Quantity/Bags greater than 0',
    }
    setErrors(e)
    return !e.supplier && !e.challan && !e.bags
  }

  const handlePrint = () => {
    if (!validate()) return
    setPrinting(true)
    setProgress(18)
    setTimeout(() => setProgress(54), 240)
    setTimeout(() => setProgress(88), 520)
    setTimeout(() => setProgress(100), 780)
    setTimeout(() => {
      setPrinting(false)
      setProgress(0)
      toast(`Successfully printed ${bagCount.toLocaleString()} thermal stickers on TSC Printer`)
      onInboundCreated?.({
        key: 'in-' + Date.now(),
        date,
        time: now(),
        batch: batch.trim(),
        product: `${supplier.trim()} (${origin})`,
        bags: bagCount,
        weight: effectiveWeight,
        zone,
        by: 'You',
        dir: 'In',
      })
    }, 1020)
  }

  return (
    <div data-frame="InboundScreen" className="grid gap-6 lg:grid-cols-[1.08fr_1fr]">
      {/* Left Panel: Data Entry Form */}
      <Card frameName="InboundEntryForm" className="flex flex-col justify-between p-6">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink">Inbound Stock & Barcode Printing</h2>
              <p className="mt-0.5 text-xs text-muted">
                1,500 sq ft Warehouse Receiving Desk · Auto-updates thermal label preview
              </p>
            </div>
            <span className="rounded-xl bg-primary-soft px-3 py-1 font-mono text-xs font-bold text-primary">
              {batch}
            </span>
          </div>

          <div className="mt-5 flex flex-col gap-4">
            {/* 1. Supplier Name (Auto-suggest input) */}
            <Field label="Supplier Name (Auto-suggest)" error={errors.supplier}>
              <div className="relative">
                <input
                  className={inputCls(!!errors.supplier)}
                  value={supplier}
                  onFocus={() => setShowSuggest(true)}
                  onBlur={() => setTimeout(() => setShowSuggest(false), 180)}
                  placeholder="Type or pick a verified supplier..."
                  onChange={(e) => {
                    setSupplier(e.target.value)
                    setShowSuggest(true)
                    setErrors((x) => ({ ...x, supplier: undefined }))
                  }}
                />
                {showSuggest && matchingSuppliers.length > 0 && (
                  <ul className="anim-scale absolute inset-x-0 top-full z-30 mt-1.5 max-h-48 overflow-y-auto rounded-2xl border border-line bg-surface p-1.5 shadow-xl">
                    {matchingSuppliers.map((item) => (
                      <li key={item}>
                        <button
                          type="button"
                          onMouseDown={() => {
                            setSupplier(item)
                            setShowSuggest(false)
                            setErrors((x) => ({ ...x, supplier: undefined }))
                          }}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-ink hover:bg-primary-soft hover:text-primary cursor-pointer"
                        >
                          <span>{item}</span>
                          <span className="font-mono text-[10px] text-muted">Verified</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Field>

            {/* 2. Origin Dropdown & 3. Challan/LC Number */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Origin (Middle East / Local / Others)">
                <div className="relative">
                  <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value as OriginType)}
                    className={`${inputCls()} appearance-none pr-10 font-medium cursor-pointer`}
                  >
                    {origins.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted rotate-90">
                    <Icon name="chevron" className="size-4" />
                  </span>
                </div>
              </Field>

              <Field label="Challan / LC Number" error={errors.challan}>
                <input
                  className={`${inputCls(!!errors.challan)} font-mono font-semibold`}
                  value={challan}
                  placeholder="e.g. LC-DHK-2026-8841"
                  onChange={(e) => {
                    setChallan(e.target.value.toUpperCase())
                    setErrors((x) => ({ ...x, challan: undefined }))
                  }}
                />
              </Field>
            </div>

            {/* 4. Unit Weight Dropdown (25 Kg, 50 Kg, Custom) & 5. Total Quantity/Bags */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Unit Weight (25 Kg / 50 Kg / Custom)">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select
                      value={unitWeightMode}
                      onChange={(e) =>
                        setUnitWeightMode(e.target.value as '25 Kg' | '50 Kg' | 'Custom')
                      }
                      className={`${inputCls()} appearance-none pr-9 font-semibold cursor-pointer`}
                    >
                      <option value="25 Kg">25 Kg</option>
                      <option value="50 Kg">50 Kg</option>
                      <option value="Custom">Custom</option>
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted rotate-90">
                      <Icon name="chevron" className="size-4" />
                    </span>
                  </div>
                  {unitWeightMode === 'Custom' && (
                    <input
                      className={`${inputCls()} w-24 font-mono text-sm font-bold`}
                      value={customWeight}
                      placeholder="35 Kg"
                      onChange={(e) => setCustomWeight(e.target.value)}
                    />
                  )}
                </div>
              </Field>

              <Field
                label="Total Quantity / Bags"
                error={errors.bags}
                hint={`Net lot weight: ${totalTonnes} MT`}
              >
                <input
                  inputMode="numeric"
                  className={`${inputCls(!!errors.bags)} font-mono text-base font-bold`}
                  value={bags}
                  placeholder="450"
                  onChange={(e) => {
                    setBags(e.target.value.replace(/\D/g, ''))
                    setErrors((x) => ({ ...x, bags: undefined }))
                  }}
                />
              </Field>
            </div>

            {/* 6. Warehouse Zone Dropdown (Zone A, Zone B, Floor-1, Floor-2) & Batch ID */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Warehouse Zone">
                <div className="relative">
                  <select
                    value={zone}
                    onChange={(e) => setZone(e.target.value as WarehouseZone)}
                    className={`${inputCls()} appearance-none pr-10 font-semibold cursor-pointer`}
                  >
                    {zones.map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted rotate-90">
                    <Icon name="chevron" className="size-4" />
                  </span>
                </div>
              </Field>

              <Field label="Batch ID (Auto-Generated)">
                <div className="relative">
                  <input
                    className={`${inputCls()} font-mono font-bold pr-24`}
                    value={batch}
                    onChange={(e) => setBatch(e.target.value.toUpperCase())}
                  />
                  <button
                    type="button"
                    onClick={() => setBatch(genId())}
                    className="absolute right-2 top-2 h-8 rounded-lg bg-primary-soft px-2.5 text-xs font-bold text-primary hover:bg-[#cbe7e2] cursor-pointer"
                  >
                    New ID
                  </button>
                </div>
              </Field>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 pt-2">
          <Button
            type="button"
            variant="accent"
            onClick={handlePrint}
            disabled={printing}
            className="h-12 w-full text-[15px]"
          >
            {printing ? (
              <>
                <Spinner /> Printing {bagCount.toLocaleString()} Stickers to TSC…
              </>
            ) : (
              <>
                <Icon name="print" className="size-4" /> Print to TSC ({bagCount.toLocaleString()} Stickers)
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Right Panel: Live Thermal Barcode Preview */}
      <Card frameName="ThermalStickerPreview" className="flex flex-col justify-between p-6">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink">Live Thermal Barcode Preview</h2>
              <p className="mt-0.5 text-xs text-muted">
                Direct Thermal Transfer Sticker (100 × 60 mm) · Updates dynamically
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-bold text-success">
              <span className="size-2 rounded-full bg-success animate-pulse" /> TSC Online
            </span>
          </div>

          {/* Direct Thermal Sticker Preview Card showing MHT Logo, Batch ID, Date, Quantity & Barcode */}
          <div className="mt-5 grid place-items-center rounded-2xl border border-line bg-bg p-5 sm:p-6">
            <div className="w-full max-w-md rounded-2xl border-2 border-dashed border-ink/25 bg-white p-5 shadow-md">
              {/* Sticker Header with MHT Logo + Zone + Quantity */}
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center gap-2.5">
                  <MhtLogoSvg size={32} />
                  <div>
                    <div className="text-xs font-bold tracking-wider text-ink">MHT WAREHOUSE</div>
                    <div className="font-mono text-[10px] text-muted">
                      CHALLAN: {challan || '—'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded-md bg-primary-soft px-2 py-0.5 font-mono text-xs font-bold text-primary">
                    {bagCount.toLocaleString()} BAGS · {effectiveWeight}
                  </span>
                  <div className="mt-0.5 font-mono text-[10px] font-bold text-ink">
                    LOC: {zone.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Supplier & Origin Row */}
              <div className="mt-2.5 flex items-center justify-between text-xs">
                <span className="truncate font-semibold text-ink">{supplier || '—'}</span>
                <span className="ml-2 shrink-0 rounded bg-bg px-2 py-0.5 font-mono text-[10px] font-semibold text-muted">
                  Origin: {origin}
                </span>
              </div>

              {/* Barcode SVG */}
              <Barcode value={batch || 'B-0000-000'} className="mt-3.5 h-20 w-full" />

              {/* Batch ID */}
              <div className="mt-2 text-center font-mono text-base font-bold tracking-[0.24em] text-ink">
                {batch || 'B-0000-000'}
              </div>

              {/* Footer: Date + Dynamic Bag Count */}
              <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5 text-[11px] font-medium text-muted">
                <span>Date: {date}</span>
                <span className="font-mono font-bold text-ink">
                  Sticker 1 of {bagCount.toLocaleString()} ({totalTonnes} MT)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <Field label="Target Thermal Printer">
              <div className="relative">
                <select
                  value={printer}
                  onChange={(e) => setPrinter(e.target.value)}
                  className={`${inputCls()} appearance-none pr-10 font-medium cursor-pointer`}
                >
                  {printers.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted rotate-90">
                  <Icon name="chevron" className="size-4" />
                </span>
              </div>
            </Field>
          </div>
        </div>

        {/* Spool Progress */}
        <div className="mt-5 border-t border-line pt-4">
          {printing ? (
            <div className="anim-fade flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-primary">
                  <Spinner className="size-3.5" /> Printing {bagCount.toLocaleString()} labels to{' '}
                  {printer.split(' ')[0]} {printer.split(' ')[1]}…
                </span>
                <span className="font-mono text-ink">{progress}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-bg">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-muted">
              <span>
                Zone assignment: <strong className="text-ink">{zone}</strong> · Origin:{' '}
                <strong className="text-ink">{origin}</strong>
              </span>
              <span className="font-mono font-semibold text-primary">TSPL2 Ready</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
