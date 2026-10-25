import { useCallback, useState } from 'react'
import Login, { Logo, type Role } from './screens/Login'
import Dashboard from './screens/Dashboard'
import Inbound from './screens/Inbound'
import Scan from './screens/Scan'
import Damaged from './screens/Damaged'
import Accounts from './screens/Accounts'
import Settings from './screens/Settings'
import { Icon, Toast } from './components/ui'
import { csvCell } from './warehouse'
import {
  dict,
  initialDamages,
  initialExpenses,
  initialScans,
  now,
  type DamageItem,
  type ExpenseItem,
  type Lang,
  type ScanItem,
  type SyncState,
  type UserRole,
} from './data'

const navItems = [
  { id: 'dashboard', key: 'dashboard', icon: 'dashboard', frame: 'DashboardScreen', adminOrMgrOnly: true },
  { id: 'inbound', key: 'inbound', icon: 'inbound', frame: 'InboundScreen', adminOrMgrOnly: true },
  { id: 'scan', key: 'scan', icon: 'scan', frame: 'ScanScreen', adminOrMgrOnly: false },
  { id: 'damaged', key: 'damaged', icon: 'damaged', frame: 'DamageReturnScreen', adminOrMgrOnly: false },
  { id: 'accounts', key: 'accounts', icon: 'accounts', frame: 'AccountsScreen', adminOrMgrOnly: false },
  { id: 'settings', key: 'settings', icon: 'settings', frame: 'OfflineSyncScreen', adminOrMgrOnly: false },
] as const

export type PageId = (typeof navItems)[number]['id']

export default function App() {
  const [session, setSession] = useState<{ role: Role; user: string } | null>(null)
  const [page, setPage] = useState<PageId>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [lang, setLang] = useState<Lang>('EN')
  const [syncState, setSyncState] = useState<SyncState>('synced')
  const [scans, setScans] = useState<ScanItem[]>(initialScans)
  const [damages, setDamages] = useState<DamageItem[]>(initialDamages)
  const [expenses, setExpenses] = useState<ExpenseItem[]>(initialExpenses)
  const [damagedPreBatch, setDamagedPreBatch] = useState<string | undefined>(undefined)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [toast, setToast] = useState<{ m: string; k: number } | null>(null)

  const showToast = useCallback((m: string) => setToast({ m, k: Date.now() }), [])
  const clearToast = useCallback(() => setToast(null), [])

  const t = dict[lang] ?? dict.EN
  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  const handleRoleChange = (nextRole: UserRole) => {
    const nextUser =
      nextRole === 'Super Admin'
        ? 'Mahmudul H.'
        : nextRole === 'Manager'
        ? 'Kamal H.'
        : 'Rafiqul I.'
    setSession({ role: nextRole, user: nextUser })
    if (nextRole === 'Operator' && (page === 'dashboard' || page === 'inbound')) {
      setPage('scan')
    }
    showToast(`Switched active role to ${nextRole}`)
  }

  const handleExportReport = (format: 'CSV' | 'PDF') => {
    if (session?.role !== 'Super Admin') return
    setExportMenuOpen(false)
    if (format === 'PDF') {
      const report = window.open('', '_blank')
      if (!report) {
        showToast('Allow pop-ups to open the printable report')
        return
      }
      report.document.title = 'MHT Inventory — Movement Report'
      const heading = report.document.createElement('h1')
      heading.textContent = 'MHT Inventory — Movement Report'
      report.document.body.append(heading)
      const note = report.document.createElement('p')
      note.textContent = `Prototype session · ${scans.length} movements · ${todayFormatted}. Select Save as PDF in the print dialog.`
      report.document.body.append(note)
      const table = report.document.createElement('table')
      const headers = table.createTHead().insertRow()
      for (const label of ['Date', 'Time', 'Batch', 'Product', 'Bags', 'Zone', 'Status', 'User']) {
        const cell = report.document.createElement('th')
        cell.textContent = label
        headers.append(cell)
      }
      const body = table.createTBody()
      for (const scan of scans) {
        const row = body.insertRow()
        for (const value of [scan.date, scan.time, scan.batch, scan.product, scan.bags, scan.zone, scan.dir, scan.by]) {
          row.insertCell().textContent = String(value)
        }
      }
      report.document.body.append(table)
      report.document.close()
      report.focus()
      report.print()
      return
    }
    if (format === 'CSV') {
      const csvRows = [
        ['Date', 'Time', 'Batch ID', 'Product', 'Bags', 'Bag Weight', 'Location/Zone', 'Status', 'User'].map(csvCell).join(','),
        ...scans.map((s) =>
          [s.date, s.time, s.batch, s.product, s.bags, s.weight, s.zone, s.dir, s.by].map(csvCell).join(',')
        ),
      ].join('\n')
      const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `MHT_Daily_Report_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
    showToast(`Exported Daily Report (${format})`)
  }

  const cycleSyncState = () => {
    setSyncState((prev) =>
      prev === 'synced' ? 'offline' : prev === 'offline' ? 'syncing' : 'synced'
    )
  }

  if (!session) {
    return (
      <Login
        lang={lang}
        setLang={setLang}
        onLogin={(role, user) => {
          setSession({ role, user })
          setPage(role === 'Operator' ? 'scan' : 'dashboard')
        }}
      />
    )
  }

  const isOperator = session.role === 'Operator'
  const visibleNav = isOperator
    ? navItems.filter((n) => !n.adminOrMgrOnly)
    : navItems
  const currentNav = visibleNav.find((n) => n.id === page) || visibleNav[0]

  return (
    <div className="anim-smart-scale flex min-h-screen bg-bg text-ink">
      {/* Web & Tablet Collapsible Left Sidebar */}
      <aside
        data-frame="SidebarNavigation"
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-surface p-3 transition-all duration-200 md:flex ${
          sidebarCollapsed ? 'w-20 items-center' : 'w-64'
        }`}
      >
        <div className="flex w-full items-center justify-between px-2 py-2.5">
          <Logo compact={sidebarCollapsed} />
          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="grid size-8 place-items-center rounded-lg text-muted hover:bg-bg hover:text-ink cursor-pointer"
          >
            <Icon
              name="collapse"
              className={`size-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {!sidebarCollapsed && (
          <div className="mt-2 rounded-xl border border-line bg-bg px-3 py-2 text-[11px]">
            <div className="font-bold text-primary">{session.role} View</div>
            <div className="text-muted">
              {session.role === 'Super Admin'
                ? 'Full Analytics, Export & Delete'
                : session.role === 'Manager'
                ? 'Stock & Ledger · No Delete'
                : 'Mobile Scanner & Petty Expense'}
            </div>
          </div>
        )}

        <nav className="mt-4 flex w-full flex-col gap-1">
          {visibleNav.map((n) => {
            const active = currentNav.id === n.id
            const label =
              isOperator && n.id === 'accounts' ? 'Petty Expense' : t[n.key]
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => setPage(n.id)}
                title={label}
                className={`group flex h-11 w-full items-center gap-3 rounded-full px-3.5 text-sm font-semibold transition-all duration-150 cursor-pointer ${
                  active
                    ? 'bg-primary-soft text-primary shadow-2xs'
                    : 'text-muted hover:bg-bg hover:text-ink'
                } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon name={n.icon} className="size-5 shrink-0" />
                {!sidebarCollapsed && <span className="truncate">{label}</span>}
                {!sidebarCollapsed && n.id === 'damaged' && (
                  <span className="ml-auto rounded-full bg-error-soft px-2 py-0.5 font-mono text-[10px] font-bold text-error">
                    {damages.length}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="mt-auto flex w-full flex-col gap-2 border-t border-line pt-3">
          {!sidebarCollapsed && (
            <div className="rounded-xl bg-bg px-3 py-2 text-[11px] text-muted">
              <div className="font-mono font-bold text-ink">Frame: {currentNav.frame}</div>
              <div>1,500 sq ft · Auto Layout</div>
            </div>
          )}
          <button
            type="button"
            onClick={() => setSession(null)}
            className={`flex h-10 w-full items-center gap-3 rounded-full px-3.5 text-sm font-medium text-muted transition-colors hover:bg-error-soft hover:text-error cursor-pointer ${
              sidebarCollapsed ? 'justify-center px-0' : ''
            }`}
          >
            <Icon name="logout" className="size-5 shrink-0" />
            {!sidebarCollapsed && <span>{t.signOut}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top App Bar: Role Switcher, Language Toggle (EN/BN), Export Report (PDF/CSV), Persistent Online/Offline Status */}
        <header
          data-frame="TopAppBar"
          className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-surface/90 px-4 backdrop-blur-md md:px-6"
        >
          <div className="md:hidden">
            <Logo compact />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-base font-bold tracking-tight text-ink sm:text-lg">
              {isOperator && currentNav.id === 'accounts'
                ? 'Add Petty Expense'
                : t[currentNav.key]}
            </h1>
            <div className="hidden items-center gap-2 text-xs text-muted sm:flex">
              <span>{todayFormatted}</span>
              <span>·</span>
              <span className="font-mono text-[11px] text-primary">{currentNav.frame}</span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Live Role Switcher (Super Admin / Manager / Operator) */}
            <div className="relative">
              <select
                aria-label="Switch active role"
                value={session.role}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                className="h-9 rounded-full border border-line bg-bg pl-3 pr-7 text-xs font-bold text-ink outline-none transition-colors hover:border-primary/40 cursor-pointer"
              >
                <option value="Super Admin">Role: Super Admin</option>
                <option value="Manager">Role: Manager</option>
                <option value="Operator">Role: Operator (Mobile)</option>
              </select>
            </div>

            {/* Export Report (PDF/CSV) Button — Visible for Super Admin & Manager */}
            {session.role === 'Super Admin' && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setExportMenuOpen((o) => !o)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-bg px-3 text-xs font-semibold text-ink transition-colors hover:border-primary/40 hover:bg-primary-soft/50 cursor-pointer"
                >
                  <Icon name="download" className="size-3.5 text-primary" />
                  <span className="hidden lg:inline">{t.exportReport}</span>
                  <span className="lg:hidden">Export</span>
                </button>

                {exportMenuOpen && (
                  <div className="anim-scale absolute right-0 top-full z-40 mt-2 w-52 rounded-2xl border border-line bg-surface p-1.5 shadow-xl">
                    <button
                      type="button"
                      onClick={() => handleExportReport('CSV')}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-ink hover:bg-bg cursor-pointer"
                    >
                      <span>Download CSV Report</span>
                      <span className="rounded bg-primary-soft px-1.5 py-0.5 font-mono text-[10px] text-primary">
                        .CSV
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportReport('PDF')}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-ink hover:bg-bg cursor-pointer"
                    >
                      <span>Export Printable PDF</span>
                      <span className="rounded bg-accent-soft px-1.5 py-0.5 font-mono text-[10px] text-accent">
                        .PDF
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Persistent Global Indicator: "Online" (Green dot) or "Offline Mode" (Red slash) */}
            <button
              type="button"
              onClick={cycleSyncState}
              title="Click to toggle Online / Offline Mode"
              className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition-all cursor-pointer ${
                syncState === 'synced'
                  ? 'border-success/30 bg-success-soft text-success'
                  : syncState === 'syncing'
                  ? 'border-accent/40 bg-accent-soft text-accent'
                  : 'border-error/30 bg-error-soft text-error'
              }`}
            >
              {syncState === 'synced' ? (
                <span className="size-2 rounded-full bg-success" />
              ) : (
                <Icon
                  name={syncState === 'syncing' ? 'sync' : 'cloudOff'}
                  className={`size-3.5 ${syncState === 'syncing' ? 'animate-spin' : ''}`}
                />
              )}
              <span className="hidden md:inline">
                {syncState === 'synced'
                  ? t.synced
                  : syncState === 'syncing'
                  ? t.syncing
                  : t.offline}
              </span>
            </button>

            {/* Language Toggle (EN / BN) */}
            <div
              className="inline-flex items-center rounded-full border border-line bg-bg p-0.5"
              role="group"
              aria-label="Language toggle"
            >
              {(['EN', 'BN'] as Lang[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`rounded-full px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                    lang === l ? 'bg-primary text-white shadow-2xs' : 'text-muted hover:text-ink'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Active Screen Content */}
        <main key={currentNav.id} className="anim-fade flex-1 p-4 pb-28 md:p-7">
          {currentNav.id === 'dashboard' && (
            <Dashboard
              scans={scans}
              damages={damages}
              expenses={expenses}
              lang={lang}
              role={session.role}
              onDeleteScan={(key) => {
                if (session.role !== 'Super Admin' || !window.confirm('Delete this movement? This changes the recorded stock totals and cannot be undone.')) return
                setScans((prev) => prev.filter((x) => x.key !== key))
                showToast('Deleted activity record (Super Admin)')
              }}
              onNavigate={(target) => setPage(target)}
            />
          )}
          {currentNav.id === 'inbound' && (
            <Inbound
              toast={showToast}
              onInboundCreated={(newScan) => setScans((prev) => [newScan, ...prev])}
            />
          )}
          {currentNav.id === 'scan' && (
            <Scan
              scans={scans}
              addScan={(s) => setScans((x) => [s, ...x])}
              onOpenDamaged={(batchId) => {
                setDamagedPreBatch(batchId)
                setPage('damaged')
              }}
            />
          )}
          {currentNav.id === 'damaged' && (
            <Damaged
              damages={damages}
              initialBatch={damagedPreBatch}
              toast={showToast}
              onAddDamage={(d) => {
                setDamages((prev) => [d, ...prev])
                const todayDate = new Date().toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
                setScans((prev) => [
                  {
                    key: 'dmg-' + Date.now(),
                    date: todayDate,
                    time: now(),
                    batch: d.batch,
                    product: d.product,
                    bags: d.bags,
                    weight: '25 Kg',
                    zone: 'Zone A',
                    by: `${session.user} (${session.role})`,
                    dir: 'Damaged',
                  },
                  ...prev,
                ])
              }}
            />
          )}
          {currentNav.id === 'accounts' && (
            <Accounts
              expenses={expenses}
              role={session.role}
              userName={session.user}
              toast={showToast}
              onSaveExpense={(exp) => {
                setExpenses((prev) => {
                  const exists = prev.some((x) => x.id === exp.id)
                  return exists ? prev.map((x) => (x.id === exp.id ? exp : x)) : [exp, ...prev]
                })
              }}
              onDeleteExpense={(id) => {
                if (session.role !== 'Super Admin' || !window.confirm('Delete this expense? This cannot be undone.')) return
                setExpenses((prev) => prev.filter((x) => x.id !== id))
              }}
            />
          )}
          {currentNav.id === 'settings' && (
            <Settings syncState={syncState} setSyncState={setSyncState} toast={showToast} />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        data-frame="MobileBottomNav"
        className={`fixed inset-x-0 bottom-0 z-30 grid border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden ${
          isOperator ? 'grid-cols-4' : 'grid-cols-6'
        }`}
      >
        {visibleNav.map((n) => {
          const shortLabel =
            n.id === 'dashboard'
              ? 'Dashboard'
              : n.id === 'inbound'
              ? 'Inbound'
              : n.id === 'scan'
              ? 'Scanner'
              : n.id === 'damaged'
              ? 'Damage'
              : n.id === 'accounts'
              ? isOperator
                ? 'Petty Cash'
                : 'Ledger'
              : 'Sync'
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => setPage(n.id)}
              className="flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold cursor-pointer"
            >
              <span
                className={`grid h-7 w-11 place-items-center rounded-full transition-all duration-200 ${
                  currentNav.id === n.id
                    ? 'bg-primary-soft text-primary'
                    : 'text-muted active:bg-bg'
                }`}
              >
                <Icon name={n.icon} className="size-4" />
              </span>
              <span className={currentNav.id === n.id ? 'text-primary' : 'text-muted'}>
                {shortLabel}
              </span>
            </button>
          )
        })}
      </nav>

      {toast && <Toast key={toast.k} message={toast.m} onDone={clearToast} />}
    </div>
  )
}
