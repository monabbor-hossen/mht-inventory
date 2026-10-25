export type UserRole = 'Super Admin' | 'Manager' | 'Staff'
export type ScanStatus = 'In' | 'Out' | 'Damaged'
export type WarehouseZone = 'Zone A' | 'Zone B' | 'Floor-1' | 'Floor-2'
export type OriginType = 'Middle East' | 'Local' | 'Others'
export type DamageReason =
  | 'Torn Bag'
  | 'Moisture/Water Damage'
  | 'Weight Shortage'
  | 'Quality Issue'
export type ExpenseCategory =
  | 'Transport & Freight'
  | 'Labor & Wages'
  | 'Office & Warehouse'
  | 'Others'

export interface UserRecord {
  id: number
  user_id: string
  name: string
  role: UserRole
  password?: string
  phone?: string | null
  status?: string
  created_at?: string
  updated_at?: string
}

export interface InboundBatchRecord {
  id?: number
  batch_number: string
  supplier_name: string
  origin: OriginType | string
  challan_number: string
  product_name: string
  bags_count: number
  unit_weight: string
  numeric_kg?: number
  total_tonnes?: number
  warehouse_zone: WarehouseZone | string
  printer_name?: string | null
  received_by?: string
  status?: string
  received_date?: string
  received_time?: string
  created_at?: string
}

export interface ScanRecord {
  id?: number
  scan_key: string
  batch_number: string
  product_name: string
  bags: number
  unit_weight: string
  warehouse_zone: WarehouseZone | string
  scanned_by: string
  direction: ScanStatus
  scan_date: string
  scan_time: string
  created_at?: string
}

export interface DamageRecord {
  id?: number
  damage_code: string
  batch_number: string
  product_name: string
  bags: number
  reason: DamageReason | string
  reported_by: string
  photo_url?: string | null
  notes?: string | null
  damage_date: string
  damage_time: string
  created_at?: string
}

export interface ExpenseRecord {
  id?: number
  voucher_no: string
  category: ExpenseCategory | string
  amount: number
  expense_date: string
  expense_time: string
  note: string
  entered_by: string
  created_at?: string
}

export interface SyncPayloadItem {
  id: string
  kind: 'Scan' | 'Expense' | 'Damage'
  data: Record<string, any>
  title?: string
  subtitle?: string
  synced_by?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
  meta?: Record<string, any>
}
