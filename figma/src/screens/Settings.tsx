import { useState } from 'react'
import { Button, Card, Icon, MhtLogoSvg, iconPaths } from '../components/ui'
import { initialUnsyncedQueue, type SyncState, type UnsyncedRecord } from '../data'

export default function Settings({
  syncState = 'offline',
  setSyncState = () => {},
  toast = () => {},
}: {
  syncState?: SyncState
  setSyncState?: (s: SyncState) => void
  toast?: (m: string) => void
}) {
  const [isOnline, setIsOnline] = useState(syncState === 'synced')
  const [queue, setQueue] = useState<UnsyncedRecord[]>(initialUnsyncedQueue)
  const [fadingIds, setFadingIds] = useState<string[]>([])
  const [syncing, setSyncing] = useState(false)

  const unsyncedScans = queue
    .filter((q) => q.kind === 'Scan')
    .reduce((sum, q) => sum + (q.count || 1), 0)
  const unsyncedExpenses = queue.filter((q) => q.kind === 'Expense').length

  const toggleNetwork = (online: boolean) => {
    setIsOnline(online)
    if (!online) {
      setSyncState('offline')
    } else {
      setSyncState(queue.length > 0 ? 'syncing' : 'synced')
    }
  }

  const handleForceSync = () => {
    if (queue.length === 0 || syncing) return
    setSyncing(true)
    setSyncState('syncing')

    const items = [...queue]
    items.forEach((item, index) => {
      setTimeout(() => {
        setFadingIds((prev) => [...prev, item.id])
      }, index * 300)

      setTimeout(() => {
        setQueue((prev) => prev.filter((x) => x.id !== item.id))
      }, index * 300 + 280)
    })

    setTimeout(() => {
      setSyncing(false)
      setFadingIds([])
      setIsOnline(true)
      setSyncState('synced')
      toast('Force Sync complete: 45 Scans & 3 Vouchers synced to MHT Cloud')
    }, items.length * 300 + 320)
  }

  const resetOfflineDemo = () => {
    setQueue(initialUnsyncedQueue)
    setFadingIds([])
    setIsOnline(false)
    setSyncState('offline')
    toast('Simulated 45 Scans Pending in Offline Mode')
  }

  const downloadSvgAsset = (name: string, svgMarkup: string) => {
    const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name}.svg`
    a.click()
    URL.revokeObjectURL(url)
    toast(`Exported ${name}.svg`)
  }

  return (
    <div data-frame="OfflineSyncScreen" className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[1.08fr_1fr]">
        {/* Sync Dashboard & Persistent Network Status */}
        <Card frameName="SyncDashboardCard" className="flex flex-col justify-between p-6">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-ink">Offline Sync & Network Status</h2>
                <p className="text-xs text-muted">
                  Local SQLite queue for 1,500 sq ft warehouse floor when Wi-Fi drops
                </p>
              </div>
              {/* Persistent indicator: Online (Green dot) or Offline Mode (Red slash) */}
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-bold ${
                  isOnline
                    ? 'bg-success-soft text-success'
                    : 'bg-error-soft text-error'
                }`}
              >
                {isOnline ? (
                  <>
                    <span className="size-2.5 rounded-full bg-success" />
                    Online
                  </>
                ) : (
                  <>
                    <Icon name="cloudOff" className="size-3.5 text-error" />
                    Offline Mode
                  </>
                )}
              </span>
            </div>

            {/* Network Mode Switcher */}
            <div className="mt-5 flex items-center justify-between rounded-2xl border border-line bg-bg p-4">
              <div className="flex items-center gap-3">
                <span
                  className={`grid size-10 place-items-center rounded-xl ${
                    isOnline ? 'bg-success-soft text-success' : 'bg-error-soft text-error'
                  }`}
                >
                  <Icon name={isOnline ? 'cloudCheck' : 'cloudOff'} className="size-5" />
                </span>
                <div>
                  <div className="text-sm font-bold text-ink">
                    Status:{' '}
                    <span className={isOnline ? 'text-success' : 'text-error'}>
                      {isOnline ? 'Online (Green Dot)' : 'Offline Mode (Red Slash)'}
                    </span>
                  </div>
                  <div className="text-xs text-muted">
                    {isOnline
                      ? 'Connected to MHT Cloud Sync Engine'
                      : 'Local storage active — queuing scans & petty cash'}
                  </div>
                </div>
              </div>

              <div className="inline-flex rounded-xl border border-line bg-surface p-1">
                <button
                  type="button"
                  onClick={() => toggleNetwork(true)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    isOnline ? 'bg-success text-white' : 'text-muted hover:text-ink'
                  }`}
                >
                  Online
                </button>
                <button
                  type="button"
                  onClick={() => toggleNetwork(false)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    !isOnline ? 'bg-error text-white' : 'text-muted hover:text-ink'
                  }`}
                >
                  Offline Mode
                </button>
              </div>
            </div>

            {/* Pending Local Data Banner ("45 Scans Pending") */}
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-accent/35 bg-accent-soft/55 p-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-accent">
                  Pending Local Data Queue
                </div>
                <div className="mt-1 text-base font-bold text-ink">
                  {queue.length > 0
                    ? `${unsyncedScans} Scans Pending · ${unsyncedExpenses} Expenses Pending`
                    : '0 Scans Pending · All data synchronized'}
                </div>
              </div>
              <span className="rounded-xl bg-white px-3 py-1.5 font-mono text-sm font-bold text-accent shadow-2xs">
                {unsyncedScans} Scans Pending
              </span>
            </div>

            {/* Queued Items List */}
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted">
                <span>Local SQLite Buffer ({queue.length} batch packets)</span>
                {queue.length === 0 && (
                  <button
                    type="button"
                    onClick={resetOfflineDemo}
                    className="font-bold text-primary underline-offset-2 hover:underline cursor-pointer"
                  >
                    Re-seed 45 Pending Scans
                  </button>
                )}
              </div>

              {queue.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-line bg-bg/50 py-8 text-center text-sm text-muted">
                  All warehouse scans and expense vouchers are synced with the cloud.
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {queue.map((item) => {
                    const isFading = fadingIds.includes(item.id)
                    return (
                      <li
                        key={item.id}
                        className={`flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm ${
                          isFading ? 'anim-fadeout-line' : ''
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={`grid size-8 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                              item.kind === 'Scan'
                                ? 'bg-primary-soft text-primary'
                                : 'bg-accent-soft text-accent'
                            }`}
                          >
                            <Icon
                              name={item.kind === 'Scan' ? 'scan' : 'wallet'}
                              className="size-4"
                            />
                          </span>
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-ink">{item.title}</div>
                            <div className="truncate text-xs text-muted">{item.subtitle}</div>
                          </div>
                        </div>
                        <span className="shrink-0 font-mono text-xs text-muted">{item.time}</span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* "Force Sync" Button with Rotating Loading State when Clicked */}
          <div className="mt-5 flex flex-wrap gap-3 pt-2">
            <Button
              type="button"
              onClick={handleForceSync}
              disabled={syncing || queue.length === 0}
              className="h-12 flex-1 text-[15px]"
            >
              <Icon
                name="sync"
                className={`size-4 ${syncing ? 'animate-spin' : ''}`}
              />
              <span>{syncing ? 'Force Syncing Pending Records…' : 'Force Sync'}</span>
            </Button>
            {queue.length === 0 && (
              <Button
                type="button"
                variant="outlined"
                onClick={resetOfflineDemo}
                className="h-12"
              >
                Reset 45 Scans Pending
              </Button>
            )}
          </div>
        </Card>

        {/* Flutter / Antigravity IDE Handoff & Component States */}
        <Card frameName="FlutterHandoffCard" className="flex flex-col justify-between p-6">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary">
                  <Icon name="code" className="size-5" />
                </span>
                <div>
                  <h3 className="font-bold text-ink">Flutter / Antigravity IDE Handoff</h3>
                  <p className="text-xs text-muted">
                    Auto Layout Frames · PascalCase Naming · Exportable SVG Vectors
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-bg px-2.5 py-1 font-mono text-[11px] font-bold text-primary">
                M3 Tokens
              </span>
            </div>

            {/* 6 Design System Color Tokens */}
            <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {[
                { name: 'Primary', hex: '#005C4B', cls: 'bg-primary text-white' },
                { name: 'Secondary', hex: '#FF9800', cls: 'bg-accent text-white' },
                { name: 'Background', hex: '#F8F9FA', cls: 'bg-bg text-ink border border-line' },
                { name: 'Surface', hex: '#FFFFFF', cls: 'bg-surface text-ink border border-line' },
                { name: 'Error', hex: '#D32F2F', cls: 'bg-error text-white' },
                { name: 'Success', hex: '#2E7D32', cls: 'bg-success text-white' },
              ].map((t) => (
                <div key={t.name} className={`rounded-xl p-2.5 text-center ${t.cls}`}>
                  <div className="text-[11px] font-bold">{t.name}</div>
                  <div className="mt-0.5 font-mono text-[10px] opacity-90">{t.hex}</div>
                </div>
              ))}
            </div>

            {/* Required Component States Showcase: Default, Hover, Active, Disabled, Loading */}
            <div className="mt-5">
              <div className="text-xs font-bold uppercase tracking-wider text-muted">
                Required Component States (Default, Hover, Active, Disabled, Loading)
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-5">
                <Button label="Default" className="h-9 px-3 text-xs" />
                <Button
                  label="Hover"
                  className="h-9 bg-primary-dark px-3 text-xs shadow-md"
                />
                <Button
                  label="Active"
                  className="h-9 scale-96 bg-primary-dark px-3 text-xs ring-3 ring-primary/25"
                />
                <Button label="Disabled" disabled className="h-9 px-3 text-xs" />
                <Button label="Loading" loading className="h-9 px-3 text-xs" />
              </div>
            </div>

            {/* Exportable SVG Assets */}
            <div className="mt-5 border-t border-line pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MhtLogoSvg size={36} />
                  <div>
                    <div className="text-sm font-bold text-ink">Exportable SVG Vectors</div>
                    <div className="text-xs text-muted">
                      MHT Logo + Expense Category & Scanner Icons
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() =>
                    downloadSvgAsset(
                      'MHTLogo',
                      `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="11" fill="#005C4B"/><path d="M9 28V12.5L15.8 21.5L22.5 12.5V28" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M27.5 12.5V28M24.5 18.5H31.5" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/><circle cx="31.5" cy="12.5" r="2.6" fill="#FF9800"/></svg>`
                    )
                  }
                  className="h-9 px-3 text-xs"
                >
                  <Icon name="download" className="size-3.5" /> Export MHTLogo.svg
                </Button>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {(['car', 'hardhat', 'bulb', 'coffee', 'scan', 'print', 'damaged', 'cloudCheck'] as const).map(
                  (ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() =>
                        downloadSvgAsset(
                          `Icon_${ic}`,
                          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#005C4B" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"><path d="${iconPaths[ic]}"/></svg>`
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-bg px-2.5 py-1 font-mono text-[11px] text-ink hover:border-primary hover:text-primary cursor-pointer"
                    >
                      <Icon name={ic} className="size-3.5 text-primary" />
                      {ic}.svg
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
