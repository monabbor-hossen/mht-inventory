'use client'

import { useEffect, useState } from 'react'
import { Button, Card, Field, Icon, Logo, Toast, inputCls } from '@/components/ui'
import { generateBarcodeSvg, generateTscCommand } from '@/lib/barcode'
import { ProductMasterView } from '@/presentation/components/ProductMasterView'
import { LocationView } from '@/presentation/components/LocationView'
import { CycleCountView } from '@/presentation/components/CycleCountView'
import { ThermalStickerModal } from '@/presentation/components/ThermalStickerModal'
import { FifoAlertModal } from '@/presentation/components/FifoAlertModal'

export type NavId =
  | 'dashboard'
  | 'inbound'
  | 'products'
  | 'locations'
  | 'scan'
  | 'cyclecount'
  | 'damaged'
  | 'accounts'
  | 'settings'
  | 'audit'

export type Lang = 'EN' | 'BN'

export const dict: Record<Lang, Record<string, string>> = {
  EN: {
    dashboard: 'Admin Dashboard',
    inbound: 'Inbound & Print',
    products: 'Product Master Entry',
    locations: 'Warehouse Locations & Bins',
    scan: 'Smart Scanner',
    cyclecount: 'Cycle Counting Audits',
    damaged: 'Damage & Return',
    accounts: 'Accounts & Ledger',
    settings: 'Offline Sync',
    audit: 'Activity & Audit',
    exportReport: 'Export Report (PDF/CSV)',
    totalStock: 'Total Stock (Bags)',
    dispatchedToday: 'Dispatched Today',
    expensesToday: 'Total Expense Today (BDT)',
    damagedStock: 'Damaged Stock',
    stockInVsOut: 'Stock In vs. Stock Out (Last 7 Days)',
    recentActivity: 'Recent Activity',
    lowStockAlerts: 'Low Stock Alerts',
    synced: 'Online',
    syncing: 'Syncing...',
    offline: 'Offline Mode',
    signOut: 'Sign out',
  },
  BN: {
    dashboard: 'অ্যাডমিন ড্যাশবোর্ড',
    inbound: 'ইনবাউন্ড ও প্রিন্ট',
    products: 'প্রোডাক্ট মাস্টার এন্ট্রি',
    locations: 'গুদাম লোকেশন ও বিন ট্র্যাকিং',
    scan: 'স্মার্ট স্ক্যানার',
    cyclecount: 'সাইকেল কাউন্ট অডিট',
    damaged: 'ড্যামেজ ও রিটার্ন',
    accounts: 'হিসাব ও লেজার',
    settings: 'অফলাইন সিঙ্ক',
    audit: 'কার্যক্রম ও অডিট',
    exportReport: 'রিপোর্ট এক্সপোর্ট (PDF/CSV)',
    totalStock: 'মোট মজুদ (বস্তা)',
    dispatchedToday: 'আজকের ডিসপ্যাচ',
    expensesToday: 'আজকের মোট খরচ (BDT)',
    damagedStock: 'ক্ষতিগ্রস্ত স্টক',
    stockInVsOut: 'স্টক ইন বনাম স্টক আউট (গত ৭ দিন)',
    recentActivity: 'সাম্প্রতিক কার্যক্রম',
    lowStockAlerts: 'স্বল্প মজুদ সতর্কতা',
    synced: 'অনলাইন',
    syncing: 'সিঙ্ক হচ্ছে...',
    offline: 'অফলাইন মোড',
    signOut: 'লগ আউট',
  },
}

export const navItems = [
  { id: 'dashboard', key: 'dashboard', icon: 'dashboard', frame: 'DashboardScreen', adminOrMgrOnly: true },
  { id: 'inbound', key: 'inbound', icon: 'inbound', frame: 'InboundScreen', adminOrMgrOnly: true },
  { id: 'products', key: 'products', icon: 'bag', frame: 'ProductMasterScreen', adminOrMgrOnly: true },
  { id: 'locations', key: 'locations', icon: 'zone', frame: 'LocationScreen', adminOrMgrOnly: true },
  { id: 'scan', key: 'scan', icon: 'scan', frame: 'ScanScreen', adminOrMgrOnly: false },
  { id: 'cyclecount', key: 'cyclecount', icon: 'check', frame: 'CycleCountScreen', adminOrMgrOnly: false },
  { id: 'damaged', key: 'damaged', icon: 'damaged', frame: 'DamageReturnScreen', adminOrMgrOnly: false },
  { id: 'accounts', key: 'accounts', icon: 'accounts', frame: 'AccountsScreen', adminOrMgrOnly: false },
  { id: 'settings', key: 'settings', icon: 'settings', frame: 'OfflineSyncScreen', adminOrMgrOnly: false },
  { id: 'audit', key: 'audit', icon: 'cloudCheck', frame: 'AuditTrailScreen', adminOrMgrOnly: true },
] as const

export default function Home() {
  const [page, setPage] = useState<NavId>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [role, setRole] = useState<'Super Admin' | 'Manager' | 'Operator'>('Super Admin')
  const [lang, setLang] = useState<Lang>('EN')
  const [syncState, setSyncState] = useState<'synced' | 'offline' | 'syncing'>('synced')
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' | 'warning' } | null>(null)
  const [loading, setLoading] = useState(false)

  // Dashboard Metrics
  const [stats, setStats] = useState({
    totalStock: 0,
    dispatchedToday: 0,
    expensesToday: 0,
    damagedStock: 0,
  })
  const [recentLogs, setRecentLogs] = useState<any[]>([])
  const [weeklyFlow, setWeeklyFlow] = useState<any[]>([])

  // Inbound Batches State
  const [batches, setBatches] = useState<any[]>([])
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null)
  const [previewBarcodes, setPreviewBarcodes] = useState<string[]>([])
  const [activeBarcode, setActiveBarcode] = useState<string>('')

  // Scanner State
  const [scanInput, setScanInput] = useState('')
  const [scanResult, setScanResult] = useState<any | null>(null)
  const [scanLoading, setScanLoading] = useState(false)
  const [fifoAlert, setFifoAlert] = useState<{
    attemptedBatch: string
    olderBatch: string
    barcodeString: string
  } | null>(null)
  const [thermalModalBarcode, setThermalModalBarcode] = useState<string | null>(null)

  // Modals
  const [showBlindModal, setShowBlindModal] = useState(false)
  const [showAdvanceModal, setShowAdvanceModal] = useState(false)
  const [showLateBindingModal, setShowLateBindingModal] = useState(false)
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)

  // Form states
  const [blindQty, setBlindQty] = useState(50)
  const [advSupplier, setAdvSupplier] = useState('')
  const [advCategory, setAdvCategory] = useState('Rice & Grain')
  const [advQty, setAdvQty] = useState(100)

  const [lateBatch, setLateBatch] = useState<any>(null)
  const [lateSupplier, setLateSupplier] = useState('')
  const [lateCategory, setLateCategory] = useState('Rice & Grain')

  const [adjustBatch, setAdjustBatch] = useState<any>(null)
  const [adjustDelta, setAdjustDelta] = useState(10)

  // Accounts & Ledger State
  const [expenses, setExpenses] = useState<any[]>([])
  const [expenseTotal, setExpenseTotal] = useState(0)
  const [expenseCatFilter, setExpenseCatFilter] = useState('All')
  const [newExpCat, setNewExpCat] = useState<'Labor' | 'Transport' | 'Utility' | 'Others'>('Labor')
  const [newExpAmount, setNewExpAmount] = useState('')
  const [newExpNote, setNewExpNote] = useState('')

  // Damages State
  const [damages, setDamages] = useState<any[]>([])

  // Date formatting
  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  const t = dict[lang] ?? dict.EN
  const isOperator = role === 'Operator'
  const visibleNav = isOperator
    ? navItems.filter((n) => !n.adminOrMgrOnly)
    : navItems
  const currentNav = visibleNav.find((n) => n.id === page) || visibleNav[0]

  const handleRoleChange = (nextRole: 'Super Admin' | 'Manager' | 'Operator') => {
    setRole(nextRole)
    if (nextRole === 'Operator' && (page === 'dashboard' || page === 'inbound')) {
      setPage('scan')
    }
    setToast({ message: `Switched active view to ${nextRole}`, tone: 'success' })
  }

  // Data fetching
  const refreshAllData = async () => {
    try {
      setLoading(true)
      const [dashRes, invRes, expRes, dmgRes] = await Promise.all([
        fetch('/api/dashboard').then((r) => r.json()),
        fetch('/api/inventory?limit=50').then((r) => r.json()),
        fetch('/api/expenses?limit=100').then((r) => r.json()),
        fetch('/api/damages?limit=50').then((r) => r.json()),
      ])

      if (dashRes.success && dashRes.data) {
        setStats({
          totalStock: dashRes.data.summary.totalStock || dashRes.data.summary.inStockBags || 0,
          dispatchedToday: dashRes.data.summary.dispatchedToday || 0,
          expensesToday: dashRes.data.summary.expensesToday || 0,
          damagedStock: dashRes.data.summary.damagedStock || 0,
        })
        setRecentLogs(dashRes.data.recentLogs || [])
        setWeeklyFlow(dashRes.data.weeklyFlow || [])
      }

      if (invRes.success && Array.isArray(invRes.data)) {
        setBatches(invRes.data)
      }

      if (expRes.success && Array.isArray(expRes.data)) {
        setExpenses(expRes.data)
        setExpenseTotal(expRes.totalAmount || 0)
      }

      if (dmgRes.success && Array.isArray(dmgRes.data)) {
        setDamages(dmgRes.data)
      }
    } catch (err: any) {
      console.error('Data refresh error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshAllData()
  }, [])

  // Inbound Handlers
  const handleBlindReceipt = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'blind', quantity: blindQty }),
      })
      const data = await res.json()
      if (data.success) {
        setToast({ message: `Quick blind receipt created: ${data.data.batch} (${data.data.totalQuantity} barcodes)`, tone: 'success' })
        setShowBlindModal(false)
        setPreviewBarcodes(data.data.barcodes || [])
        setActiveBarcode(data.data.barcodes?.[0] || data.data.batch)
        setSelectedBatch({ batch_number: data.data.batch, category: 'DRAFT Unassigned' })
        setShowPrintModal(true)
        refreshAllData()
      } else {
        setToast({ message: data.error || 'Failed to create blind receipt', tone: 'error' })
      }
    } catch (err: any) {
      setToast({ message: err.message, tone: 'error' })
    }
  }

  const handleAdvanceEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'advance',
          supplier_name: advSupplier,
          category: advCategory,
          quantity: advQty,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setToast({ message: `Advance entry batch ${data.data.batch} generated with ${data.data.totalQuantity} barcodes`, tone: 'success' })
        setShowAdvanceModal(false)
        setAdvSupplier('')
        setPreviewBarcodes(data.data.barcodes || [])
        setActiveBarcode(data.data.barcodes?.[0] || data.data.batch)
        setSelectedBatch({ batch_number: data.data.batch, category: advCategory })
        setShowPrintModal(true)
        refreshAllData()
      } else {
        setToast({ message: data.error || 'Failed to create advance entry', tone: 'error' })
      }
    } catch (err: any) {
      setToast({ message: err.message, tone: 'error' })
    }
  }

  const handleLateBinding = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lateBatch) return
    try {
      const res = await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: lateBatch.id,
          batch: lateBatch.batch_number,
          supplier: lateSupplier,
          category: lateCategory,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setToast({ message: `Metadata successfully bound to ${lateBatch.batch_number}`, tone: 'success' })
        setShowLateBindingModal(false)
        refreshAllData()
      } else {
        setToast({ message: data.error || 'Failed to bind metadata', tone: 'error' })
      }
    } catch (err: any) {
      setToast({ message: err.message, tone: 'error' })
    }
  }

  const handleAdjustBatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adjustBatch) return
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'adjust',
          batchId: adjustBatch.id,
          delta: adjustDelta,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setToast({ message: `Batch ${adjustBatch.batch_number} adjusted successfully`, tone: 'success' })
        setShowAdjustModal(false)
        refreshAllData()
      } else {
        setToast({ message: data.error || 'Failed to adjust batch', tone: 'error' })
      }
    } catch (err: any) {
      setToast({ message: err.message, tone: 'error' })
    }
  }

  // Scanner Dispatch Handler with strict FIFO validation feedback
  const handleScanSubmit = async (e?: React.FormEvent, override = false) => {
    if (e) e.preventDefault()
    const code = scanInput.trim()
    if (!code) return
    setScanLoading(true)
    setScanResult(null)
    try {
      const res = await fetch('/api/scan/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: code, override_fifo: override }),
      })
      const data = await res.json()
      setScanResult(data)
      if (data.success) {
        setToast({ message: `Dispatched: ${code}`, tone: 'success' })
        setScanInput('')
        setFifoAlert(null)
        refreshAllData()
      } else if (data.code === 'FIFO_VIOLATION') {
        setFifoAlert({
          attemptedBatch: data.attemptedBatchNumber,
          olderBatch: data.olderBatchNumber,
          barcodeString: code,
        })
        setToast({ message: data.error, tone: 'error' })
      } else {
        setToast({ message: data.error || 'Scan dispatch rejected', tone: 'error' })
      }
    } catch (err: any) {
      setToast({ message: err.message, tone: 'error' })
    } finally {
      setScanLoading(false)
    }
  }

  // Expense Handler
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    const amountNum = parseFloat(newExpAmount)
    if (!amountNum || amountNum <= 0) {
      setToast({ message: 'Please enter a valid expense amount', tone: 'error' })
      return
    }
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newExpCat,
          amount: amountNum,
          note: newExpNote,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setToast({ message: `Expense voucher ${data.data.voucherNo} recorded (৳${amountNum})`, tone: 'success' })
        setShowExpenseModal(false)
        setNewExpAmount('')
        setNewExpNote('')
        refreshAllData()
      } else {
        setToast({ message: data.error || 'Failed to record expense', tone: 'error' })
      }
    } catch (err: any) {
      setToast({ message: err.message, tone: 'error' })
    }
  }

  const filteredExpenses = expenseCatFilter === 'All'
    ? expenses
    : expenses.filter((e) => (e.category || e.cat) === expenseCatFilter)

  return (
    <div className="flex min-h-screen bg-bg text-ink">
      {/* Toast Notification */}
      {toast && <Toast message={toast.message} tone={toast.tone} onDone={() => setToast(null)} />}

      {/* ======================================================== */}
      {/* WEB & TABLET COLLAPSIBLE LEFT SIDEBAR (SAME TO SAME FIGMA) */}
      {/* ======================================================== */}
      <aside
        data-frame="SidebarNavigation"
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-surface p-3 transition-all duration-200 md:flex ${
          sidebarCollapsed ? 'w-20 items-center' : 'w-64'
        }`}
      >
        {/* Top Header in Sidebar */}
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

        {/* Role View Badge (Expanded Only) */}
        {!sidebarCollapsed && (
          <div className="mt-2 rounded-xl border border-line bg-bg px-3 py-2 text-[11px]">
            <div className="font-bold text-primary">{role} View</div>
            <div className="text-muted">
              {role === 'Super Admin'
                ? 'Full Analytics, Export & Delete'
                : role === 'Manager'
                ? 'Stock & Ledger · No Delete'
                : 'Mobile Scanner & Petty Expense'}
            </div>
          </div>
        )}

        {/* Sidebar Nav Items */}
        <nav className="mt-4 flex w-full flex-col gap-1">
          {visibleNav.map((n) => {
            const active = currentNav.id === n.id
            const label =
              isOperator && n.id === 'accounts'
                ? lang === 'BN' ? 'পেটি ক্যাশ' : 'Petty Expense'
                : t[n.key]
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => setPage(n.id as any)}
                title={label}
                className={`group flex h-11 w-full items-center gap-3 rounded-full px-3.5 text-sm font-semibold transition-all duration-150 cursor-pointer ${
                  active
                    ? 'bg-primary-soft text-primary shadow-2xs'
                    : 'text-muted hover:bg-bg hover:text-ink'
                } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon name={n.icon} className="size-5 shrink-0" />
                {!sidebarCollapsed && <span className="truncate">{label}</span>}
                {!sidebarCollapsed && n.id === 'damaged' && damages.length > 0 && (
                  <span className="ml-auto rounded-full bg-error-soft px-2 py-0.5 font-mono text-[10px] font-bold text-error">
                    {damages.length}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Bottom Section in Sidebar */}
        <div className="mt-auto flex w-full flex-col gap-2 border-t border-line pt-3">
          {!sidebarCollapsed && (
            <div className="rounded-xl bg-bg px-3 py-2 text-[11px] text-muted">
              <div className="font-mono font-bold text-ink">Frame: {currentNav.frame}</div>
              <div>1,500 sq ft · Auto Layout</div>
            </div>
          )}
          <button
            type="button"
            onClick={() => setToast({ message: 'Session locked / Sign out', tone: 'warning' })}
            className={`flex h-10 w-full items-center gap-3 rounded-full px-3.5 text-sm font-medium text-muted transition-colors hover:bg-error-soft hover:text-error cursor-pointer ${
              sidebarCollapsed ? 'justify-center px-0' : ''
            }`}
          >
            <Icon name="logout" className="size-5 shrink-0" />
            {!sidebarCollapsed && <span>{t.signOut}</span>}
          </button>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* MAIN CONTENT AREA */}
      {/* ======================================================== */}
      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-8">
        {/* Top App Bar (Same to Same Figma TopAppBar) */}
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
                ? lang === 'BN' ? 'পেটি ক্যাশ খরচ যোগ করুন' : 'Add Petty Expense'
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
                value={role}
                onChange={(e) => handleRoleChange(e.target.value as any)}
                className="h-9 rounded-full border border-line bg-bg pl-3 pr-7 text-xs font-bold text-ink outline-none transition-colors hover:border-primary/40 cursor-pointer"
              >
                <option value="Super Admin">Role: Super Admin</option>
                <option value="Manager">Role: Manager</option>
                <option value="Operator">Role: Operator (Mobile)</option>
              </select>
            </div>

            {/* Export Report (PDF/CSV) Dropdown Button */}
            {role === 'Super Admin' && (
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
                  <div className="absolute right-0 top-full z-40 mt-2 w-52 rounded-2xl border border-line bg-surface p-1.5 shadow-xl">
                    <a
                      href="/api/reports?type=expenses&format=csv"
                      download
                      onClick={() => setExportMenuOpen(false)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-ink hover:bg-bg cursor-pointer"
                    >
                      <span>Download Ledger CSV</span>
                      <span className="rounded bg-primary-soft px-1.5 py-0.5 font-mono text-[10px] text-primary">
                        .CSV
                      </span>
                    </a>
                    <a
                      href="/api/reports?type=inbound&format=csv"
                      download
                      onClick={() => setExportMenuOpen(false)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-ink hover:bg-bg cursor-pointer"
                    >
                      <span>Download Inbound CSV</span>
                      <span className="rounded bg-accent-soft px-1.5 py-0.5 font-mono text-[10px] text-accent">
                        .CSV
                      </span>
                    </a>
                    <a
                      href="/api/reports?type=valuation&format=csv"
                      download
                      onClick={() => setExportMenuOpen(false)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-ink hover:bg-bg cursor-pointer"
                    >
                      <span>Inventory Valuation</span>
                      <span className="rounded bg-primary-soft px-1.5 py-0.5 font-mono text-[10px] text-primary">
                        .CSV
                      </span>
                    </a>
                    <a
                      href="/api/reports?type=movements&format=csv"
                      download
                      onClick={() => setExportMenuOpen(false)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-ink hover:bg-bg cursor-pointer"
                    >
                      <span>Movement History</span>
                      <span className="rounded bg-accent-soft px-1.5 py-0.5 font-mono text-[10px] text-accent">
                        .CSV
                      </span>
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Persistent Global Indicator: "Online" (Green dot) or "Offline Mode" (Red slash) */}
            <button
              type="button"
              onClick={() => {
                setSyncState((prev) => (prev === 'synced' ? 'offline' : prev === 'offline' ? 'syncing' : 'synced'))
              }}
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

            {/* Refresh Button */}
            <button
              type="button"
              onClick={refreshAllData}
              disabled={loading}
              className="grid size-9 place-items-center rounded-full border border-line bg-bg text-muted hover:text-ink cursor-pointer"
              title="Refresh Data"
            >
              <Icon name="sync" className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="p-4 sm:p-6">
          {/* ======================================================== */}
          {/* VIEW 1: DASHBOARD */}
          {/* ======================================================== */}
          {page === 'dashboard' && (
            <div className="space-y-6">
              {/* Metric KPI Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted">TOTAL SACKS IN STOCK</span>
                    <span className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary">
                      <Icon name="bag" className="size-5" />
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold tracking-tight text-ink">{stats.totalStock}</span>
                    <span className="text-xs font-medium text-muted">Bags</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">Real-time synchronized warehouse stock</p>
                </Card>

                <Card className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted">DISPATCHED TODAY</span>
                    <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
                      <Icon name="truck" className="size-5" />
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold tracking-tight text-ink">{stats.dispatchedToday}</span>
                    <span className="text-xs font-medium text-muted">Bags</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">Outbound scans logged today</p>
                </Card>

                <Card className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted">EXPENSES TODAY</span>
                    <span className="grid size-9 place-items-center rounded-xl bg-amber-50 text-accent">
                      <Icon name="wallet" className="size-5" />
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold tracking-tight text-ink">৳{stats.expensesToday.toLocaleString()}</span>
                    <span className="text-xs font-medium text-muted">BDT</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">Petty cash & warehouse spending</p>
                </Card>

                <Card className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted">DAMAGED STOCK</span>
                    <span className="grid size-9 place-items-center rounded-xl bg-red-50 text-error">
                      <Icon name="alert" className="size-5" />
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold tracking-tight text-ink">{stats.damagedStock}</span>
                    <span className="text-xs font-medium text-muted">Sacks</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">Torn, moisture & shortage records</p>
                </Card>
              </div>

              {/* Quick Operation Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted">Quick Operations:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="filled"
                    iconName="print"
                    showIcon
                    label="Quick Blind Receipt"
                    onClick={() => setShowBlindModal(true)}
                  />
                  <Button
                    variant="outlined"
                    iconName="plus"
                    showIcon
                    label="Advance Pre-Entry"
                    onClick={() => setShowAdvanceModal(true)}
                  />
                  <Button
                    variant="tonal"
                    iconName="wallet"
                    showIcon
                    label="Log Expense"
                    onClick={() => setShowExpenseModal(true)}
                  />
                  <Button
                    variant="outlined"
                    iconName="scan"
                    showIcon
                    label="Scan & Dispatch"
                    onClick={() => setPage('scan')}
                  />
                </div>
              </div>

              {/* 2-Column Grid: Flow & Audit */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="p-5 lg:col-span-1">
                  <h2 className="text-sm font-bold text-ink">7-Day Warehouse Flow</h2>
                  <p className="mt-1 text-xs text-muted">Inbound vs Outbound bag volume</p>
                  <div className="mt-6 space-y-4">
                    {weeklyFlow.map((day, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-ink">{day.day}</span>
                          <span className="text-muted">In: {day.inbound || day.stockIn || 0} | Out: {day.outbound || day.stockOut || 0}</span>
                        </div>
                        <div className="flex h-2.5 overflow-hidden rounded-full bg-bg">
                          <div
                            className="bg-primary"
                            style={{ width: `${Math.min(100, ((day.inbound || day.stockIn || 0) / 80) * 100)}%` }}
                          />
                          <div
                            className="bg-accent"
                            style={{ width: `${Math.min(100, ((day.outbound || day.stockOut || 0) / 80) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-5 lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-ink">Warehouse Audit Trail</h2>
                      <p className="mt-1 text-xs text-muted">Real-time movement logs</p>
                    </div>
                    <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary">
                      Live
                    </span>
                  </div>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-line text-muted">
                          <th className="pb-2 font-semibold">Action</th>
                          <th className="pb-2 font-semibold">Target</th>
                          <th className="pb-2 font-semibold">Details</th>
                          <th className="pb-2 font-semibold">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/60">
                        {recentLogs.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-muted">
                              No recent logs recorded yet
                            </td>
                          </tr>
                        ) : (
                          recentLogs.slice(0, 6).map((log) => (
                            <tr key={log.id} className="hover:bg-bg/60">
                              <td className="py-2.5">
                                <span
                                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                    log.action === 'CREATE'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : log.action === 'SCAN'
                                      ? 'bg-blue-100 text-blue-800'
                                      : log.action === 'UPDATE'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {log.action}
                                </span>
                              </td>
                              <td className="py-2.5 font-medium text-ink">{log.target_entity}</td>
                              <td className="py-2.5 text-muted max-w-xs truncate">{log.description}</td>
                              <td className="py-2.5 text-muted whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 2: INBOUND */}
          {/* ======================================================== */}
          {page === 'inbound' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-ink">Inbound Batches & Barcode Generation</h2>
                  <p className="text-xs text-muted">Support for Blind Receipt, Advance Entry, and TSC Thermal Printing</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="filled"
                    iconName="print"
                    showIcon
                    label="Quick Blind Receipt"
                    onClick={() => setShowBlindModal(true)}
                  />
                  <Button
                    variant="outlined"
                    iconName="plus"
                    showIcon
                    label="Advance Pre-Entry"
                    onClick={() => setShowAdvanceModal(true)}
                  />
                </div>
              </div>

              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-line bg-bg/70 text-muted">
                      <tr>
                        <th className="p-3.5 font-semibold">Batch Number</th>
                        <th className="p-3.5 font-semibold">Supplier</th>
                        <th className="p-3.5 font-semibold">Category</th>
                        <th className="p-3.5 font-semibold">Total Sacks</th>
                        <th className="p-3.5 font-semibold">Status</th>
                        <th className="p-3.5 font-semibold">Created Date</th>
                        <th className="p-3.5 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60">
                      {batches.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-muted">
                            No inbound batches created yet. Click "Quick Blind Receipt" to create one.
                          </td>
                        </tr>
                      ) : (
                        batches.map((b) => (
                          <tr key={b.id} className="hover:bg-bg/40">
                            <td className="p-3.5 font-bold text-ink">{b.batch_number}</td>
                            <td className="p-3.5 text-ink">{b.supplier_name || <span className="italic text-muted">Pending Binding</span>}</td>
                            <td className="p-3.5 text-muted">{b.category || 'General'}</td>
                            <td className="p-3.5 font-semibold text-ink">{b.total_quantity} Bags</td>
                            <td className="p-3.5">
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                  b.status === 'COMPLETED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {b.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-muted">{new Date(b.created_at).toLocaleDateString()}</td>
                            <td className="p-3.5 text-right space-x-1">
                              {b.status === 'DRAFT' && (
                                <button
                                  onClick={() => {
                                    setLateBatch(b)
                                    setLateSupplier('')
                                    setLateCategory('Rice & Grain')
                                    setShowLateBindingModal(true)
                                  }}
                                  className="rounded-lg bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-[#cbe7e2] cursor-pointer"
                                >
                                  Complete Details
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setAdjustBatch(b)
                                  setAdjustDelta(10)
                                  setShowAdjustModal(true)
                                }}
                                className="rounded-lg border border-line bg-surface px-2.5 py-1 text-[11px] font-semibold text-ink hover:bg-bg cursor-pointer"
                              >
                                Adjust (+/-)
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedBatch(b)
                                  const count = Math.min(b.total_quantity || 10, 20)
                                  const dummy = Array.from({ length: count }, (_, i) => `${b.batch_number}-${String(i + 1).padStart(4, '0')}`)
                                  setPreviewBarcodes(dummy)
                                  setActiveBarcode(dummy[0])
                                  setShowPrintModal(true)
                                }}
                                className="rounded-lg border border-line bg-surface px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-bg cursor-pointer"
                              >
                                Print Barcode
                              </button>
                              <button
                                onClick={() => {
                                  const code = b.barcodes?.[0]?.barcode_string || `${b.batch_number}-0001`
                                  setThermalModalBarcode(code)
                                }}
                                className="rounded-lg border border-primary/30 bg-primary-soft/50 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary-soft cursor-pointer"
                              >
                                Thermal Label (TSC/Zebra)
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: PRODUCT MASTER ENTRY */}
          {/* ======================================================== */}
          {page === 'products' && (
            <ProductMasterView onToast={(msg, tone) => setToast({ message: msg, tone })} />
          )}

          {/* ======================================================== */}
          {/* VIEW: WAREHOUSE LOCATIONS & BINS */}
          {/* ======================================================== */}
          {page === 'locations' && (
            <LocationView onToast={(msg, tone) => setToast({ message: msg, tone })} />
          )}

          {/* ======================================================== */}
          {/* VIEW 3: SCANNER & DISPATCH (WEB SIMULATOR & CAMERA) */}
          {/* ======================================================== */}
          {page === 'scan' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-ink">Barcode Scanner & Outbound Dispatch</h2>
                <p className="text-xs text-muted">Scan or enter serialized bag barcode to validate stock status and FIFO sequence</p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card className="p-5">
                  <h3 className="text-sm font-bold text-ink">Dispatch Barcode Entry</h3>
                  <form onSubmit={handleScanSubmit} className="mt-4 space-y-4">
                    <Field label="Barcode String">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. B-261026-2615-0002"
                          value={scanInput}
                          onChange={(e) => setScanInput(e.target.value)}
                          className={inputCls()}
                          autoFocus
                          required
                        />
                        <Button
                          variant="filled"
                          type="submit"
                          loading={scanLoading}
                          label="Dispatch"
                        />
                      </div>
                    </Field>
                    <p className="text-[11px] text-muted">
                      Accepts USB handheld 1D/2D scanners, camera scan, or manual entry. Checks status IN_STOCK and rejects duplicate dispatches.
                    </p>
                  </form>

                  {/* Scan Result Feedback */}
                  {scanResult && (
                    <div className={`mt-4 rounded-xl border p-4 text-xs ${
                      scanResult.success ? 'border-success/40 bg-emerald-50 text-emerald-900' : 'border-error/40 bg-red-50 text-red-900'
                    }`}>
                      <div className="font-bold">{scanResult.message || (scanResult.success ? 'Scan Successful' : 'Scan Failed')}</div>
                      {scanResult.error && <p className="mt-1">{scanResult.error}</p>}
                      {scanResult.data && (
                        <div className="mt-2 font-mono">
                          <div>Barcode: {scanResult.data.barcode_string}</div>
                          <div>Status: {scanResult.data.status}</div>
                          <div>Dispatched At: {scanResult.data.dispatched_at}</div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>

                {/* Recent Dispatches */}
                <Card className="p-5">
                  <h3 className="text-sm font-bold text-ink">Recent Outbound Dispatches</h3>
                  <div className="mt-4 space-y-2">
                    {recentLogs.filter((l) => l.action === 'SCAN').length === 0 ? (
                      <p className="py-6 text-center text-xs text-muted">No outbound dispatches logged yet today</p>
                    ) : (
                      recentLogs.filter((l) => l.action === 'SCAN').slice(0, 5).map((l) => (
                        <div key={l.id} className="flex items-center justify-between rounded-xl border border-line bg-bg p-3 text-xs">
                          <div>
                            <span className="font-bold text-ink">{l.target_entity}</span>
                            <p className="text-[11px] text-muted">{l.description}</p>
                          </div>
                          <span className="font-mono text-[10px] text-muted">
                            {new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: CYCLE COUNTING & AUDITS */}
          {/* ======================================================== */}
          {page === 'cyclecount' && (
            <CycleCountView onToast={(msg, tone) => setToast({ message: msg, tone })} />
          )}

          {/* ======================================================== */}
          {/* VIEW 4: DAMAGED STOCK */}
          {/* ======================================================== */}
          {page === 'damaged' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-ink">Damage Return & Quality Assurance</h2>
                  <p className="text-xs text-muted">Audit records of bags flagged with Torn, Moisture, or Shortage</p>
                </div>
                <a
                  href="/api/reports?type=damages&format=csv"
                  download
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-xs font-semibold text-ink hover:bg-bg cursor-pointer"
                >
                  <Icon name="download" className="size-4" />
                  Export Damages CSV
                </a>
              </div>

              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-line bg-bg/70 text-muted">
                      <tr>
                        <th className="p-3.5 font-semibold">Damage ID</th>
                        <th className="p-3.5 font-semibold">Barcode String</th>
                        <th className="p-3.5 font-semibold">Batch</th>
                        <th className="p-3.5 font-semibold">Reason</th>
                        <th className="p-3.5 font-semibold">Logged By</th>
                        <th className="p-3.5 font-semibold">Date</th>
                        <th className="p-3.5 font-semibold text-right">Photo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60">
                      {damages.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-muted">
                            No damaged stock records found.
                          </td>
                        </tr>
                      ) : (
                        damages.map((dmg) => (
                          <tr key={dmg.id} className="hover:bg-bg/40">
                            <td className="p-3.5 font-bold text-ink">{dmg.id}</td>
                            <td className="p-3.5 font-mono text-ink">{dmg.barcode}</td>
                            <td className="p-3.5 text-muted">{dmg.batch}</td>
                            <td className="p-3.5">
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
                                {dmg.reason}
                              </span>
                            </td>
                            <td className="p-3.5 text-ink">{dmg.by || 'Staff'}</td>
                            <td className="p-3.5 text-muted">{dmg.date}</td>
                            <td className="p-3.5 text-right">
                              {dmg.photoUrl ? (
                                <a href={dmg.photoUrl} target="_blank" rel="noreferrer" className="text-primary underline">
                                  View Photo
                                </a>
                              ) : (
                                <span className="text-muted">No photo</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 5: ACCOUNTS & LEDGER */}
          {/* ======================================================== */}
          {page === 'accounts' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-ink">Warehouse Accounts & Daily Expense Ledger</h2>
                  <p className="text-xs text-muted">Petty cash tracking with real-time audit ledger</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="filled"
                    iconName="plus"
                    showIcon
                    label="Log Daily Expense"
                    onClick={() => setShowExpenseModal(true)}
                  />
                  <a
                    href="/api/reports?type=expenses&format=csv"
                    download
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-xs font-semibold text-ink hover:bg-bg cursor-pointer"
                  >
                    <Icon name="download" className="size-4" />
                    Export CSV
                  </a>
                </div>
              </div>

              {/* Filter and Summary Banner */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card className="p-4 sm:col-span-1">
                  <span className="text-xs font-semibold text-muted">TOTAL PERIOD EXPENSES</span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-ink">৳{expenseTotal.toLocaleString()}</span>
                    <span className="text-xs text-muted">BDT</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">Calculated for filtered records</p>
                </Card>

                <Card className="p-4 sm:col-span-2 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold text-muted">FILTER BY CATEGORY</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {['All', 'Labor', 'Transport', 'Utility', 'Others'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setExpenseCatFilter(cat)}
                          className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                            expenseCatFilter === cat
                              ? 'bg-primary text-white'
                              : 'border border-line bg-bg text-muted hover:text-ink'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Expenses Table */}
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-line bg-bg/70 text-muted">
                      <tr>
                        <th className="p-3.5 font-semibold">Voucher #</th>
                        <th className="p-3.5 font-semibold">Category</th>
                        <th className="p-3.5 font-semibold">Amount (BDT)</th>
                        <th className="p-3.5 font-semibold">Note / Description</th>
                        <th className="p-3.5 font-semibold">Logged By</th>
                        <th className="p-3.5 font-semibold">Date & Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60">
                      {filteredExpenses.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-muted">
                            No expenses found. Click "Log Daily Expense" to add a new transaction.
                          </td>
                        </tr>
                      ) : (
                        filteredExpenses.map((exp) => (
                          <tr key={exp.id} className="hover:bg-bg/40">
                            <td className="p-3.5 font-bold text-ink">{exp.voucherNo || `VCH-${exp.id}`}</td>
                            <td className="p-3.5">
                              <span
                                className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                  (exp.category || exp.cat) === 'Labor'
                                    ? 'bg-orange-100 text-orange-800'
                                    : (exp.category || exp.cat) === 'Transport'
                                    ? 'bg-blue-100 text-blue-800'
                                    : (exp.category || exp.cat) === 'Utility'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {exp.category || exp.cat}
                              </span>
                            </td>
                            <td className="p-3.5 font-bold text-ink">৳{Number(exp.amount).toLocaleString()}</td>
                            <td className="p-3.5 text-muted max-w-sm truncate">{exp.note}</td>
                            <td className="p-3.5 text-ink">{exp.enteredBy || 'Staff'}</td>
                            <td className="p-3.5 text-muted">{exp.date} {exp.time}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 6: OFFLINE SYNC & AUDIT TRAIL (MATCHING FIGMA) */}
          {/* ======================================================== */}
          {(page === 'settings' || page === 'audit') && (
            <div data-frame="OfflineSyncScreen" className="flex flex-col gap-6">
              {/* Sync Dashboard & Network Status */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="flex flex-col justify-between p-6">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold text-ink">
                          {lang === 'BN' ? 'অফলাইন সিঙ্ক ও নেটওয়ার্ক অবস্থা' : 'Offline Sync & Network Status'}
                        </h2>
                        <p className="text-xs text-muted">
                          {lang === 'BN'
                            ? 'ওয়াই-ফাই ড্রপ হলে ১৫০০ বর্গফুট গুদামের জন্য লোকাল বাফার সক্রিয় থাকে'
                            : 'Local SQLite queue for 1,500 sq ft warehouse floor when Wi-Fi drops'}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-bold ${
                          syncState === 'synced'
                            ? 'bg-success-soft text-success'
                            : syncState === 'syncing'
                            ? 'bg-accent-soft text-accent'
                            : 'bg-error-soft text-error'
                        }`}
                      >
                        {syncState === 'synced' ? (
                          <>
                            <span className="size-2.5 rounded-full bg-success" />
                            {t.synced}
                          </>
                        ) : syncState === 'syncing' ? (
                          <>
                            <Icon name="sync" className="size-3.5 animate-spin text-accent" />
                            {t.syncing}
                          </>
                        ) : (
                          <>
                            <Icon name="cloudOff" className="size-3.5 text-error" />
                            {t.offline}
                          </>
                        )}
                      </span>
                    </div>

                    {/* Network Switcher */}
                    <div className="mt-5 flex items-center justify-between rounded-2xl border border-line bg-bg p-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`grid size-10 place-items-center rounded-xl ${
                            syncState === 'synced' ? 'bg-success-soft text-success' : 'bg-error-soft text-error'
                          }`}
                        >
                          <Icon name={syncState === 'synced' ? 'cloudCheck' : 'cloudOff'} className="size-5" />
                        </span>
                        <div>
                          <div className="text-sm font-bold text-ink">
                            Status:{' '}
                            <span className={syncState === 'synced' ? 'text-success' : 'text-error'}>
                              {syncState === 'synced' ? 'Online (Green Dot)' : 'Offline Mode (Red Slash)'}
                            </span>
                          </div>
                          <div className="text-xs text-muted">
                            {syncState === 'synced'
                              ? 'Connected to MHT Cloud Sync Engine'
                              : 'Local storage buffer active — queuing scans & expenses'}
                          </div>
                        </div>
                      </div>

                      <div className="inline-flex rounded-xl border border-line bg-surface p-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSyncState('synced')
                            setToast({ message: 'Online mode activated', tone: 'success' })
                          }}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                            syncState === 'synced' ? 'bg-success text-white' : 'text-muted hover:text-ink'
                          }`}
                        >
                          Online
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSyncState('offline')
                            setToast({ message: 'Offline simulation mode activated', tone: 'warning' })
                          }}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                            syncState === 'offline' ? 'bg-error text-white' : 'text-muted hover:text-ink'
                          }`}
                        >
                          Offline
                        </button>
                      </div>
                    </div>

                    {/* Pending Data Queue Banner */}
                    <div className="mt-4 flex items-center justify-between rounded-2xl border border-accent/35 bg-accent-soft/55 p-4">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-accent">
                          Pending Local Data Queue
                        </div>
                        <div className="mt-1 text-base font-bold text-ink">
                          {syncState === 'offline'
                            ? '12 Scans Pending · 2 Expenses Pending'
                            : '0 Scans Pending · All data synchronized'}
                        </div>
                      </div>
                      <span className="rounded-xl bg-white px-3 py-1.5 font-mono text-sm font-bold text-accent shadow-2xs">
                        {syncState === 'offline' ? '12 Scans' : 'Synced'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center gap-3">
                    <Button
                      variant="filled"
                      iconName="cloudSync"
                      showIcon
                      label="Force Sync to Cloud"
                      onClick={() => {
                        setSyncState('syncing')
                        setToast({ message: 'Syncing local buffer to MHT MySQL Cloud...', tone: 'success' })
                        setTimeout(() => {
                          setSyncState('synced')
                          setToast({ message: 'Force Sync complete: All movements & ledger vouchers synced', tone: 'success' })
                        }, 900)
                      }}
                      className="flex-1"
                    />
                    <Button
                      variant="outlined"
                      iconName="sync"
                      showIcon
                      label="Refresh"
                      onClick={refreshAllData}
                    />
                  </div>
                </Card>

                {/* System Diagnostics & Storage Card */}
                <Card className="flex flex-col justify-between p-6">
                  <div>
                    <h2 className="text-lg font-bold text-ink">
                      {lang === 'BN' ? 'সিস্টেম স্টোরেজ ও ডায়াগনস্টিকস' : 'System Storage & Diagnostics'}
                    </h2>
                    <p className="text-xs text-muted">
                      Warehouse Node · MariaDB/MySQL Connection Pool · Next.js REST API
                    </p>

                    <div className="mt-5 space-y-3">
                      <div className="flex items-center justify-between rounded-xl border border-line bg-bg p-3 text-xs">
                        <span className="text-muted">Database Engine:</span>
                        <span className="font-mono font-bold text-ink">MySQL 8.0 (XAMPP Port 3306)</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-line bg-bg p-3 text-xs">
                        <span className="text-muted">ORM & Client:</span>
                        <span className="font-mono font-bold text-primary">Prisma Client v6.19.3</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-line bg-bg p-3 text-xs">
                        <span className="text-muted">Thermal Printer Mode:</span>
                        <span className="font-mono font-bold text-ink">TSPL / TSC TE244 Direct</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-line bg-bg p-3 text-xs">
                        <span className="text-muted">Active Role View:</span>
                        <span className="font-bold text-primary">{role}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="text-[11px] text-muted">
                      MHT Inventory WMS · 1,500 sq ft Tejgaon Central Warehouse · Clean Architecture
                    </div>
                  </div>
                </Card>
              </div>

              {/* Audit Trail & Event Logs */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-ink">
                      {lang === 'BN' ? 'সিস্টেম অডিট ট্রেইল ও ইভেন্ট লগ' : 'System Audit Trail & Event Logs'}
                    </h2>
                    <p className="text-xs text-muted">
                      Every transaction, barcode creation, damage report, and scan event across all devices
                    </p>
                  </div>
                  <Button
                    variant="outlined"
                    iconName="sync"
                    showIcon
                    label="Refresh Logs"
                    onClick={refreshAllData}
                  />
                </div>

                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-line bg-bg/70 text-muted">
                        <tr>
                          <th className="p-3.5 font-semibold">Event ID</th>
                          <th className="p-3.5 font-semibold">Action</th>
                          <th className="p-3.5 font-semibold">Target Entity</th>
                          <th className="p-3.5 font-semibold">Description</th>
                          <th className="p-3.5 font-semibold">User</th>
                          <th className="p-3.5 font-semibold">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/60">
                        {recentLogs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-muted">
                              No audit trail events recorded.
                            </td>
                          </tr>
                        ) : (
                          recentLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-bg/40">
                              <td className="p-3.5 font-mono text-muted">#{log.id}</td>
                              <td className="p-3.5">
                                <span
                                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                    log.action === 'CREATE'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : log.action === 'SCAN'
                                      ? 'bg-blue-100 text-blue-800'
                                      : log.action === 'UPDATE'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {log.action}
                                </span>
                              </td>
                              <td className="p-3.5 font-bold text-ink">{log.target_entity}</td>
                              <td className="p-3.5 text-muted">{log.description}</td>
                              <td className="p-3.5 text-ink">{log.user?.name || 'Staff'}</td>
                              <td className="p-3.5 text-muted whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ======================================================== */}
      {/* MOBILE BOTTOM NAVIGATION BAR (MATCHING FIGMA) */}
      {/* ======================================================== */}
      <nav
        data-frame="MobileBottomNav"
        className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-line bg-surface/95 px-2 py-1 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {visibleNav.map((n) => {
          const active = currentNav.id === n.id
          const shortLabel =
            n.id === 'dashboard'
              ? lang === 'BN' ? 'ড্যাশবোর্ড' : 'Dashboard'
              : n.id === 'inbound'
              ? lang === 'BN' ? 'ইনবাউন্ড' : 'Inbound'
              : n.id === 'scan'
              ? lang === 'BN' ? 'স্ক্যানার' : 'Scanner'
              : n.id === 'damaged'
              ? lang === 'BN' ? 'ড্যামেজ' : 'Damage'
              : n.id === 'accounts'
              ? isOperator
                ? lang === 'BN' ? 'পেটি ক্যাশ' : 'Petty Cash'
                : lang === 'BN' ? 'লেজার' : 'Ledger'
              : lang === 'BN' ? 'সিঙ্ক' : 'Sync'
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => setPage(n.id as any)}
              className="flex flex-col items-center gap-0.5 py-1.5 text-[10px] font-semibold cursor-pointer"
            >
              <span
                className={`grid h-7 w-11 place-items-center rounded-full transition-all duration-200 ${
                  active ? 'bg-primary-soft text-primary' : 'text-muted active:bg-bg'
                }`}
              >
                <Icon name={n.icon} className="size-4" />
              </span>
              <span className={active ? 'text-primary font-bold' : 'text-muted'}>
                {shortLabel}
              </span>
            </button>
          )
        })}
      </nav>

      {/* ======================================================== */}
      {/* MODALS: BLIND, ADVANCE, LATE BINDING, ADJUST, TSC PRINT */}
      {/* ======================================================== */}
      {showBlindModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-primary-soft text-primary">
                  <Icon name="print" className="size-4" />
                </span>
                <h3 className="text-base font-bold text-ink">Quick Blind Receipt</h3>
              </div>
              <button onClick={() => setShowBlindModal(false)} className="rounded-full p-1 text-muted hover:text-ink cursor-pointer">
                <Icon name="x" className="size-4" />
              </button>
            </div>
            <form onSubmit={handleBlindReceipt} className="mt-4 space-y-4">
              <p className="text-xs text-muted">
                Input only the arriving quantity. The system generates a temporary batch with DRAFT status and prints ready barcodes. Missing details can be bound later.
              </p>
              <Field label="Quantity (Number of Sacks)">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={blindQty}
                  onChange={(e) => setBlindQty(parseInt(e.target.value, 10) || 1)}
                  className={inputCls()}
                  required
                />
              </Field>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outlined" type="button" onClick={() => setShowBlindModal(false)}>
                  Cancel
                </Button>
                <Button variant="filled" type="submit" label="Generate Barcodes & Print" />
              </div>
            </form>
          </Card>
        </div>
      )}

      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-primary-soft text-primary">
                  <Icon name="plus" className="size-4" />
                </span>
                <h3 className="text-base font-bold text-ink">Advance Pre-Planned Entry</h3>
              </div>
              <button onClick={() => setShowAdvanceModal(false)} className="rounded-full p-1 text-muted hover:text-ink cursor-pointer">
                <Icon name="x" className="size-4" />
              </button>
            </div>
            <form onSubmit={handleAdvanceEntry} className="mt-4 space-y-4">
              <Field label="Supplier Name">
                <input
                  type="text"
                  placeholder="e.g. Apex Agro Mills Ltd."
                  value={advSupplier}
                  onChange={(e) => setAdvSupplier(e.target.value)}
                  className={inputCls()}
                  required
                />
              </Field>
              <Field label="Product Category">
                <select
                  value={advCategory}
                  onChange={(e) => setAdvCategory(e.target.value)}
                  className={inputCls()}
                >
                  <option value="Rice & Grain">Rice & Grain</option>
                  <option value="Wheat & Flour">Wheat & Flour</option>
                  <option value="Pulses & Lentils">Pulses & Lentils</option>
                  <option value="Sugar & Sweeteners">Sugar & Sweeteners</option>
                  <option value="General Cargo">General Cargo</option>
                </select>
              </Field>
              <Field label="Quantity (Number of Sacks)">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={advQty}
                  onChange={(e) => setAdvQty(parseInt(e.target.value, 10) || 1)}
                  className={inputCls()}
                  required
                />
              </Field>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outlined" type="button" onClick={() => setShowAdvanceModal(false)}>
                  Cancel
                </Button>
                <Button variant="filled" type="submit" label="Create Batch & Barcodes" />
              </div>
            </form>
          </Card>
        </div>
      )}

      {showLateBindingModal && lateBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink">Late Metadata Binding</h3>
              <button onClick={() => setShowLateBindingModal(false)} className="rounded-full p-1 text-muted hover:text-ink cursor-pointer">
                <Icon name="x" className="size-4" />
              </button>
            </div>
            <form onSubmit={handleLateBinding} className="mt-4 space-y-4">
              <p className="text-xs text-muted">
                Assign supplier and category details to draft batch <strong className="text-ink">{lateBatch.batch_number}</strong> to promote it to COMPLETED.
              </p>
              <Field label="Supplier Name">
                <input
                  type="text"
                  placeholder="e.g. Meghna Grain Trading"
                  value={lateSupplier}
                  onChange={(e) => setLateSupplier(e.target.value)}
                  className={inputCls()}
                  required
                />
              </Field>
              <Field label="Product Category">
                <select
                  value={lateCategory}
                  onChange={(e) => setLateCategory(e.target.value)}
                  className={inputCls()}
                >
                  <option value="Rice & Grain">Rice & Grain</option>
                  <option value="Wheat & Flour">Wheat & Flour</option>
                  <option value="Pulses & Lentils">Pulses & Lentils</option>
                  <option value="Sugar & Sweeteners">Sugar & Sweeteners</option>
                  <option value="General Cargo">General Cargo</option>
                </select>
              </Field>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outlined" type="button" onClick={() => setShowLateBindingModal(false)}>
                  Cancel
                </Button>
                <Button variant="filled" type="submit" label="Save & Promote to Completed" />
              </div>
            </form>
          </Card>
        </div>
      )}

      {showAdjustModal && adjustBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink">Adjust Batch Barcodes</h3>
              <button onClick={() => setShowAdjustModal(false)} className="rounded-full p-1 text-muted hover:text-ink cursor-pointer">
                <Icon name="x" className="size-4" />
              </button>
            </div>
            <form onSubmit={handleAdjustBatch} className="mt-4 space-y-4">
              <p className="text-xs text-muted">
                Adjust batch <strong className="text-ink">{adjustBatch.batch_number}</strong> (current: {adjustBatch.total_quantity} bags).
                Enter positive numbers to add extra printed barcodes, or negative numbers to void excess barcodes.
              </p>
              <Field label="Delta (+Add or -Void bags)">
                <input
                  type="number"
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(parseInt(e.target.value, 10) || 0)}
                  className={inputCls()}
                  required
                />
              </Field>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outlined" type="button" onClick={() => setShowAdjustModal(false)}>
                  Cancel
                </Button>
                <Button variant="filled" type="submit" label="Apply Adjustment" />
              </div>
            </form>
          </Card>
        </div>
      )}

      {showPrintModal && selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-lg p-6">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-primary-soft text-primary">
                  <Icon name="print" className="size-4" />
                </span>
                <h3 className="text-base font-bold text-ink">TSC Thermal Barcode Print</h3>
              </div>
              <button onClick={() => setShowPrintModal(false)} className="rounded-full p-1 text-muted hover:text-ink cursor-pointer">
                <Icon name="x" className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-white p-6 shadow-xs">
                <span className="text-[11px] font-bold tracking-widest text-muted uppercase">MHT WAREHOUSE LABEL</span>
                <div
                  className="mt-3 flex justify-center w-full"
                  dangerouslySetInnerHTML={{
                    __html: generateBarcodeSvg(activeBarcode || selectedBatch.batch_number),
                  }}
                />
                <span className="mt-2 text-xs font-semibold text-ink">
                  {selectedBatch.category || 'General'} | NET WT 25 KG
                </span>
              </div>

              {previewBarcodes.length > 1 && (
                <div>
                  <span className="text-xs font-semibold text-muted">Select serialized bag item:</span>
                  <div className="mt-1.5 flex max-h-24 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-line p-2">
                    {previewBarcodes.map((code) => (
                      <button
                        key={code}
                        onClick={() => setActiveBarcode(code)}
                        className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-medium transition-colors cursor-pointer ${
                          activeBarcode === code ? 'bg-primary text-white' : 'bg-bg text-ink hover:bg-line'
                        }`}
                      >
                        {code.slice(-9)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="text-xs font-semibold text-muted">TSC TSPL Direct Printer Command:</span>
                <pre className="mt-1 max-h-24 overflow-x-auto rounded-xl bg-slate-900 p-2.5 font-mono text-[10px] text-emerald-400">
                  {generateTscCommand(
                    activeBarcode || selectedBatch.batch_number,
                    selectedBatch.batch_number,
                    selectedBatch.category || 'Commodity'
                  )}
                </pre>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outlined"
                  label="Copy TSPL Command"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      generateTscCommand(
                        activeBarcode || selectedBatch.batch_number,
                        selectedBatch.batch_number,
                        selectedBatch.category || 'Commodity'
                      )
                    )
                    setToast({ message: 'TSC TSPL command copied to clipboard', tone: 'success' })
                  }}
                />
                <Button
                  variant="filled"
                  iconName="print"
                  showIcon
                  label="Print Label Now"
                  onClick={() => {
                    window.print()
                  }}
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink">Log Warehouse Expense</h3>
              <button onClick={() => setShowExpenseModal(false)} className="rounded-full p-1 text-muted hover:text-ink cursor-pointer">
                <Icon name="x" className="size-4" />
              </button>
            </div>
            <form onSubmit={handleAddExpense} className="mt-4 space-y-4">
              <Field label="Category">
                <select
                  value={newExpCat}
                  onChange={(e) => setNewExpCat(e.target.value as any)}
                  className={inputCls()}
                >
                  <option value="Labor">Labor (Loading / Unloading)</option>
                  <option value="Transport">Transport (Trucks & Fuel)</option>
                  <option value="Utility">Utility (Electricity & Water)</option>
                  <option value="Others">Others (Warehouse Supplies)</option>
                </select>
              </Field>
              <Field label="Amount in BDT (৳)">
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="e.g. 3500"
                  value={newExpAmount}
                  onChange={(e) => setNewExpAmount(e.target.value)}
                  className={inputCls()}
                  required
                />
              </Field>
              <Field label="Description / Voucher Note">
                <input
                  type="text"
                  placeholder="e.g. Unloading fee for 250 bags rice"
                  value={newExpNote}
                  onChange={(e) => setNewExpNote(e.target.value)}
                  className={inputCls()}
                  required
                />
              </Field>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outlined" type="button" onClick={() => setShowExpenseModal(false)}>
                  Cancel
                </Button>
                <Button variant="filled" type="submit" label="Save Expense" />
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* FIFO Domain Error Violation Modal */}
      {fifoAlert && (
        <FifoAlertModal
          attemptedBatch={fifoAlert.attemptedBatch}
          olderBatch={fifoAlert.olderBatch}
          barcodeString={fifoAlert.barcodeString}
          canOverride={role === 'Super Admin' || role === 'Manager'}
          onOverride={() => {
            handleScanSubmit(undefined, true)
            setFifoAlert(null)
          }}
          onClose={() => setFifoAlert(null)}
        />
      )}

      {/* Thermal Sticker 1D/2D Barcode Preview & Direct TSPL/ZPL Printer Modal */}
      {thermalModalBarcode && (
        <ThermalStickerModal
          barcodeString={thermalModalBarcode}
          onClose={() => setThermalModalBarcode(null)}
          onToast={(msg, tone) => setToast({ message: msg, tone })}
        />
      )}
    </div>
  )
}

