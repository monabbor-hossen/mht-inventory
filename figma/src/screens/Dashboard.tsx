import { useState } from 'react'
import { Button, Card, Icon, SearchField } from '../components/ui'
import { localDateKey, scanDateKey, stockSummary, weeklyFlow } from '../warehouse'
import {
  dict,
  initialDamages,
  initialExpenses,
  initialScans,
  type DamageItem,
  type ExpenseItem,
  type Lang,
  type ScanItem,
  type ScanStatus,
  type UserRole,
} from '../data'

const lowStockBatches = [
  { id: 'B-2610-118', name: 'Miniket Premium 25 Kg', zone: 'Zone A', left: 18, cap: 200 },
  { id: 'B-2610-097', name: 'Nazirshail Special 50 Kg', zone: 'Floor-1', left: 26, cap: 250 },
  { id: 'B-2609-221', name: 'Basmati Royal 25 Kg', zone: 'Zone B', left: 32, cap: 200 },
]

export default function Dashboard({
  scans = initialScans,
  damages = initialDamages,
  expenses = initialExpenses,
  lang = 'EN',
  role = 'Super Admin',
  onDeleteScan,
  onNavigate = () => {},
}: {
  scans?: ScanItem[]
  damages?: DamageItem[]
  expenses?: ExpenseItem[]
  lang?: Lang
  role?: UserRole
  onDeleteScan?: (key: string) => void
  onNavigate?: (page: 'inbound' | 'damaged' | 'scan' | 'accounts') => void
}) {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<'All' | ScanStatus>('All')
  const [query, setQuery] = useState('')
  const t = dict[lang] ?? dict.EN

  const safeScans = Array.isArray(scans) ? scans : initialScans
  const safeDamages = Array.isArray(damages) ? damages : initialDamages
  const safeExpenses = Array.isArray(expenses) ? expenses : initialExpenses

  const totalDamagedBags = safeDamages.reduce((sum, d) => sum + (d.bags || 0), 0)
  const todayIso = localDateKey()
  const todayExpenseTotal = safeExpenses
    .filter((e) => e.date === todayIso)
    .reduce((sum, e) => sum + (e.amount || 0), 0)
  const totals = stockSummary(safeScans)
  const dispatchedCount = stockSummary(
    safeScans.filter((s) => scanDateKey(s.date) === todayIso),
  ).dispatched
  const inboundCount = totals.received - totals.dispatched - totals.damaged
  const stockChart7Days = weeklyFlow(safeScans)

  const stats = [
    {
      id: 'total-stock',
      label: t.totalStock,
      value: `${inboundCount.toLocaleString('en-IN')} Bags`,
      delta: 'Net recorded flow · excludes unrecorded opening stock',
      icon: 'bag',
      tone: 'bg-primary-soft text-primary',
      onClick: () => onNavigate('inbound'),
    },
    {
      id: 'dispatched-today',
      label: t.dispatchedToday,
      value: `${dispatchedCount.toLocaleString('en-IN')} Bags`,
      delta: 'Zone A & Zone B outbound docks',
      icon: 'truck',
      tone: 'bg-success-soft text-success',
      onClick: () => onNavigate('scan'),
    },
    {
      id: 'expenses-today',
      label: t.expensesToday,
      value: `৳${todayExpenseTotal.toLocaleString('en-IN')} BDT`,
      delta: `${safeExpenses.filter((e) => e.date === todayIso).length} vouchers logged today`,
      icon: 'wallet',
      tone: 'bg-accent-soft text-accent',
      onClick: () => onNavigate('accounts'),
    },
    {
      id: 'damaged-stock',
      label: t.damagedStock,
      value: `${totalDamagedBags} Bags`,
      delta: `${safeDamages.length} quarantined return lots`,
      icon: 'damaged',
      tone: 'bg-error-soft text-error',
      onClick: () => onNavigate('damaged'),
    },
  ]

  const maxChartVal = Math.max(...stockChart7Days.flatMap((d) => [d.stockIn, d.stockOut]), 800)
  const filteredScans = safeScans.filter((s) =>
    (statusFilter === 'All' || s.dir === statusFilter) &&
    [s.batch, s.product, s.zone, s.by].join(' ').toLowerCase().includes(query.trim().toLowerCase()),
  )

  const statusBadge = (dir: ScanStatus) => {
    if (dir === 'In') return 'bg-success-soft text-success'
    if (dir === 'Damaged') return 'bg-error-soft text-error'
    return 'bg-primary-soft text-primary'
  }

  return (
    <div data-frame="DashboardScreen" className="flex flex-col gap-6">
      <Card frameName="WarehouseOverview" className="flex flex-wrap items-center justify-between gap-4 border-primary/20 bg-primary-soft p-5">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-primary">Warehouse control center</div>
          <div className="mt-1 text-xl font-bold text-ink">A clearer view of every movement.</div>
          <p className="mt-1 text-sm text-muted">Prototype session · sample records · changes reset on reload. No hardware or cloud connection.</p>
        </div>
        <Button onClick={() => onNavigate('inbound')} showIcon iconName="plus">Receive stock</Button>
      </Card>
      {/* Hero Stat Cards (Top Row) — Hover elevates card and intensifies shadow */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.id}
            onClick={s.onClick}
            data-frame="HeroStatCard"
            className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-5 transition-all duration-200 hover:-translate-y-1.5 hover:border-primary/35 hover:shadow-xl hover:shadow-ink/10 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                {s.label}
              </span>
              <span className={`grid size-10 place-items-center rounded-xl ${s.tone}`}>
                <Icon name={s.icon} className="size-5" />
              </span>
            </div>
            <div className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {s.value}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted">
              <span>{s.delta}</span>
              <Icon name="chevron" className="size-3.5 opacity-60" />
            </div>
          </div>
        ))}
      </div>

      {/* Visual Chart (Stock In vs. Stock Out - Last 7 Days) + Low Stock Alerts */}
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card frameName="StockInOutChartCard" className="flex flex-col justify-between p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-ink">{t.stockInVsOut}</h2>
              <p className="text-xs text-muted">
                1,500 sq ft warehouse daily bag flow · Hover over any bar for exact numbers
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-xs bg-primary" /> Stock In (Bags)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-xs bg-accent" /> Stock Out (Bags)
              </span>
            </div>
          </div>

          <div className="relative mt-6 grid h-56 grid-cols-7 items-end gap-2 border-b border-line px-2 pb-2 pt-8 sm:gap-4">
            {[0.25, 0.5, 0.75, 1].map((r) => (
              <div
                key={r}
                className="pointer-events-none absolute inset-x-0 border-t border-dashed border-line/75"
                style={{ bottom: `${r * 80}%` }}
              >
                <span className="absolute -top-2.5 left-0 bg-surface pr-1 font-mono text-[10px] text-muted/70">
                  {Math.round(maxChartVal * r)}
                </span>
              </div>
            ))}

            {stockChart7Days.map((item, idx) => {
              const inHeight = Math.round((item.stockIn / maxChartVal) * 100)
              const outHeight = Math.round((item.stockOut / maxChartVal) * 100)
              const isHovered = hoveredDay === idx
              return (
                <div
                  key={item.day}
                  onMouseEnter={() => setHoveredDay(idx)}
                  onMouseLeave={() => setHoveredDay(null)}
                  onClick={() => setHoveredDay(idx === hoveredDay ? null : idx)}
                  className="group relative z-10 flex h-full flex-col items-center justify-end cursor-pointer"
                >
                  {isHovered && (
                    <div className="anim-fade pointer-events-none absolute -top-14 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-xl bg-ink px-3 py-2 text-xs text-white shadow-xl">
                      <div className="font-semibold text-white/80">
                        {item.day} · {item.date}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 font-mono">
                        <span className="text-emerald-300">
                          Stock In: {item.stockIn.toLocaleString()}
                        </span>
                        <span>|</span>
                        <span className="text-amber-300">
                          Stock Out: {item.stockOut.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex h-[82%] w-full max-w-[48px] items-end justify-center gap-1 sm:gap-1.5">
                    <div
                      style={{ height: `${inHeight}%` }}
                      className={`w-1/2 rounded-t-md bg-primary transition-all duration-200 ${
                        isHovered ? 'scale-y-[1.03] brightness-110 shadow-md' : 'opacity-90'
                      }`}
                    />
                    <div
                      style={{ height: `${outHeight}%` }}
                      className={`w-1/2 rounded-t-md bg-accent transition-all duration-200 ${
                        isHovered ? 'scale-y-[1.03] brightness-105 shadow-md' : 'opacity-90'
                      }`}
                    />
                  </div>
                  <div
                    className={`mt-2 text-xs font-bold ${
                      isHovered ? 'text-primary' : 'text-ink'
                    }`}
                  >
                    {item.day}
                  </div>
                  <div className="font-mono text-[10px] text-muted">{item.date}</div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Low Stock Alerts (#FF9800 Secondary Orange) */}
        <Card frameName="LowStockCard" className="flex flex-col justify-between p-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-accent-soft text-accent">
                <Icon name="alert" className="size-4" />
              </span>
              <h2 className="font-bold text-ink">{t.lowStockAlerts}</h2>
              <span className="ml-auto rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-white">
                {lowStockBatches.length}
              </span>
            </div>
            <p className="mt-3 text-xs text-muted">Illustrative reorder watchlist — not calculated from the activity ledger.</p>
            <div className="mt-4 flex flex-col gap-3">
              {lowStockBatches.map((b) => (
                <div
                  key={b.id}
                  className="rounded-xl border border-accent/25 bg-accent-soft/50 p-3.5 transition-all hover:bg-accent-soft"
                >
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-ink">{b.name}</span>
                    <span className="font-bold text-accent">{b.left} bags</span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between font-mono text-xs text-muted">
                    <span>
                      {b.id} · {b.zone}
                    </span>
                    <span>Min: {b.cap}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${(b.left / b.cap) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('inbound')}
            className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary-soft text-xs font-semibold text-primary transition-colors hover:bg-[#cbe7e2] cursor-pointer"
          >
            <Icon name="inbound" className="size-4" /> Receive Stock & Print Stickers
          </button>
        </Card>
      </div>

      {/* Recent Activity Table: Date & Time | Batch ID | Bag Weight | Location/Zone | Status (In/Out/Damaged) | User */}
      <Card frameName="RecentActivityTable" className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="font-bold text-ink">{t.recentActivity}</h2>
            <p className="text-xs text-muted">
              Columns: Date & Time · Batch ID · Bag Weight · Location/Zone · Status · User
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(['All', 'In', 'Out', 'Damaged'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-primary text-white'
                    : 'bg-bg text-muted hover:text-ink'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3">
          <SearchField value={query} onChange={setQuery} />
          <span className="text-xs text-muted" role="status">{filteredScans.length} matching movements</span>
          {(query || statusFilter !== 'All') && <Button variant="text" onClick={() => { setQuery(''); setStatusFilter('All') }}>Clear filters</Button>}
        </div>
        <div className="max-h-[380px] overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="sticky top-0 z-10 border-b border-line bg-surface text-left text-xs uppercase tracking-wider text-muted shadow-[0_1px_0_rgba(0,0,0,0.04)]">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Date & Time</th>
                <th className="px-5 py-3.5 font-semibold">Batch ID</th>
                <th className="px-5 py-3.5 font-semibold">Bag Weight</th>
                <th className="px-5 py-3.5 font-semibold">Location / Zone</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold">User</th>
                {role === 'Super Admin' && (
                  <th className="px-5 py-3.5 text-right font-semibold">Action</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredScans.length === 0 && (
                <tr><td colSpan={role === 'Super Admin' ? 7 : 6} className="px-5 py-10 text-center text-sm text-muted">No movements match. Try another batch, product, zone or team member.</td></tr>
              )}
              {filteredScans.map((s) => (
                <tr
                  key={s.key}
                  className="anim-fade border-b border-line/70 last:border-0 transition-colors hover:bg-bg"
                >
                  <td className="px-5 py-3.5 font-mono text-xs text-muted">
                    {s.date || '24 Oct 2026'} · {s.time}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-ink">{s.batch}</span>
                      <span className="rounded bg-bg px-2 py-0.5 text-xs text-muted">
                        {s.product} ({s.bags} bags)
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs font-semibold text-ink">
                    {s.weight || '25 Kg'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 rounded-lg border border-line bg-bg px-2.5 py-0.5 font-mono text-xs font-semibold text-ink">
                      <Icon name="zone" className="size-3 text-primary" />
                      {s.zone || 'Zone A'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${statusBadge(
                        s.dir
                      )}`}
                    >
                      <span className="size-1.5 rounded-full bg-current" />
                      {s.dir}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-ink">{s.by}</td>
                  {role === 'Super Admin' && (
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => onDeleteScan?.(s.key)}
                        title="Delete entry (Super Admin right)"
                        className="inline-flex size-7 items-center justify-center rounded-lg text-muted hover:bg-error-soft hover:text-error cursor-pointer"
                      >
                        <Icon name="trash" className="size-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
