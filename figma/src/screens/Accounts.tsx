import { useMemo, useRef, useState } from 'react'
import { Button, Card, Field, Icon, inputCls } from '../components/ui'
import {
  daysAgo,
  expenseCategoryMeta,
  initialExpenses,
  iso,
  now,
  type ExpenseCategory,
  type ExpenseItem,
  type UserRole,
} from '../data'

const cats: ExpenseCategory[] = [
  'Transport/Freight',
  'Labor/Wages',
  'Office & Utility',
  'Food/Others',
]

const filters = {
  Today: 0,
  'This Week': 6,
  'This Month': 30,
} as const
type FilterRange = keyof typeof filters

export default function Accounts({
  expenses = initialExpenses,
  role = 'Super Admin',
  userName = 'Mahmudul H.',
  onSaveExpense = () => {},
  onDeleteExpense = () => {},
  toast = () => {},
}: {
  expenses?: ExpenseItem[]
  role?: UserRole
  userName?: string
  onSaveExpense?: (exp: ExpenseItem) => void
  onDeleteExpense?: (id: number) => void
  toast?: (m: string) => void
}) {
  const safeExpenses = Array.isArray(expenses) ? expenses : initialExpenses
  const isOperator = role === 'Operator'
  const canDelete = role === 'Super Admin'

  const [activeTab, setActiveTab] = useState<'Add Expense' | 'Expense Ledger'>(
    isOperator ? 'Add Expense' : 'Expense Ledger'
  )
  const [filter, setFilter] = useState<FilterRange>('This Week')
  const [swipedLeftId, setSwipedLeftId] = useState<number | null>(null)
  const pointerStartX = useRef<number | null>(null)

  const filteredList = useMemo(
    () =>
      safeExpenses
        .filter((e) => e.date >= daysAgo(filters[filter]))
        .sort((a, b) => (a.date < b.date ? 1 : b.amount - a.amount)),
    [safeExpenses, filter]
  )

  const totalPeriod = filteredList.reduce((sum, e) => sum + e.amount, 0)

  const handleSave = (payload: Omit<ExpenseItem, 'id' | 'voucherNo' | 'enteredBy'>) => {
    const created: ExpenseItem = {
      id: Date.now(),
      voucherNo: `VCH-2610-${String(safeExpenses.length + 1).padStart(2, '0')}`,
      enteredBy: `${userName} (${role})`,
      ...payload,
    }
    onSaveExpense(created)
    toast(`৳${created.amount.toLocaleString('en-IN')} BDT saved to Expense Ledger`)
    if (!isOperator) {
      setActiveTab('Expense Ledger')
    }
  }

  return (
    <div data-frame="AccountsScreen" className="flex flex-col gap-5">
      {/* Top Tabs: "Add Expense" | "Expense Ledger" + Role Permission Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div
          className="inline-grid grid-cols-2 rounded-2xl border border-line bg-surface p-1 shadow-2xs"
          role="tablist"
        >
          {(['Add Expense', 'Expense Ledger'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-primary text-white shadow-2xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <Icon name={tab === 'Add Expense' ? 'plus' : 'accounts'} className="size-4" />
              <span>{isOperator && tab === 'Add Expense' ? 'Add Petty Expense' : tab}</span>
              {isOperator && tab === 'Expense Ledger' && (
                <Icon name="lock" className="size-3.5 opacity-75" />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold ${
              canDelete
                ? 'bg-success-soft text-success'
                : 'bg-accent-soft text-accent'
            }`}
          >
            <Icon name="lock" className="size-3.5" />
            {role === 'Super Admin'
              ? 'Super Admin: Swipe Left to Delete Enabled'
              : role === 'Manager'
              ? 'Manager: View & Add Only (No Delete Rights)'
              : 'Operator: Petty Expense Entry Only (Analytics Hidden)'}
          </span>
        </div>
      </div>

      {/* Main Content Area: Master-Detail on Desktop when viewing Ledger, or Petty Cash Form for Operator */}
      {isOperator && activeTab === 'Expense Ledger' ? (
        <Card frameName="OperatorRestrictedCard" className="mx-auto max-w-lg p-8 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent">
            <Icon name="lock" className="size-7" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-ink">
            Financial Ledger Restricted for Operator Role
          </h3>
          <p className="mt-1.5 text-sm text-muted">
            Operators on mobile are limited to Outbound Barcode Scanning and Adding Petty Expenses.
            Switch role to <strong>Manager</strong> or <strong>Super Admin</strong> in the top bar
            to inspect financial analytics and the full Expense Ledger.
          </p>
          <Button
            type="button"
            onClick={() => setActiveTab('Add Expense')}
            className="mt-5 h-11"
          >
            Go to Add Petty Expense
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_400px]">
          {/* Expense Ledger Table Column */}
          <div className={activeTab === 'Add Expense' ? 'hidden lg:block' : 'block'}>
            <Card frameName="ExpenseLedgerTableCard" className="overflow-hidden">
              {/* Filter Chips at top: "Today", "This Week", "This Month" */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line p-5">
                <div>
                  <h2 className="text-base font-bold text-ink">Expense Ledger</h2>
                  <p className="text-xs text-muted">
                    Swipe left on a row (or click the swipe button) to reveal Delete action
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(Object.keys(filters) as FilterRange[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFilter(f)}
                      className={`flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                        filter === f
                          ? 'border-primary bg-primary text-white shadow-xs'
                          : 'border-line bg-bg text-muted hover:text-ink'
                      }`}
                    >
                      {filter === f && <Icon name="check" className="size-3.5" />}
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ledger Table Columns: Date | Category | Note | Entered By | Amount */}
              <div key={filter} className="anim-smart-scale overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="border-b border-line bg-bg/70 text-left text-xs uppercase tracking-wider text-muted">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Category</th>
                      <th className="px-4 py-3 font-semibold">Note</th>
                      <th className="px-4 py-3 font-semibold">Entered By</th>
                      <th className="px-4 py-3 text-right font-semibold">Amount (BDT)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredList.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-10 text-center text-sm text-muted">
                          No expenses recorded for "{filter}".
                        </td>
                      </tr>
                    )}
                    {filteredList.map((e, i) => {
                      const meta = expenseCategoryMeta[e.cat] || expenseCategoryMeta['Food/Others']
                      const isSwipedLeft = swipedLeftId === e.id
                      return (
                        <tr
                          key={e.id}
                          data-frame="ExpenseCard"
                          onPointerDown={(ev) => {
                            pointerStartX.current = ev.clientX
                          }}
                          onPointerUp={(ev) => {
                            if (pointerStartX.current === null) return
                            const deltaX = ev.clientX - pointerStartX.current
                            // Swipe left (deltaX < -30) reveals right-side Delete action
                            if (deltaX < -30) setSwipedLeftId(e.id)
                            else if (deltaX > 25 && isSwipedLeft) setSwipedLeftId(null)
                            pointerStartX.current = null
                          }}
                          style={{ animationDelay: `${i * 35}ms` }}
                          className="anim-fade relative overflow-hidden bg-surface transition-colors hover:bg-bg/70"
                        >
                          <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-muted">
                            {new Date(e.date).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${meta.tone}`}
                            >
                              <Icon name={meta.icon} className="size-3.5" />
                              {e.cat}
                            </span>
                          </td>
                          <td className="max-w-[230px] truncate px-4 py-3.5 font-medium text-ink">
                            {e.note}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted">
                            {e.enteredBy}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-right">
                            <div className="inline-flex items-center justify-end gap-2">
                              <span className="font-mono text-sm font-bold text-ink">
                                ৳{e.amount.toLocaleString('en-IN')}
                              </span>

                              {/* Swipe-Left Trigger & Revealed Red Delete Button (for Admin only) */}
                              {!isSwipedLeft ? (
                                <button
                                  type="button"
                                  onClick={() => setSwipedLeftId(e.id)}
                                  title="Swipe left to reveal Delete"
                                  className="grid size-7 place-items-center rounded-lg border border-line bg-bg text-muted hover:text-ink cursor-pointer"
                                >
                                  <Icon name="chevron" className="size-3.5 rotate-180" />
                                </button>
                              ) : canDelete ? (
                                <div className="anim-scale inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onDeleteExpense(e.id)
                                      setSwipedLeftId(null)
                                      toast(`Deleted voucher ${e.voucherNo}`)
                                    }}
                                    className="inline-flex h-8 items-center gap-1 rounded-lg bg-error px-3 text-xs font-bold text-white shadow-sm hover:brightness-95 cursor-pointer"
                                  >
                                    <Icon name="trash" className="size-3.5" /> Delete
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setSwipedLeftId(null)}
                                    className="grid size-7 place-items-center rounded-lg text-muted hover:bg-bg cursor-pointer"
                                  >
                                    <Icon name="x" className="size-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span
                                  onClick={() => setSwipedLeftId(null)}
                                  className="anim-scale inline-flex items-center gap-1 rounded-lg bg-accent-soft px-2.5 py-1 text-[11px] font-bold text-accent cursor-pointer"
                                >
                                  <Icon name="lock" className="size-3" /> Admin Only
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary Footer Card */}
              <div className="flex items-center justify-between border-t-2 border-primary/20 bg-primary-soft/45 px-5 py-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-primary">
                    Total Expense for Selected Period ({filter})
                  </div>
                  <div className="text-xs text-muted">
                    {filteredList.length} entries in 1,500 sq ft warehouse ledger
                  </div>
                </div>
                <div key={totalPeriod} className="anim-fade font-mono text-2xl font-bold text-primary">
                  ৳{totalPeriod.toLocaleString('en-IN')} BDT
                </div>
              </div>
            </Card>
          </div>

          {/* Add Expense Form Column */}
          <div className={activeTab === 'Expense Ledger' && !isOperator ? 'hidden lg:block' : 'block'}>
            <Card frameName="AddExpenseFormCard" className="p-6">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-ink">
                  {isOperator ? 'Add Petty Expense (Operator)' : 'Add Expense'}
                </h2>
                <p className="text-xs text-muted">
                  Select an icon category, enter amount in BDT, date, and description
                </p>
              </div>
              <ExpenseForm onSave={handleSave} />
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

function ExpenseForm({
  onSave,
}: {
  onSave: (e: Omit<ExpenseItem, 'id' | 'voucherNo' | 'enteredBy'>) => void
}) {
  const [cat, setCat] = useState<ExpenseCategory>('Transport/Freight')
  const [catDropdownOpen, setCatDropdownOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(iso(new Date()))
  const [note, setNote] = useState('')
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [showKeypad, setShowKeypad] = useState(false)
  const [err, setErr] = useState<Record<string, string>>({})

  const currentMeta = expenseCategoryMeta[cat]

  const submit = () => {
    const e: Record<string, string> = {}
    if (!(Number(amount) > 0)) e.amount = 'Enter a valid amount in BDT (> 0)'
    if (!note.trim()) e.note = 'Add Notes/Description for this expense'
    setErr(e)
    if (Object.keys(e).length) return
    onSave({
      cat,
      amount: Number(amount),
      date,
      time: now(),
      note: note.trim(),
    })
    setAmount('')
    setNote('')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Expense Category Dropdown with Specific Icons: [Car] Transport/Freight, [Hardhat] Labor/Wages, [Bulb] Office & Utility, [Coffee] Food/Others */}
      <Field label="Expense Category (Dropdown with Icons)">
        <div className="relative">
          <button
            type="button"
            onClick={() => setCatDropdownOpen((o) => !o)}
            className={`${inputCls()} flex items-center justify-between text-left font-semibold cursor-pointer ${
              catDropdownOpen ? 'border-primary ring-4 ring-primary/15' : ''
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className={`grid size-7 place-items-center rounded-lg border ${currentMeta.tone}`}>
                <Icon name={currentMeta.icon} className="size-4" />
              </span>
              <span className="text-ink">{cat}</span>
            </span>
            <Icon
              name="chevron"
              className={`size-4 text-muted transition-transform ${
                catDropdownOpen ? '-rotate-90' : 'rotate-90'
              }`}
            />
          </button>

          {catDropdownOpen && (
            <div className="anim-scale absolute inset-x-0 top-full z-30 mt-1.5 rounded-2xl border border-line bg-surface p-1.5 shadow-xl">
              {cats.map((c) => {
                const m = expenseCategoryMeta[c]
                const active = cat === c
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCat(c)
                      setCatDropdownOpen(false)
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors cursor-pointer ${
                      active ? 'bg-primary-soft text-primary' : 'text-ink hover:bg-bg'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className={`grid size-8 place-items-center rounded-lg border ${m.tone}`}>
                        <Icon name={m.icon} className="size-4" />
                      </span>
                      <span>{c}</span>
                    </span>
                    {active && <Icon name="check" className="size-4 text-primary" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </Field>

      {/* Amount in BDT (Numeric keypad on mobile) */}
      <Field label="Amount in BDT" error={err.amount}>
        <div className="relative">
          <span className="absolute left-3.5 top-3 font-mono font-bold text-muted">৳</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className={`${inputCls(!!err.amount)} pl-8 pr-20 font-mono text-lg font-bold`}
            placeholder="0"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value.replace(/[^\d.]/g, ''))
              setErr((x) => ({ ...x, amount: '' }))
            }}
          />
          <button
            type="button"
            onClick={() => setShowKeypad((k) => !k)}
            className="absolute right-2 top-2 h-8 rounded-lg bg-bg px-2.5 font-mono text-xs font-semibold text-primary hover:bg-primary-soft cursor-pointer"
          >
            {showKeypad ? 'Hide Pad' : 'Keypad'}
          </button>
        </div>

        {/* Simulated Mobile Numeric Keypad */}
        {showKeypad && (
          <div className="anim-fade mt-2 grid grid-cols-3 gap-1.5 rounded-2xl border border-line bg-bg p-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '⌫'].map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setErr((x) => ({ ...x, amount: '' }))
                  if (k === '⌫') setAmount((a) => a.slice(0, -1))
                  else setAmount((a) => (a + k).slice(0, 8))
                }}
                className="h-10 rounded-xl bg-surface font-mono text-sm font-bold text-ink shadow-2xs active:scale-95 hover:bg-primary-soft hover:text-primary cursor-pointer"
              >
                {k}
              </button>
            ))}
          </div>
        )}
      </Field>

      {/* Date Picker */}
      <Field label="Date Picker">
        <div className="relative">
          <button
            type="button"
            onClick={() => setCalendarOpen((o) => !o)}
            className={`${inputCls()} flex items-center justify-between text-left font-medium cursor-pointer ${
              calendarOpen ? 'border-primary ring-4 ring-primary/15' : ''
            }`}
          >
            <span>
              {new Date(date).toLocaleDateString('en-GB', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <Icon name="calendar" className="size-4 text-primary" />
          </button>

          {calendarOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-ink/40 md:hidden"
                onClick={() => setCalendarOpen(false)}
              />
              <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-surface p-6 shadow-2xl anim-sheet md:absolute md:inset-auto md:left-0 md:top-full md:mt-2 md:w-76 md:rounded-2xl md:border md:border-line md:p-4 md:anim-scale">
                <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line md:hidden" />
                <DatePicker
                  value={date}
                  onPick={(d) => {
                    setDate(d)
                    setCalendarOpen(false)
                  }}
                />
              </div>
            </>
          )}
        </div>
      </Field>

      {/* Notes/Description (Text area) */}
      <Field label="Notes / Description" error={err.note}>
        <textarea
          rows={3}
          className={`${inputCls(!!err.note)} h-auto resize-none py-3`}
          placeholder="e.g. Zone A unloading crew shift wages or covered van toll"
          value={note}
          onChange={(e) => {
            setNote(e.target.value)
            setErr((x) => ({ ...x, note: '' }))
          }}
        />
      </Field>

      <Button type="button" onClick={submit} className="h-12 w-full">
        Save Expense (BDT)
      </Button>
    </div>
  )
}

function DatePicker({ value, onPick }: { value: string; onPick: (d: string) => void }) {
  const [m, setM] = useState(() => new Date(value.slice(0, 7) + '-01'))
  const first = (m.getDay() + 6) % 7
  const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate()
  const shift = (n: number) => setM(new Date(m.getFullYear(), m.getMonth() + n, 1))
  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          className="grid size-8 place-items-center rounded-full hover:bg-bg cursor-pointer"
        >
          <Icon name="chevron" className="size-4 rotate-180" />
        </button>
        <span className="text-sm font-bold text-ink">
          {m.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
        </span>
        <button
          type="button"
          onClick={() => shift(1)}
          className="grid size-8 place-items-center rounded-full hover:bg-bg cursor-pointer"
        >
          <Icon name="chevron" className="size-4" />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={i} className="py-1 font-semibold text-muted">
            {d}
          </span>
        ))}
        {Array.from({ length: first }).map((_, i) => (
          <span key={'e' + i} />
        ))}
        {Array.from({ length: days }).map((_, i) => {
          const d = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}-${String(
            i + 1
          ).padStart(2, '0')}`
          return (
            <button
              type="button"
              key={d}
              onClick={() => onPick(d)}
              className={`grid aspect-square place-items-center rounded-full text-sm transition-colors cursor-pointer ${
                d === value ? 'bg-primary font-bold text-white' : 'hover:bg-primary-soft'
              }`}
            >
              {i + 1}
            </button>
          )
        })}
      </div>
    </div>
  )
}
