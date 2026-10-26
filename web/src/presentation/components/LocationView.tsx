'use client'

// ====================================================================
// Presentation Layer: Warehouse Location & Bin Tracking View
// ====================================================================

import { useState, useEffect } from 'react'
import { Button, Card, Field, Icon, inputCls } from '@/components/ui'
import { createLocationAction, relocateItemAction } from '@/presentation/actions/wmsActions'

interface Location {
  id: number
  code: string
  zone: string
  aisle: string
  rack: string
  bin: string
  max_capacity: number
  current_count?: number
  is_active: boolean
}

export function LocationView({
  onToast,
}: {
  onToast: (msg: string, tone: 'success' | 'error' | 'warning') => void
}) {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showRelocateModal, setShowRelocateModal] = useState(false)

  // Form states for Location Creation
  const [code, setCode] = useState('')
  const [zone, setZone] = useState('Zone A (Rice Bulk)')
  const [aisle, setAisle] = useState('A01')
  const [rack, setRack] = useState('R01')
  const [bin, setBin] = useState('B01')
  const [capacity, setCapacity] = useState(100)

  // Form states for Relocate
  const [relocateBarcode, setRelocateBarcode] = useState('')
  const [targetLocationCode, setTargetLocationCode] = useState('')

  const fetchLocations = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/locations')
      const json = await res.json()
      if (json.success) {
        setLocations(json.data)
      }
    } catch {
      onToast('Failed to load warehouse locations', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLocations()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalCode = code.trim() || `${zone.slice(0, 2).replace(/\s/g, '')}-${aisle}-${rack}-${bin}`
    const formData = new FormData()
    formData.append('code', finalCode)
    formData.append('zone', zone)
    formData.append('aisle', aisle)
    formData.append('rack', rack)
    formData.append('bin', bin)
    formData.append('max_capacity', String(capacity))

    const result = await createLocationAction(formData)
    if (result.success) {
      onToast(result.message || 'Location created', 'success')
      setShowAddModal(false)
      setCode('')
      fetchLocations()
    } else {
      onToast(result.error || 'Failed to create location', 'error')
    }
  }

  const handleRelocate = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await relocateItemAction(relocateBarcode.trim(), targetLocationCode.trim())
    if (result.success) {
      onToast(result.message || 'Item relocated', 'success')
      setShowRelocateModal(false)
      setRelocateBarcode('')
      fetchLocations()
    } else {
      onToast(result.error || 'Failed to relocate item', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink">Warehouse Bin & Zone Topology</h2>
          <p className="text-xs text-muted">
            Track exact physical placement across Zones, Aisles, Racks, and Bins with capacity meters.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="tonal"
            onClick={() => setShowRelocateModal(true)}
            className="flex items-center gap-1.5 text-xs"
          >
            <Icon name="truck" className="size-4" />
            <span>Relocate Stock</span>
          </Button>
          <Button
            variant="filled"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 text-xs"
          >
            <Icon name="plus" className="size-4" />
            <span>Add Location</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((loc) => {
          const current = loc.current_count ?? 0
          const rate = loc.max_capacity > 0 ? Math.round((current / loc.max_capacity) * 100) : 0
          const isFull = rate >= 95
          const isWarning = rate >= 80

          return (
            <Card key={loc.id} className="p-4 border border-line bg-surface hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-sm font-bold text-primary">{loc.code}</span>
                  <div className="text-xs font-semibold text-ink mt-0.5">{loc.zone}</div>
                  <div className="text-[11px] text-muted">
                    Aisle: <span className="font-semibold text-ink">{loc.aisle}</span> · Rack:{' '}
                    <span className="font-semibold text-ink">{loc.rack}</span> · Bin:{' '}
                    <span className="font-semibold text-ink">{loc.bin}</span>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isFull
                      ? 'bg-error-soft text-error'
                      : isWarning
                      ? 'bg-accent-soft text-accent'
                      : 'bg-success-soft text-success'
                  }`}
                >
                  {rate}% Cap
                </span>
              </div>

              {/* Capacity Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-[11px] font-medium text-muted mb-1">
                  <span>Current Stock: {current} units</span>
                  <span>Max: {loc.max_capacity}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-bg overflow-hidden border border-line/40">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isFull ? 'bg-error' : isWarning ? 'bg-accent' : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min(100, rate)}%` }}
                  />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Create Location Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <h3 className="text-base font-bold text-ink">Add Warehouse Location</h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted hover:text-ink cursor-pointer">
                <Icon name="x" className="size-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="mt-4 space-y-3">
              <Field label="Zone">
                <select value={zone} onChange={(e) => setZone(e.target.value)} className={inputCls()}>
                  <option value="Zone A (Rice Bulk)">Zone A (Rice Bulk)</option>
                  <option value="Zone B (Flour & Wheat)">Zone B (Flour & Wheat)</option>
                  <option value="Zone C (Pulses)">Zone C (Pulses)</option>
                  <option value="Zone D (Cold Storage)">Zone D (Cold Storage)</option>
                  <option value="Zone E (Transit / Dispatch Bay)">Zone E (Transit Bay)</option>
                </select>
              </Field>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Aisle">
                  <input required value={aisle} onChange={(e) => setAisle(e.target.value)} className={inputCls()} />
                </Field>
                <Field label="Rack">
                  <input required value={rack} onChange={(e) => setRack(e.target.value)} className={inputCls()} />
                </Field>
                <Field label="Bin">
                  <input required value={bin} onChange={(e) => setBin(e.target.value)} className={inputCls()} />
                </Field>
              </div>
              <Field label="Custom Code (Optional)">
                <input
                  placeholder="Auto-generated if empty"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className={inputCls()}
                />
              </Field>
              <Field label="Max Storage Capacity (Units)">
                <input
                  type="number"
                  min="1"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className={inputCls()}
                />
              </Field>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outlined" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="filled">
                  Save Location
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Relocate Item Modal */}
      {showRelocateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <h3 className="text-base font-bold text-ink">Relocate Barcode Stock</h3>
              <button onClick={() => setShowRelocateModal(false)} className="text-muted hover:text-ink cursor-pointer">
                <Icon name="x" className="size-5" />
              </button>
            </div>
            <form onSubmit={handleRelocate} className="mt-4 space-y-3">
              <Field label="Item Barcode String">
                <input
                  required
                  placeholder="e.g. MHT-MINIKET-0001"
                  value={relocateBarcode}
                  onChange={(e) => setRelocateBarcode(e.target.value)}
                  className={inputCls()}
                />
              </Field>
              <Field label="Destination Location Code">
                <select
                  required
                  value={targetLocationCode}
                  onChange={(e) => setTargetLocationCode(e.target.value)}
                  className={inputCls()}
                >
                  <option value="">Select Target Bin...</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.code}>
                      {l.code} ({l.zone} - {l.current_count ?? 0}/{l.max_capacity})
                    </option>
                  ))}
                </select>
              </Field>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outlined" onClick={() => setShowRelocateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="filled">
                  Confirm Relocation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
