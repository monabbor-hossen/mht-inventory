'use client'

// ====================================================================
// Presentation Layer: Cycle Counting & Stock Audit View
// ====================================================================

import { useState, useEffect } from 'react'
import { Button, Card, Field, Icon, inputCls } from '@/components/ui'
import {
  startCycleCountAction,
  auditCycleScanAction,
  completeCycleCountAction,
} from '@/presentation/actions/wmsActions'

export function CycleCountView({
  onToast,
}: {
  onToast: (msg: string, tone: 'success' | 'error' | 'warning') => void
}) {
  const [audits, setAudits] = useState<any[]>([])
  const [activeAudit, setActiveAudit] = useState<any | null>(null)
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showStartModal, setShowStartModal] = useState(false)

  // Start form
  const [selectedLocationId, setSelectedLocationId] = useState('')
  const [notes, setNotes] = useState('')

  // Scan input
  const [scanBarcode, setScanBarcode] = useState('')
  const [scanLoading, setScanLoading] = useState(false)

  const fetchAudits = async () => {
    try {
      setLoading(true)
      const [auditRes, locRes] = await Promise.all([
        fetch('/api/cycle-counts').then((r) => r.json()),
        fetch('/api/locations').then((r) => r.json()),
      ])
      if (auditRes.success) {
        setAudits(auditRes.data)
        if (!activeAudit && auditRes.data.length > 0) {
          const inProgress = auditRes.data.find((a: any) => a.status === 'IN_PROGRESS')
          if (inProgress) setActiveAudit(inProgress)
        }
      }
      if (locRes.success) {
        setLocations(locRes.data)
      }
    } catch {
      onToast('Failed to load cycle count data', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAudits()
  }, [])

  const handleStartAudit = async (e: React.FormEvent) => {
    e.preventDefault()
    const locId = selectedLocationId ? Number(selectedLocationId) : undefined
    const res = await startCycleCountAction(locId, notes)
    if (res.success) {
      onToast(res.message || 'Audit started', 'success')
      setShowStartModal(false)
      setActiveAudit(res.data)
      fetchAudits()
    } else {
      onToast(res.error || 'Failed to start audit', 'error')
    }
  }

  const handleScanItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeAudit || !scanBarcode.trim()) return
    setScanLoading(true)
    try {
      const res = await auditCycleScanAction(activeAudit.id, scanBarcode.trim())
      if (res.success) {
        if (res.data.is_discrepancy) {
          onToast(`Discrepancy detected: ${res.data.notes}`, 'warning')
        } else {
          onToast('Item verified in place', 'success')
        }
        setScanBarcode('')
        fetchAudits()
      } else {
        onToast(res.error || 'Failed to record audit scan', 'error')
      }
    } finally {
      setScanLoading(false)
    }
  }

  const handleCompleteAudit = async () => {
    if (!activeAudit) return
    const res = await completeCycleCountAction(activeAudit.id, 'Audit completed by warehouse auditor')
    if (res.success) {
      onToast(res.message || 'Audit completed', 'success')
      setActiveAudit(null)
      fetchAudits()
    } else {
      onToast(res.error || 'Failed to complete audit', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink">Cycle Counting & Stock Audits</h2>
          <p className="text-xs text-muted">
            Perform physical stock verification against digital records and flag inventory discrepancies.
          </p>
        </div>
        <Button variant="filled" onClick={() => setShowStartModal(true)} className="flex items-center gap-1.5 text-xs">
          <Icon name="plus" className="size-4" />
          <span>New Audit Ticket</span>
        </Button>
      </div>

      {/* Active Audit Session Bar */}
      {activeAudit && activeAudit.status === 'IN_PROGRESS' ? (
        <Card className="p-4 border-2 border-primary/40 bg-primary-soft/10 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-primary">{activeAudit.count_number}</span>
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent">
                  IN PROGRESS
                </span>
              </div>
              <div className="text-xs text-muted mt-1">
                Target Location:{' '}
                <span className="font-semibold text-ink">
                  {activeAudit.location ? activeAudit.location.code : 'Whole Warehouse Audit'}
                </span>{' '}
                · Started: {new Date(activeAudit.started_at).toLocaleTimeString()}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <form onSubmit={handleScanItem} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Scan physical barcode..."
                  value={scanBarcode}
                  onChange={(e) => setScanBarcode(e.target.value)}
                  className={`${inputCls} w-52 text-xs`}
                  disabled={scanLoading}
                  autoFocus
                />
                <Button type="submit" variant="filled" loading={scanLoading} className="text-xs">
                  Verify Scan
                </Button>
              </form>
              <Button type="button" variant="outlined" onClick={handleCompleteAudit} className="text-xs">
                Finish Audit
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {/* Audit History Table */}
      <Card className="overflow-hidden border border-line bg-surface p-0 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-bg text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Audit #</th>
                <th className="px-4 py-3 font-semibold">Location / Zone</th>
                <th className="px-4 py-3 font-semibold">Items Scanned</th>
                <th className="px-4 py-3 font-semibold">Discrepancies</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Conducted At</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {audits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted">
                    No cycle count audits recorded yet. Click &quot;New Audit Ticket&quot; to begin.
                  </td>
                </tr>
              ) : (
                audits.map((a) => {
                  const itemsCount = a.items?.length ?? 0
                  const discrepancyCount = a.items?.filter((i: any) => i.is_discrepancy).length ?? 0

                  return (
                    <tr key={a.id} className="hover:bg-primary-soft/20 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-primary">{a.count_number}</td>
                      <td className="px-4 py-3 text-ink">
                        {a.location ? `${a.location.code} (${a.location.zone})` : 'All Locations'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-ink">{itemsCount} units</td>
                      <td className="px-4 py-3">
                        {discrepancyCount > 0 ? (
                          <span className="rounded-full bg-error-soft px-2 py-0.5 text-[10px] font-bold text-error">
                            {discrepancyCount} Discrepant
                          </span>
                        ) : (
                          <span className="rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-bold text-success">
                            Clean Match
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            a.status === 'COMPLETED'
                              ? 'bg-success-soft text-success'
                              : 'bg-accent-soft text-accent'
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted">{new Date(a.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        {a.status === 'IN_PROGRESS' ? (
                          <Button
                            variant="tonal"
                            onClick={() => setActiveAudit(a)}
                            className="text-[11px] h-7 px-2.5"
                          >
                            Resume
                          </Button>
                        ) : (
                          <span className="text-[11px] text-muted">Closed</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Start Audit Modal */}
      {showStartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <h3 className="text-base font-bold text-ink">Start Cycle Count Audit</h3>
              <button onClick={() => setShowStartModal(false)} className="text-muted hover:text-ink cursor-pointer">
                <Icon name="x" className="size-5" />
              </button>
            </div>
            <form onSubmit={handleStartAudit} className="mt-4 space-y-3">
              <Field label="Target Warehouse Location">
                <select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className={inputCls()}
                >
                  <option value="">Whole Warehouse Audit</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.code} ({loc.zone})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Audit Purpose / Notes">
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Weekly Friday grain audit"
                  className={inputCls()}
                />
              </Field>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outlined" onClick={() => setShowStartModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="filled">
                  Start Audit Session
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
