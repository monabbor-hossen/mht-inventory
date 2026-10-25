import type { ScanItem } from './data'

export const localDateKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export function scanDateKey(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : localDateKey(date)
}

export function stockSummary(scans: ScanItem[]) {
  return scans.reduce(
    (total, scan) => {
      const bags = Number.isFinite(scan.bags) ? Math.max(0, scan.bags) : 0
      if (scan.dir === 'In') total.received += bags
      if (scan.dir === 'Out') total.dispatched += bags
      if (scan.dir === 'Damaged') total.damaged += bags
      return total
    },
    { received: 0, dispatched: 0, damaged: 0 },
  )
}

export function weeklyFlow(scans: ScanItem[]) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    const totals = stockSummary(scans.filter((scan) => scanDateKey(scan.date) === localDateKey(date)))
    return {
      day: date.toLocaleDateString('en-GB', { weekday: 'short' }),
      date: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      stockIn: totals.received,
      stockOut: totals.dispatched,
    }
  })
}

export function csvCell(value: unknown) {
  const text = String(value ?? '')
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
  return `"${safe.replace(/"/g, '""')}"`
}
