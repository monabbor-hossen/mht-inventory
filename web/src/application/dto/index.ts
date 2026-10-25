// ====================================================================
// Application Layer: Data Transfer Objects (DTOs)
// ====================================================================

import { BatchStatus, DamageReason, ExpenseCategory } from '@/domain/entities'

export interface CreateBlindReceiptDTO {
  quantity: number
  userId?: number
}

export interface CreateAdvanceEntryDTO {
  supplier_name: string
  category: string
  quantity: number
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
  photo_url?: string | null
  userId: number
}

export interface AddExpenseDTO {
  category: ExpenseCategory
  amount: number
  note: string
  receipt_url?: string | null
  userId: number
}

export interface OfflineSyncDTO {
  dispatches?: Array<{ barcode: string; timestamp?: string }>
  damages?: Array<{ barcode: string; reason: DamageReason; photo_url?: string; timestamp?: string }>
  expenses?: Array<{ category: ExpenseCategory; amount: number; note: string; timestamp?: string }>
  userId?: number
}
