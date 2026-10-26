// ====================================================================
// Application Layer: Outbound & Dispatch Use Case
// Enforces strict FIFO rules, duplicate scan prevention, and status validation
// ====================================================================

import {
  IBarcodeRepository,
  IBatchRepository,
  IInventoryTransactionRepository,
  IActivityLogRepository,
} from '@/domain/repositories'
import { BarcodeItemEntity } from '@/domain/entities'
import { DispatchItemDto } from '../dto'
import {
  BarcodeNotFoundError,
  ItemAlreadyDispatchedError,
  ItemDamagedError,
  ItemQuarantinedError,
  ItemNotAvailableError,
  FifoViolationError,
} from '@/domain/errors'

export class DispatchItemUseCase {
  constructor(
    private readonly barcodeRepo: IBarcodeRepository,
    private readonly batchRepo: IBatchRepository,
    private readonly txRepo: IInventoryTransactionRepository,
    private readonly auditRepo: IActivityLogRepository
  ) {}

  async execute(dto: DispatchItemDto): Promise<{
    item: BarcodeItemEntity
    message: string
  }> {
    const item = await this.barcodeRepo.findByString(dto.barcode_string)
    if (!item) {
      throw new BarcodeNotFoundError(dto.barcode_string)
    }

    // Status Validation
    if (item.status === 'DISPATCHED') {
      throw new ItemAlreadyDispatchedError(dto.barcode_string)
    }
    if (item.status === 'DAMAGED') {
      throw new ItemDamagedError(dto.barcode_string)
    }
    if (item.status === 'QUARANTINE') {
      throw new ItemQuarantinedError(dto.barcode_string)
    }
    if (item.status !== 'IN_STOCK') {
      throw new ItemNotAvailableError(dto.barcode_string, item.status)
    }

    // Strict FIFO Enforcement
    if (!dto.override_fifo && item.product_id) {
      const oldestActiveBatch = await this.batchRepo.findOldestActiveBatchForProduct(item.product_id)

      if (
        oldestActiveBatch &&
        oldestActiveBatch.id !== item.batch_id &&
        new Date(oldestActiveBatch.entry_date).getTime() < new Date(item.batch.entry_date).getTime()
      ) {
        throw new FifoViolationError(item.batch.batch_number, oldestActiveBatch.batch_number)
      }
    }

    // Mark as Dispatched
    const dispatchedAt = new Date()
    const updated = await this.barcodeRepo.updateStatus(dto.barcode_string, 'DISPATCHED', {
      scanned_by_user_id: dto.user_id,
      dispatched_at: dispatchedAt,
    })

    // Record Immutable Transaction Ledger (OUT)
    await this.txRepo.recordTransaction({
      barcode_item_id: item.id,
      product_id: item.product_id,
      batch_id: item.batch_id,
      from_location_id: item.location_id,
      movement_type: 'OUT',
      quantity: 1,
      user_id: dto.user_id,
      reference_number: dto.reference_order_no,
      notes: dto.notes ?? `Dispatched barcode ${item.barcode_string} from batch ${item.batch.batch_number}`,
    })

    // Audit Log
    await this.auditRepo.log({
      user_id: dto.user_id,
      action: 'DISPATCH',
      target_entity: 'BARCODE_ITEM',
      entity_id: item.barcode_string,
      description: `Dispatched item ${item.barcode_string} (Batch: ${item.batch.batch_number})`,
      metadata: {
        order: dto.reference_order_no,
        location: item.location?.code,
      },
    })

    return {
      item: updated,
      message: `Item ${item.barcode_string} successfully dispatched.`,
    }
  }
}
