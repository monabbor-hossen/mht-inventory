// ====================================================================
// Application Layer: Location & Bin Tracking Use Cases
// ====================================================================

import {
  ILocationRepository,
  IBarcodeRepository,
  IInventoryTransactionRepository,
  IActivityLogRepository,
} from '@/domain/repositories'
import { LocationEntity, BarcodeItemEntity } from '@/domain/entities'
import { CreateLocationDto, RelocateItemDto } from '../dto'
import {
  LocationNotFoundError,
  LocationCapacityExceededError,
  BarcodeNotFoundError,
  ValidationError,
} from '@/domain/errors'

export class LocationUseCases {
  constructor(
    private readonly locationRepo: ILocationRepository,
    private readonly barcodeRepo: IBarcodeRepository,
    private readonly txRepo: IInventoryTransactionRepository,
    private readonly auditRepo: IActivityLogRepository
  ) {}

  async createLocation(dto: CreateLocationDto, userId?: number): Promise<LocationEntity> {
    if (!dto.code || !dto.zone || !dto.aisle || !dto.rack || !dto.bin) {
      throw new ValidationError('Location code, zone, aisle, rack, and bin are required.')
    }

    const existing = await this.locationRepo.findByCode(dto.code)
    if (existing) {
      throw new ValidationError(`Location code "${dto.code}" already exists.`)
    }

    const location = await this.locationRepo.createLocation(dto)

    await this.auditRepo.log({
      user_id: userId,
      action: 'CREATE',
      target_entity: 'LOCATION',
      entity_id: location.code,
      description: `Created warehouse location ${location.code} (Zone: ${location.zone})`,
    })

    return location
  }

  async listLocations(filter?: { zone?: string; is_active?: boolean }): Promise<LocationEntity[]> {
    return this.locationRepo.findLocations(filter)
  }

  async relocateItem(dto: RelocateItemDto): Promise<BarcodeItemEntity> {
    const item = await this.barcodeRepo.findByString(dto.barcode_string)
    if (!item) {
      throw new BarcodeNotFoundError(dto.barcode_string)
    }

    const targetLoc = await this.locationRepo.findByCode(dto.target_location_code)
    if (!targetLoc) {
      throw new LocationNotFoundError(dto.target_location_code)
    }

    // Check capacity
    const { capacity, currentStock } = await this.locationRepo.getLocationCapacity(targetLoc.id)
    if (currentStock >= capacity) {
      throw new LocationCapacityExceededError(targetLoc.code, capacity)
    }

    const previousLocationId = item.location_id
    const updated = await this.barcodeRepo.relocateItem(dto.barcode_string, targetLoc.id)

    // Record immutable movement transaction
    await this.txRepo.recordTransaction({
      barcode_item_id: item.id,
      product_id: item.product_id,
      batch_id: item.batch_id,
      from_location_id: previousLocationId,
      to_location_id: targetLoc.id,
      movement_type: 'RELOCATE',
      quantity: 1,
      user_id: dto.user_id,
      notes: dto.notes ?? `Relocated from location ${previousLocationId ?? 'UNASSIGNED'} to ${targetLoc.code}`,
    })

    // Log user activity
    await this.auditRepo.log({
      user_id: dto.user_id,
      action: 'RELOCATE',
      target_entity: 'BARCODE_ITEM',
      entity_id: dto.barcode_string,
      description: `Moved item ${dto.barcode_string} to ${targetLoc.code}`,
    })

    return updated
  }
}
