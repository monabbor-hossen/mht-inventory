export type UserRole = 'Super Admin' | 'Manager' | 'Operator'
export type ScanStatus = 'In' | 'Out' | 'Damaged'
export type WarehouseZone = 'Zone A' | 'Zone B' | 'Floor-1' | 'Floor-2'
export type OriginType = 'Middle East' | 'Local' | 'Others'

export type ScanItem = {
  key: string
  date: string
  time: string
  batch: string
  product: string
  bags: number
  weight: string
  zone: WarehouseZone
  by: string
  dir: ScanStatus
}

export type DamageReason =
  | 'Torn Bag'
  | 'Moisture/Water Damage'
  | 'Weight Shortage'
  | 'Quality Issue'

export type DamageItem = {
  id: string
  batch: string
  product: string
  bags: number
  reason: DamageReason
  time: string
  by: string
  photoUrl?: string
  notes?: string
}

export type ExpenseCategory =
  | 'Transport/Freight'
  | 'Labor/Wages'
  | 'Office & Utility'
  | 'Food/Others'

export type ExpenseItem = {
  id: number
  cat: ExpenseCategory
  amount: number
  date: string
  time: string
  note: string
  voucherNo: string
  enteredBy: string
}

export type UnsyncedRecord = {
  id: string
  kind: 'Scan' | 'Expense'
  title: string
  subtitle: string
  time: string
  count?: number
}

export type Lang = 'EN' | 'BN'
export type SyncState = 'synced' | 'syncing' | 'offline'

export const now = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
export const iso = (d: Date) => d.toISOString().slice(0, 10)
export const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return iso(d)
}

export const supplierSuggestions = [
  'Nabil Auto Flour & Rice Mills',
  'Rashid Agro Food Products Ltd.',
  'Al-Haramain Gulf Commodities (UAE)',
  'TK Group Commodity Division',
  'Akij Essential Grains Ltd.',
  'Deshbandhu Agro & Milling',
]

export const products = [
  'Miniket Premium 25 Kg',
  'Basmati Royal 25 Kg',
  'Nazirshail Special 50 Kg',
  'Kataribhog Aromatic 25 Kg',
  'Gulf Parboiled 50 Kg',
  'Chinigura Export 25 Kg',
]

export const expenseCategoryMeta: Record<
  ExpenseCategory,
  { icon: string; tone: string; short: string }
> = {
  'Transport/Freight': {
    icon: 'car',
    tone: 'bg-sky-50 text-sky-700 border-sky-200',
    short: 'Transport/Freight',
  },
  'Labor/Wages': {
    icon: 'hardhat',
    tone: 'bg-primary-soft text-primary border-primary/20',
    short: 'Labor/Wages',
  },
  'Office & Utility': {
    icon: 'bulb',
    tone: 'bg-violet-50 text-violet-700 border-violet-200',
    short: 'Office & Utility',
  },
  'Food/Others': {
    icon: 'coffee',
    tone: 'bg-accent-soft text-accent border-accent/25',
    short: 'Food/Others',
  },
}

export const initialScans: ScanItem[] = [
  {
    key: 's1',
    date: '24 Oct 2026',
    time: '10:42',
    batch: 'B-2610-131',
    product: 'Miniket Premium 25 Kg',
    bags: 120,
    weight: '25 Kg',
    zone: 'Zone A',
    by: 'Rafiqul I. (Operator)',
    dir: 'Out',
  },
  {
    key: 's2',
    date: '24 Oct 2026',
    time: '10:39',
    batch: 'B-2610-130',
    product: 'Basmati Royal 25 Kg',
    bags: 85,
    weight: '25 Kg',
    zone: 'Zone B',
    by: 'Tanvir A. (Operator)',
    dir: 'Out',
  },
  {
    key: 's3',
    date: '24 Oct 2026',
    time: '10:31',
    batch: 'B-2610-128',
    product: 'Nazirshail Special 50 Kg',
    bags: 450,
    weight: '50 Kg',
    zone: 'Floor-1',
    by: 'Kamal H. (Manager)',
    dir: 'In',
  },
  {
    key: 's4',
    date: '24 Oct 2026',
    time: '10:18',
    batch: 'B-2610-124',
    product: 'Kataribhog Aromatic 25 Kg',
    bags: 14,
    weight: '25 Kg',
    zone: 'Zone A',
    by: 'Rafiqul I. (Operator)',
    dir: 'Damaged',
  },
  {
    key: 's5',
    date: '24 Oct 2026',
    time: '09:57',
    batch: 'B-2610-120',
    product: 'Gulf Parboiled 50 Kg',
    bags: 300,
    weight: '50 Kg',
    zone: 'Floor-2',
    by: 'Kamal H. (Manager)',
    dir: 'In',
  },
  {
    key: 's6',
    date: '24 Oct 2026',
    time: '09:44',
    batch: 'B-2610-119',
    product: 'Chinigura Export 25 Kg',
    bags: 210,
    weight: '25 Kg',
    zone: 'Zone B',
    by: 'Tanvir A. (Operator)',
    dir: 'Out',
  },
  {
    key: 's7',
    date: '24 Oct 2026',
    time: '09:20',
    batch: 'B-2610-118',
    product: 'Miniket Premium 25 Kg',
    bags: 600,
    weight: '25 Kg',
    zone: 'Zone A',
    by: 'Mahmudul H. (Super Admin)',
    dir: 'In',
  },
  {
    key: 's8',
    date: '23 Oct 2026',
    time: '18:52',
    batch: 'B-2610-115',
    product: 'Basmati Royal 25 Kg',
    bags: 8,
    weight: '25 Kg',
    zone: 'Floor-1',
    by: 'Rafiqul I. (Operator)',
    dir: 'Damaged',
  },
]

export const stockChart7Days = [
  { day: 'Sat', date: '18 Oct', stockIn: 420, stockOut: 310 },
  { day: 'Sun', date: '19 Oct', stockIn: 560, stockOut: 440 },
  { day: 'Mon', date: '20 Oct', stockIn: 380, stockOut: 490 },
  { day: 'Tue', date: '21 Oct', stockIn: 680, stockOut: 420 },
  { day: 'Wed', date: '22 Oct', stockIn: 510, stockOut: 460 },
  { day: 'Thu', date: '23 Oct', stockIn: 740, stockOut: 580 },
  { day: 'Fri', date: '24 Oct', stockIn: 600, stockOut: 415 },
]

export const initialDamages: DamageItem[] = [
  {
    id: 'DMG-104',
    batch: 'B-2610-124',
    product: 'Kataribhog Aromatic 25 Kg',
    bags: 14,
    reason: 'Torn Bag',
    time: '10:18',
    by: 'Rafiqul I.',
    photoUrl:
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop&auto=format',
    notes: 'Pallet hook tear during Zone A stack rotation.',
  },
  {
    id: 'DMG-103',
    batch: 'B-2610-115',
    product: 'Basmati Royal 25 Kg',
    bags: 8,
    reason: 'Moisture/Water Damage',
    time: '08:52',
    by: 'Kamal H.',
    photoUrl:
      'https://images.unsplash.com/photo-1553413077-190dd305871c?w=400&h=300&fit=crop&auto=format',
    notes: 'Rainwater seepage near shutter gate on Floor-1.',
  },
  {
    id: 'DMG-102',
    batch: 'B-2610-099',
    product: 'Nazirshail Special 50 Kg',
    bags: 11,
    reason: 'Weight Shortage',
    time: 'Yesterday',
    by: 'Kamal H.',
    notes: 'Digital scale check recorded 47.4 Kg instead of 50 Kg.',
  },
  {
    id: 'DMG-101',
    batch: 'B-2610-084',
    product: 'Gulf Parboiled 50 Kg',
    bags: 6,
    reason: 'Quality Issue',
    time: '22 Oct',
    by: 'Mahmudul H.',
    notes: 'Broken grain ratio exceeded 12% QA threshold.',
  },
]

export const initialExpenses: ExpenseItem[] = [
  {
    id: 101,
    cat: 'Labor/Wages',
    amount: 7200,
    date: daysAgo(0),
    time: '11:15',
    note: 'Zone A & Floor-1 unloading shift crew (12 workers)',
    voucherNo: 'VCH-2610-01',
    enteredBy: 'Kamal H. (Manager)',
  },
  {
    id: 102,
    cat: 'Transport/Freight',
    amount: 11500,
    date: daysAgo(0),
    time: '09:40',
    note: 'Covered van freight — Chattogram port to Tejgaon 1,500 sq ft depot',
    voucherNo: 'VCH-2610-02',
    enteredBy: 'Mahmudul H. (Super Admin)',
  },
  {
    id: 103,
    cat: 'Office & Utility',
    amount: 3400,
    date: daysAgo(0),
    time: '08:20',
    note: 'DESCO warehouse electricity & thermal label roll restock',
    voucherNo: 'VCH-2610-03',
    enteredBy: 'Kamal H. (Manager)',
  },
  {
    id: 104,
    cat: 'Food/Others',
    amount: 1450,
    date: daysAgo(0),
    time: '13:30',
    note: 'Afternoon loader staff lunch, drinking water & tea',
    voucherNo: 'VCH-2610-04',
    enteredBy: 'Rafiqul I. (Operator)',
  },
  {
    id: 105,
    cat: 'Labor/Wages',
    amount: 6400,
    date: daysAgo(2),
    time: '17:45',
    note: 'Inbound Lot B-2610-118 restacking on Floor-2',
    voucherNo: 'VCH-2610-05',
    enteredBy: 'Kamal H. (Manager)',
  },
  {
    id: 106,
    cat: 'Transport/Freight',
    amount: 16800,
    date: daysAgo(4),
    time: '12:00',
    note: 'Two 5-ton trucks — Bogura mill inbound challan CHL-9018',
    voucherNo: 'VCH-2610-06',
    enteredBy: 'Mahmudul H. (Super Admin)',
  },
  {
    id: 107,
    cat: 'Office & Utility',
    amount: 8900,
    date: daysAgo(11),
    time: '10:30',
    note: 'Industrial dehumidifier service & broadband internet bill',
    voucherNo: 'VCH-2610-07',
    enteredBy: 'Mahmudul H. (Super Admin)',
  },
  {
    id: 108,
    cat: 'Food/Others',
    amount: 2100,
    date: daysAgo(18),
    time: '21:15',
    note: 'Monthly inventory audit crew dinner & snacks',
    voucherNo: 'VCH-2610-08',
    enteredBy: 'Kamal H. (Manager)',
  },
]

export const initialUnsyncedQueue: UnsyncedRecord[] = [
  {
    id: 'u1',
    kind: 'Scan',
    title: 'Batch B-2610-131 · 18 Outbound Scans',
    subtitle: 'Zone A Dispatch · Scanned by Rafiqul I. (Operator)',
    time: '10:42 AM',
    count: 18,
  },
  {
    id: 'u2',
    kind: 'Scan',
    title: 'Batch B-2610-128 · 15 Inbound Scans',
    subtitle: 'Floor-1 · Nabil Auto Flour & Rice Mills',
    time: '10:31 AM',
    count: 15,
  },
  {
    id: 'u3',
    kind: 'Scan',
    title: 'Batch B-2610-124 · 12 Damaged Bag Scans',
    subtitle: 'Zone A · Reason: Torn Bag',
    time: '10:18 AM',
    count: 12,
  },
  {
    id: 'u4',
    kind: 'Expense',
    title: 'Voucher VCH-2610-01 · Labor/Wages (৳7,200 BDT)',
    subtitle: 'Zone A & Floor-1 unloading shift crew',
    time: '11:15 AM',
  },
  {
    id: 'u5',
    kind: 'Expense',
    title: 'Voucher VCH-2610-02 · Transport/Freight (৳11,500 BDT)',
    subtitle: 'Covered van freight — Chattogram port to Tejgaon depot',
    time: '09:40 AM',
  },
  {
    id: 'u6',
    kind: 'Expense',
    title: 'Voucher VCH-2610-04 · Food/Others (৳1,450 BDT)',
    subtitle: 'Afternoon loader staff lunch & water',
    time: '01:30 PM',
  },
]

export const dict: Record<Lang, Record<string, string>> = {
  EN: {
    dashboard: 'Admin Dashboard',
    inbound: 'Inbound & Print',
    scan: 'Smart Scanner',
    damaged: 'Damage & Return',
    accounts: 'Accounts & Ledger',
    settings: 'Offline Sync',
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
    scan: 'স্মার্ট স্ক্যানার',
    damaged: 'ড্যামেজ ও রিটার্ন',
    accounts: 'হিসাব ও লেজার',
    settings: 'অফলাইন সিঙ্ক',
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
