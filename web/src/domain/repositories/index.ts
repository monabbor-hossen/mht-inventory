// ====================================================================
// Domain Repository Interfaces
// Clean Architecture Inversion of Control Contracts
// Completely decoupled from Prisma, MySQL, or HTTP frameworks
// ====================================================================

import {
  ActivityLogEntity,
  BarcodeItemEntity,
  BarcodeStatus,
  BatchEntity,
  BatchStatus,
  CycleCountEntity,
  CycleCountItemEntity,
  CycleCountStatus,
  DamageReason,
  DamageRecordEntity,
  ExpenseCategory,
  ExpenseEntity,
  InventoryTransactionEntity,
  LocationEntity,
  LogAction,
  ProductEntity,
  Role,
  TransactionType,
  UserEntity,
} from '../entities'

// --------------------------------------------------
// Product Catalog Repository
// --------------------------------------------------
export interface IProductRepository {
  createProduct(data: {
    sku: string
    name: string
    category: string
    unit_weight: number
    unit_of_measure?: string
    description?: string | null
    min_stock_alert?: number
  }): Promise<ProductEntity>

  findById(id: number): Promise<ProductEntity | null>
  findBySku(sku: string): Promise<ProductEntity | null>
  findProducts(filter?: { category?: string; query?: string; is_active?: boolean }): Promise<ProductEntity[]>
  updateProduct(id: number, data: Partial<Omit<ProductEntity, 'id' | 'created_at' | 'updated_at'>>): Promise<ProductEntity>
}

// --------------------------------------------------
// Warehouse Location Repository
// --------------------------------------------------
export interface ILocationRepository {
  createLocation(data: {
    code: string
    zone: string
    aisle: string
    rack: string
    bin: string
    description?: string | null
    max_capacity?: number
  }): Promise<LocationEntity>

  findById(id: number): Promise<LocationEntity | null>
  findByCode(code: string): Promise<LocationEntity | null>
  findLocations(filter?: { zone?: string; is_active?: boolean }): Promise<LocationEntity[]>
  getLocationCapacity(id: number): Promise<{ capacity: number; currentStock: number }>
  updateLocation(id: number, data: Partial<Omit<LocationEntity, 'id' | 'created_at' | 'updated_at'>>): Promise<LocationEntity>
}

// --------------------------------------------------
// Batch & Inbound Shipment Repository
// --------------------------------------------------
export interface IBatchRepository {
  createBatch(data: {
    batch_number: string
    supplier_name?: string | null
    product_id?: number | null
    category?: string | null
    expected_quantity: number
    received_quantity?: number
    status: BatchStatus
    notes?: string | null
  }): Promise<BatchEntity>

  findById(id: number): Promise<(BatchEntity & { barcodes?: BarcodeItemEntity[]; product?: ProductEntity | null }) | null>
  findByBatchNumber(batch_number: string): Promise<(BatchEntity & { barcodes?: BarcodeItemEntity[]; product?: ProductEntity | null }) | null>
  findBatches(options?: { status?: BatchStatus; skip?: number; take?: number; productId?: number }): Promise<BatchEntity[]>
  updateBatch(
    id: number,
    data: Partial<Pick<BatchEntity, 'supplier_name' | 'category' | 'status' | 'expected_quantity' | 'received_quantity' | 'notes' | 'product_id'>>
  ): Promise<BatchEntity>

  // FIFO Rule Support: find the oldest batch for a product that still has active stock
  findOldestActiveBatchForProduct(productId: number): Promise<BatchEntity | null>
}

// --------------------------------------------------
// Barcode Serialized Item Repository
// --------------------------------------------------
export interface IBarcodeRepository {
  createBarcodes(
    batch_id: number,
    items: Array<{ barcode_string: string; product_id?: number | null; location_id?: number | null; status?: BarcodeStatus }>
  ): Promise<BarcodeItemEntity[]>

  findByString(barcode_string: string): Promise<
    (BarcodeItemEntity & {
      batch: BatchEntity
      product?: ProductEntity | null
      location?: LocationEntity | null
    }) | null
  >

  updateStatus(
    barcode_string: string,
    status: BarcodeStatus,
    options?: {
      scanned_by_user_id?: number | null
      dispatched_at?: Date | null
      location_id?: number | null
    }
  ): Promise<BarcodeItemEntity>

  relocateItem(barcode_string: string, target_location_id: number): Promise<BarcodeItemEntity>
  voidBarcodes(barcode_strings: string[]): Promise<number>
  updateBatchItems(
    batch_id: number,
    data: {
      status?: BarcodeStatus
      product_id?: number | null
      location_id?: number | null
    }
  ): Promise<number>

  // Stock Queries
  getStockDashboardSummary(): Promise<{
    totalInStock: number
    dispatchedToday: number
    damagedTotal: number
    quarantineTotal: number
  }>

  findItemsByLocation(location_id: number): Promise<BarcodeItemEntity[]>
  findItemsByBatch(batch_id: number): Promise<BarcodeItemEntity[]>
}

// --------------------------------------------------
// Immutable Inventory Transaction Ledger
// --------------------------------------------------
export interface IInventoryTransactionRepository {
  recordTransaction(data: {
    barcode_item_id?: number | null
    product_id?: number | null
    batch_id?: number | null
    from_location_id?: number | null
    to_location_id?: number | null
    movement_type: TransactionType
    quantity?: number
    user_id?: number | null
    reference_number?: string | null
    notes?: string | null
  }): Promise<InventoryTransactionEntity>

  findTransactions(filter?: {
    barcode_item_id?: number
    product_id?: number
    movement_type?: TransactionType
    startDate?: Date
    endDate?: Date
    limit?: number
  }): Promise<InventoryTransactionEntity[]>
}

// --------------------------------------------------
// Damaged Stock Repository
// --------------------------------------------------
export interface IDamageRepository {
  createDamageRecord(data: {
    barcode_id: number
    reason: DamageReason
    photo_url?: string | null
    notes?: string | null
    logged_by: number
  }): Promise<DamageRecordEntity>

  findDamageRecords(limit?: number): Promise<DamageRecordEntity[]>
  findByBarcodeId(barcode_id: number): Promise<DamageRecordEntity | null>
}

// --------------------------------------------------
// Operational Expense Ledger Repository
// --------------------------------------------------
export interface IExpenseRepository {
  createExpense(data: {
    category: ExpenseCategory
    amount: number
    title?: string | null
    note: string
    receipt_url?: string | null
    expense_date?: Date
    created_by: number
  }): Promise<ExpenseEntity>

  findExpenses(filter?: {
    startDate?: Date
    endDate?: Date
    category?: ExpenseCategory
  }): Promise<ExpenseEntity[]>

  getTodayTotalExpense(): Promise<number>
}

// --------------------------------------------------
// User & RBAC Repository
// --------------------------------------------------
export interface IUserRepository {
  findById(id: number): Promise<UserEntity | null>
  findByUsername(username: string): Promise<UserEntity | null>
  findByEmail(email: string): Promise<UserEntity | null>
  findByIdentifier(identifier: string): Promise<UserEntity | null>
  createUser(data: {
    username?: string | null
    name: string
    email?: string | null
    role: Role
    password_hash: string
  }): Promise<UserEntity>
  findUsers(role?: Role): Promise<UserEntity[]>
}

// --------------------------------------------------
// Activity Audit Log Repository
// --------------------------------------------------
export interface IActivityLogRepository {
  log(data: {
    user_id?: number | null
    action: LogAction
    target_entity: string
    entity_id?: string | null
    description: string
    metadata?: Record<string, unknown> | null
  }): Promise<ActivityLogEntity>

  getRecentLogs(limit?: number): Promise<ActivityLogEntity[]>
}

// --------------------------------------------------
// Cycle Counting & Audit Repository
// --------------------------------------------------
export interface ICycleCountRepository {
  createCycleCount(data: {
    count_number: string
    location_id?: number | null
    conducted_by?: number | null
    notes?: string | null
  }): Promise<CycleCountEntity>

  findById(id: number): Promise<(CycleCountEntity & { items: CycleCountItemEntity[]; location?: LocationEntity | null }) | null>
  findByCountNumber(count_number: string): Promise<(CycleCountEntity & { items: CycleCountItemEntity[] }) | null>
  findCycleCounts(status?: CycleCountStatus): Promise<CycleCountEntity[]>
  
  recordItemAudit(data: {
    cycle_count_id: number
    barcode_id: number
    expected_status: BarcodeStatus
    counted_status: BarcodeStatus
    is_discrepancy: boolean
    notes?: string | null
  }): Promise<CycleCountItemEntity>

  completeCycleCount(id: number, notes?: string | null): Promise<CycleCountEntity>
}
