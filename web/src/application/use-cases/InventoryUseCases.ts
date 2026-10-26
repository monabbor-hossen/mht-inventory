// ====================================================================
// Application Layer: Inventory Use Cases (Enterprise WMS)
// ====================================================================

import {
  IActivityLogRepository,
  IBarcodeRepository,
  IBatchRepository,
  IDamageRepository,
  IInventoryTransactionRepository,
} from '@/domain/repositories'
import {
  BarcodeAlreadyScannedError,
  BarcodeNotFoundError,
  BatchNotFoundError,
  ValidationError,
} from '@/domain/errors'
import {
  AdjustBatchBarcodesDTO,
  CreateAdvanceEntryDTO,
  CreateBlindReceiptDTO,
  DispatchScanDTO,
  RecordDamageDTO,
  UpdateBatchMetadataDTO,
} from '../dto'
import { BarcodeItemEntity, BatchEntity, DamageRecordEntity } from '@/domain/entities'

export class InventoryUseCases {
  constructor(
    private readonly batchRepo: IBatchRepository,
    private readonly barcodeRepo: IBarcodeRepository,
    private readonly activityLogRepo: IActivityLogRepository,
    private readonly damageRepo?: IDamageRepository,
    private readonly transactionRepo?: IInventoryTransactionRepository
  ) {}

  /**
   * Generates a clean serialized batch number: e.g. "B-261026-8492"
   */
  private generateBatchNumber(): string {
    const now = new Date()
    const yy = String(now.getFullYear()).slice(-2)
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const random = Math.floor(1000 + Math.random() * 9000)
    return `B-${yy}${mm}${dd}-${random}`
  }

  /**
   * Generates serialized barcode strings for a batch
   */
  private generateBarcodeStrings(batchNumber: string, count: number, startOffset = 0): string[] {
    const list: string[] = []
    for (let i = 0; i < count; i++) {
      const seq = String(startOffset + i + 1).padStart(4, '0')
      list.push(`${batchNumber}-${seq}`)
    }
    return list
  }

  /**
   * Module A: Blind Receipt (Quick Print)
   * Creates a DRAFT batch with minimal input and immediately generates barcodes
   */
  async createBlindReceipt(dto: CreateBlindReceiptDTO): Promise<{
    batch: BatchEntity
    barcodes: BarcodeItemEntity[]
  }> {
    if (!dto.quantity || dto.quantity <= 0) {
      throw new ValidationError('Quantity must be greater than zero')
    }

    const batchNumber = this.generateBatchNumber()
    const batch = await this.batchRepo.createBatch({
      batch_number: batchNumber,
      supplier_name: null,
      category: null,
      expected_quantity: dto.quantity,
      received_quantity: dto.quantity,
      status: 'DRAFT',
    })

    const barcodeStrings = this.generateBarcodeStrings(batchNumber, dto.quantity)
    const barcodes = await this.barcodeRepo.createBarcodes(
      batch.id,
      barcodeStrings.map((str) => ({ barcode_string: str }))
    )

    await this.activityLogRepo.log({
      user_id: dto.userId ?? null,
      action: 'CREATE',
      target_entity: 'Batch',
      entity_id: String(batch.id),
      description: `Blind receipt created batch "${batchNumber}" with ${dto.quantity} barcodes in DRAFT status`,
    })

    return { batch, barcodes }
  }

  /**
   * Module A: Advance Entry
   * Creates a COMPLETED batch with supplier, category, and barcodes
   */
  async createAdvanceEntry(dto: CreateAdvanceEntryDTO): Promise<{
    batch: BatchEntity
    barcodes: BarcodeItemEntity[]
  }> {
    if (!dto.quantity || dto.quantity <= 0) {
      throw new ValidationError('Quantity must be greater than zero')
    }
    if (!dto.supplier_name?.trim()) {
      throw new ValidationError('Supplier name is required for Advance Entry')
    }

    const batchNumber = dto.batch_number?.trim() || this.generateBatchNumber()
    const batch = await this.batchRepo.createBatch({
      batch_number: batchNumber,
      supplier_name: dto.supplier_name.trim(),
      category: dto.category?.trim() || 'General',
      expected_quantity: dto.quantity,
      received_quantity: dto.quantity,
      status: 'COMPLETED',
    })

    const barcodeStrings = this.generateBarcodeStrings(batchNumber, dto.quantity)
    const barcodes = await this.barcodeRepo.createBarcodes(
      batch.id,
      barcodeStrings.map((str) => ({ barcode_string: str }))
    )

    await this.activityLogRepo.log({
      user_id: dto.userId ?? null,
      action: 'CREATE',
      target_entity: 'Batch',
      entity_id: String(batch.id),
      description: `Advance entry batch "${batchNumber}" created for supplier "${dto.supplier_name}" with ${dto.quantity} barcodes`,
    })

    return { batch, barcodes }
  }

  /**
   * Module A: Late Metadata Binding
   * Updates a DRAFT batch with Supplier and Category and moves it to COMPLETED
   */
  async updateBatchMetadata(dto: UpdateBatchMetadataDTO): Promise<BatchEntity> {
    const batch = await this.batchRepo.findById(dto.batchId)
    if (!batch) {
      throw new BatchNotFoundError(dto.batchId)
    }

    const updated = await this.batchRepo.updateBatch(dto.batchId, {
      supplier_name: dto.supplier_name ?? batch.supplier_name,
      category: dto.category ?? batch.category,
      status: dto.status ?? 'COMPLETED',
    })

    await this.activityLogRepo.log({
      user_id: dto.userId ?? null,
      action: 'UPDATE',
      target_entity: 'Batch',
      entity_id: String(batch.id),
      description: `Updated metadata for batch "${batch.batch_number}" (status: ${updated.status})`,
    })

    return updated
  }

  /**
   * Module A: Batch Adjustment (Over/Under Printing)
   */
  async adjustBatchBarcodes(dto: AdjustBatchBarcodesDTO): Promise<{
    batch: BatchEntity
    addedBarcodes?: BarcodeItemEntity[]
    voidedCount?: number
  }> {
    const batch = await this.batchRepo.findById(dto.batchId)
    if (!batch) {
      throw new BatchNotFoundError(dto.batchId)
    }

    let addedBarcodes: BarcodeItemEntity[] = []
    let voidedCount = 0
    let newQuantity = batch.received_quantity

    // 1. Over-printing: generate additional barcodes
    if (dto.addQuantity && dto.addQuantity > 0) {
      const existingCount = batch.barcodes?.length ?? batch.received_quantity
      const newStrings = this.generateBarcodeStrings(batch.batch_number, dto.addQuantity, existingCount)
      addedBarcodes = await this.barcodeRepo.createBarcodes(
        batch.id,
        newStrings.map((str) => ({ barcode_string: str }))
      )
      newQuantity += dto.addQuantity
    }

    // 2. Under-printing: void specific barcodes
    if (dto.voidBarcodes && dto.voidBarcodes.length > 0) {
      voidedCount = await this.barcodeRepo.voidBarcodes(dto.voidBarcodes)
      newQuantity = Math.max(0, newQuantity - voidedCount)
    }

    const updatedBatch = await this.batchRepo.updateBatch(dto.batchId, {
      received_quantity: newQuantity,
    })

    await this.activityLogRepo.log({
      user_id: dto.userId ?? null,
      action: 'UPDATE',
      target_entity: 'Batch',
      entity_id: String(batch.id),
      description: `Adjusted batch "${batch.batch_number}": added ${addedBarcodes.length}, voided ${voidedCount}`,
    })

    return {
      batch: updatedBatch,
      addedBarcodes,
      voidedCount,
    }
  }

  /**
   * Module D & Scan: Dispatch Scan
   * Checks existence, verifies IN_STOCK status, marks DISPATCHED
   */
  async dispatchScan(dto: DispatchScanDTO): Promise<BarcodeItemEntity> {
    const barcodeStr = dto.barcode_string?.trim()
    if (!barcodeStr) {
      throw new ValidationError('Barcode string is required')
    }

    const item = await this.barcodeRepo.findByString(barcodeStr)
    if (!item) {
      throw new BarcodeNotFoundError(barcodeStr)
    }

    if (item.status !== 'IN_STOCK') {
      throw new BarcodeAlreadyScannedError(barcodeStr, item.status)
    }

    const dispatched = await this.barcodeRepo.updateStatus(
      barcodeStr,
      'DISPATCHED',
      {
        scanned_by_user_id: dto.userId ?? null,
        dispatched_at: new Date(),
      }
    )

    if (this.transactionRepo) {
      await this.transactionRepo.recordTransaction({
        barcode_item_id: item.id,
        product_id: item.product_id,
        batch_id: item.batch_id,
        movement_type: 'OUT',
        quantity: 1,
        user_id: dto.userId ?? null,
        reference_number: `DISPATCH-${barcodeStr}`,
      })
    }

    await this.activityLogRepo.log({
      user_id: dto.userId ?? null,
      action: 'DISPATCH',
      target_entity: 'BarcodeItem',
      entity_id: barcodeStr,
      description: `Barcode "${barcodeStr}" marked as DISPATCHED (Batch: ${item.batch.batch_number})`,
    })

    return dispatched
  }

  /**
   * Module D & Scan: Record Damage
   */
  async recordDamage(dto: RecordDamageDTO): Promise<DamageRecordEntity> {
    if (!this.damageRepo) {
      throw new Error('Damage repository is not configured')
    }

    const barcodeStr = dto.barcode_string?.trim()
    if (!barcodeStr) {
      throw new ValidationError('Barcode string is required')
    }

    const item = await this.barcodeRepo.findByString(barcodeStr)
    if (!item) {
      throw new BarcodeNotFoundError(barcodeStr)
    }

    // Mark barcode item as DAMAGED
    await this.barcodeRepo.updateStatus(barcodeStr, 'DAMAGED', {
      scanned_by_user_id: dto.userId,
    })

    const damageRecord = await this.damageRepo.createDamageRecord({
      barcode_id: item.id,
      reason: dto.reason,
      photo_url: dto.photo_url ?? null,
      notes: null,
      logged_by: dto.userId,
    })

    if (this.transactionRepo) {
      await this.transactionRepo.recordTransaction({
        barcode_item_id: item.id,
        product_id: item.product_id,
        batch_id: item.batch_id,
        movement_type: 'ADJUSTMENT',
        quantity: 1,
        user_id: dto.userId,
        reference_number: `DAMAGE-${damageRecord.id}`,
        notes: `Damaged item: ${dto.reason}`,
      })
    }

    await this.activityLogRepo.log({
      user_id: dto.userId,
      action: 'SCAN',
      target_entity: 'DamageRecord',
      entity_id: String(damageRecord.id),
      description: `Barcode "${barcodeStr}" logged as DAMAGED (${dto.reason})`,
    })

    return damageRecord
  }
}
