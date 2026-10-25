// ====================================================================
// Domain Repository Interfaces
// Clean Architecture Inversion of Control Contracts
// ====================================================================

import {
  ActivityLogEntity,
  BarcodeItemEntity,
  BarcodeStatus,
  BatchEntity,
  BatchStatus,
  DamageRecordEntity,
  ExpenseCategory,
  ExpenseEntity,
  UserEntity,
} from '../entities'

export interface IInventoryRepository {
  // Batch Operations
  createBatch(data: {
    batch_number: string
    supplier_name?: string | null
    category?: string | null
    total_quantity: number
    status: BatchStatus
  }): Promise<BatchEntity>

  findBatchById(id: number): Promise<(BatchEntity & { barcodes?: BarcodeItemEntity[] }) | null>
  findBatchByNumber(batch_number: string): Promise<(BatchEntity & { barcodes?: BarcodeItemEntity[] }) | null>
  findBatches(options?: { status?: BatchStatus; skip?: number; take?: number }): Promise<BatchEntity[]>
  updateBatch(
    id: number,
    data: Partial<Pick<BatchEntity, 'supplier_name' | 'category' | 'status' | 'total_quantity'>>
  ): Promise<BatchEntity>

  // Barcode Operations
  createBarcodes(batch_id: number, barcode_strings: string[]): Promise<BarcodeItemEntity[]>
  findBarcodeByString(barcode_string: string): Promise<(BarcodeItemEntity & { batch: BatchEntity }) | null>
  updateBarcodeStatus(
    barcode_string: string,
    status: BarcodeStatus,
    scanned_by_user_id?: number | null,
    dispatched_at?: Date | null
  ): Promise<BarcodeItemEntity>
  voidBarcodes(barcode_strings: string[]): Promise<number>

  // Stock Analytics
  getStockSummary(): Promise<{
    totalInStock: number
    dispatchedToday: number
  }>
}

export interface IExpenseRepository {
  createExpense(data: {
    category: ExpenseCategory
    amount: number
    note: string
    receipt_url?: string | null
    created_by: number
  }): Promise<ExpenseEntity>

  findExpenses(filter?: {
    startDate?: Date
    endDate?: Date
    category?: ExpenseCategory
  }): Promise<ExpenseEntity[]>

  getTodayTotalExpense(): Promise<number>
}

export interface IDamageRepository {
  createDamageRecord(data: {
    barcode_id: number
    reason: 'Torn' | 'Moisture' | 'Weight_Shortage'
    photo_url?: string | null
    logged_by: number
  }): Promise<DamageRecordEntity>

  findDamageRecords(limit?: number): Promise<DamageRecordEntity[]>
}

export interface IUserRepository {
  findById(id: number): Promise<UserEntity | null>
  findByName(name: string): Promise<UserEntity | null>
  findByIdentifier(identifier: string): Promise<UserEntity | null>
  createUser(data: { username?: string | null; name: string; role: 'ADMIN' | 'MANAGER' | 'STAFF'; password_hash: string }): Promise<UserEntity>
}

export interface IActivityLogRepository {
  log(data: {
    user_id?: number | null
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SCAN'
    target_entity: string
    description: string
  }): Promise<ActivityLogEntity>

  getRecentLogs(limit?: number): Promise<ActivityLogEntity[]>
}
