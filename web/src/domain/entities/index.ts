// ====================================================================
// Domain Entities
// Enterprise Business Rules (Independent of Framework & DB)
// ====================================================================

export type Role = 'ADMIN' | 'MANAGER' | 'STAFF'
export type BatchStatus = 'DRAFT' | 'COMPLETED'
export type BarcodeStatus = 'IN_STOCK' | 'DISPATCHED' | 'DAMAGED' | 'VOID'
export type ExpenseCategory = 'Labor' | 'Transport' | 'Utility' | 'Others'
export type DamageReason = 'Torn' | 'Moisture' | 'Weight_Shortage'
export type LogAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'SCAN'

export interface UserEntity {
  id: number
  username?: string | null
  name: string
  role: Role
  password_hash: string
  created_at: Date
  updated_at: Date
}

export interface BatchEntity {
  id: number
  batch_number: string
  supplier_name: string | null
  category: string | null
  total_quantity: number
  status: BatchStatus
  created_at: Date
  updated_at: Date
}

export interface BarcodeItemEntity {
  id: number
  barcode_string: string
  batch_id: number
  status: BarcodeStatus
  scanned_by_user_id: number | null
  dispatched_at: Date | null
  created_at: Date
  updated_at: Date
}

export interface ExpenseEntity {
  id: number
  category: ExpenseCategory
  amount: number
  note: string
  receipt_url: string | null
  created_by: number
  created_at: Date
  updated_at: Date
}

export interface DamageRecordEntity {
  id: number
  barcode_id: number
  reason: DamageReason
  photo_url: string | null
  logged_by: number
  created_at: Date
  updated_at: Date
}

export interface ActivityLogEntity {
  id: number
  user_id: number | null
  action: LogAction
  target_entity: string
  description: string
  timestamp: Date
}
