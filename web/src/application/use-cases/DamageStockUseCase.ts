// ====================================================================
// Application Layer: Damaged Stock & Quarantine Use Cases
// ====================================================================

import {
  IDamageRepository,
  IBarcodeRepository,
  IInventoryTransactionRepository,
  IActivityLogRepository,
} from '@/domain/repositories'
import { DamageRecordEntity } from '@/domain/entities'
import { RecordDamageDto } from '../dto'
import { BarcodeNotFoundError, ConflictError } from '@/domain/errors'

export class DamageStockUseCase {
  constructor(
    private readonly damageRepo: IDamageRepository,
    private readonly barcodeRepo: IBarcodeRepository,
    private readonly txRepo: IInventoryTransactionRepository,
    private readonly auditRepo: IActivityLogRepository
  ) {}

  async recordDamage(dto: RecordDamageDto): Promise<DamageRecordEntity> {
    const item = await this.barcodeRepo.findByString(dto.barcode_string)
    if (!item) {
      throw new BarcodeNotFoundError(dto.barcode_string)
    }

    const existingDamage = await this.damageRepo.findByBarcodeId(item.id)
    if (existingDamage) {
      throw new ConflictError(`Item "${dto.barcode_string}" is already registered as damaged.`)
    }

    // Mark barcode as DAMAGED
    await this.barcodeRepo.updateStatus(dto.barcode_string, 'DAMAGED')

    // Create Damage Record
    const record = await this.damageRepo.createDamageRecord({
      barcode_id: item.id,
      reason: dto.reason,
      photo_url: dto.photo_url,
      notes: dto.notes,
      logged_by: dto.logged_by,
    })

    // Record adjustment movement transaction
    await this.txRepo.recordTransaction({
      barcode_item_id: item.id,
      product_id: item.product_id,
      batch_id: item.batch_id,
      from_location_id: item.location_id,
      movement_type: 'ADJUSTMENT',
      quantity: 1,
      user_id: dto.logged_by,
      notes: `Marked DAMAGED: ${dto.reason} (${dto.notes ?? 'No extra note'})`,
    })

    // Audit Log
    await this.auditRepo.log({
      user_id: dto.logged_by,
      action: 'UPDATE',
      target_entity: 'BARCODE_ITEM',
      entity_id: item.barcode_string,
      description: `Reported damage for barcode ${item.barcode_string}: ${dto.reason}`,
    })

    return record
  }

  async listDamages(limit = 100): Promise<DamageRecordEntity[]> {
    return this.damageRepo.findDamageRecords(limit)
  }
}
