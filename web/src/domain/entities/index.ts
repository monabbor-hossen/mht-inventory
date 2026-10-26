// ====================================================================
// Domain Entities
// Enterprise Business Rules (Decoupled from Framework, DB, and ORMs)
// ====================================================================

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'STAFF'
export type BatchStatus = 'DRAFT' | 'COMPLETED' | 'CANCELLED'
export type BarcodeStatus = 'DRAFT' | 'IN_STOCK' | 'DISPATCHED' | 'DAMAGED' | 'QUARANTINE' | 'VOID'
export type TransactionType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'RELOCATE' | 'CYCLE_COUNT'
export type ExpenseCategory = 'Labor' | 'Transport' | 'Utility' | 'Equipment' | 'Maintenance' | 'Others'
export type DamageReason = 'Torn' | 'Moisture' | 'Weight_Shortage' | 'Broken_Seal' | 'Expired' | 'Other'
export type CycleCountStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
export type LogAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'SCAN' | 'DISPATCH' | 'RELOCATE' | 'PRINT_BARCODE' | 'CYCLE_COUNT' | 'VOID'

export interface UserEntity {
  id: number
  username?: string | null
  name: string
  email?: string | null
  role: Role
  password_hash: string
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface ProductEntity {
  id: number
  sku: string
  name: string
  category: string
  unit_weight: number
  unit_of_measure: string
  description?: string | null
  min_stock_alert: number
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface LocationEntity {
  id: number
  code: string
  zone: string
  aisle: string
  rack: string
  bin: string
  description?: string | null
  max_capacity: number
  is_active: boolean
  created_at: Date
  updated_at: Date
  current_count?: number
}

export interface BatchEntity {
  id: number
  batch_number: string
  supplier_name: string | null
  product_id?: number | null
  category: string | null
  entry_date: Date
  expected_quantity: number
  received_quantity: number
  status: BatchStatus
  notes?: string | null
  created_at: Date
  updated_at: Date
  product?: ProductEntity | null
}

export interface BarcodeItemEntity {
  id: number
  barcode_string: string
  batch_id: number
  product_id?: number | null
  location_id?: number | null
  status: BarcodeStatus
  scanned_by_user_id?: number | null
  dispatched_at?: Date | null
  created_at: Date
  updated_at: Date
  batch?: BatchEntity | null
  product?: ProductEntity | null
  location?: LocationEntity | null
}

export interface InventoryTransactionEntity {
  id: number
  barcode_item_id?: number | null
  product_id?: number | null
  batch_id?: number | null
  from_location_id?: number | null
  to_location_id?: number | null
  movement_type: TransactionType
  quantity: number
  user_id?: number | null
  reference_number?: string | null
  notes?: string | null
  created_at: Date
  barcode_item?: BarcodeItemEntity | null
  product?: ProductEntity | null
  batch?: BatchEntity | null
  from_location?: LocationEntity | null
  to_location?: LocationEntity | null
  user?: UserEntity | null
}

export interface DamageRecordEntity {
  id: number
  barcode_id: number
  reason: DamageReason
  photo_url?: string | null
  notes?: string | null
  logged_by: number
  created_at: Date
  updated_at: Date
  barcode?: BarcodeItemEntity | null
  user?: UserEntity | null
}

export interface ExpenseEntity {
  id: number
  category: ExpenseCategory
  amount: number
  title?: string | null
  note: string
  receipt_url?: string | null
  expense_date: Date
  created_by: number
  created_at: Date
  updated_at: Date
  user?: UserEntity | null
}

export interface ActivityLogEntity {
  id: number
  user_id?: number | null
  action: LogAction
  target_entity: string
  entity_id?: string | null
  description: string
  metadata?: Record<string, unknown> | null
  timestamp: Date
  user?: UserEntity | null
}

export interface CycleCountEntity {
  id: number
  count_number: string
  location_id?: number | null
  status: CycleCountStatus
  conducted_by?: number | null
  notes?: string | null
  started_at?: Date | null
  completed_at?: Date | null
  created_at: Date
  updated_at: Date
  location?: LocationEntity | null
  items?: CycleCountItemEntity[]
}

export interface CycleCountItemEntity {
  id: number
  cycle_count_id: number
  barcode_id: number
  expected_status: BarcodeStatus
  counted_status: BarcodeStatus
  is_discrepancy: boolean
  notes?: string | null
  counted_at: Date
  barcode?: BarcodeItemEntity | null
}
