// ====================================================================
// Application Layer: Data Transfer Objects (DTOs)
// Decoupled input and output data structures
// ====================================================================

import {
  BarcodeStatus,
  BatchStatus,
  DamageReason,
  ExpenseCategory,
  Role,
  TransactionType,
} from '@/domain/entities'

// --------------------------------------------------
// Product DTOs
// --------------------------------------------------
export interface CreateProductDto {
  sku: string
  name: string
  category: string
  unit_weight: number
  unit_of_measure?: string
  description?: string
  min_stock_alert?: number
}

// --------------------------------------------------
// Location DTOs
// --------------------------------------------------
export interface CreateLocationDto {
  code: string
  zone: string
  aisle: string
  rack: string
  bin: string
  description?: string
  max_capacity?: number
}

export interface RelocateItemDto {
  barcode_string: string
  target_location_code: string
  user_id?: number
  notes?: string
}

// --------------------------------------------------
// Inbound & Receiving DTOs
// --------------------------------------------------
export interface ReceiveInboundStockDto {
  mode: 'ASN' | 'BLIND'
  batch_number?: string
  supplier_name?: string
  product_id?: number
  category?: string
  expected_quantity: number
  target_location_id?: number
  notes?: string
  user_id?: number
}

export interface AdjustBatchQuantityDto {
  batch_id: number
  action: 'ADD' | 'VOID'
  quantity?: number // For ADD
  barcode_strings?: string[] // For VOID
  reason: string
  user_id?: number
}

// --------------------------------------------------
// Outbound & Dispatch DTOs
// --------------------------------------------------
export interface DispatchItemDto {
  barcode_string: string
  user_id?: number
  reference_order_no?: string
  notes?: string
  override_fifo?: boolean // Defaults to false to strictly enforce FIFO
}

// --------------------------------------------------
// Cycle Counting DTOs
// --------------------------------------------------
export interface StartCycleCountDto {
  count_number?: string
  location_id?: number
  conducted_by?: number
  notes?: string
}

export interface AuditCycleItemDto {
  cycle_count_id: number
  barcode_string: string
  notes?: string
}

// --------------------------------------------------
// Damage & Expense DTOs
// --------------------------------------------------
export interface RecordDamageDto {
  barcode_string: string
  reason: DamageReason
  photo_url?: string
  notes?: string
  logged_by: number
}

export interface CreateExpenseDto {
  category: ExpenseCategory
  amount: number
  title?: string
  note: string
  receipt_url?: string
  expense_date?: Date
  created_by: number
}

// --------------------------------------------------
// Legacy & Compatibility DTOs
// --------------------------------------------------
export interface CreateBlindReceiptDTO {
  quantity: number
  userId?: number
}

export interface CreateAdvanceEntryDTO {
  quantity: number
  supplier_name: string
  category?: string
  batch_number?: string
  userId?: number
}

export interface UpdateBatchMetadataDTO {
  batchId: number
  supplier_name?: string
  category?: string
  status?: BatchStatus
  userId?: number
}

export interface AdjustBatchBarcodesDTO {
  batchId: number
  addQuantity?: number
  voidBarcodes?: string[]
  userId?: number
}

export interface DispatchScanDTO {
  barcode_string: string
  userId?: number
}

export interface RecordDamageDTO {
  barcode_string: string
  reason: DamageReason
  photo_url?: string
  userId: number
}

export interface AddExpenseDTO {
  category: ExpenseCategory
  amount: number
  note: string
  userId: number
}

export interface OfflineSyncDTO {
  userId?: number
  dispatches?: Array<{ barcode: string; timestamp?: string }>
  damages?: Array<{ barcode: string; reason: DamageReason; photo_url?: string; timestamp?: string }>
  expenses?: Array<{ category: ExpenseCategory; amount: number; note: string; timestamp?: string }>
}

