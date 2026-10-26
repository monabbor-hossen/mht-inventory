// ====================================================================
// Application Layer: Cycle Counting & Physical Stock Audit Use Cases
// Enables staff to audit physical stock vs digital records and record discrepancies
// ====================================================================

import {
  ICycleCountRepository,
  IBarcodeRepository,
  ILocationRepository,
  IInventoryTransactionRepository,
  IActivityLogRepository,
} from '@/domain/repositories'
import { CycleCountEntity, CycleCountItemEntity } from '@/domain/entities'
import { StartCycleCountDto, AuditCycleItemDto } from '../dto'
import {
  CycleCountNotFoundError,
  CycleCountAlreadyClosedError,
  BarcodeNotFoundError,
  LocationNotFoundError,
} from '@/domain/errors'

export class CycleCountUseCases {
  constructor(
    private readonly cycleRepo: ICycleCountRepository,
    private readonly barcodeRepo: IBarcodeRepository,
    private readonly locationRepo: ILocationRepository,
    private readonly txRepo: IInventoryTransactionRepository,
    private readonly auditRepo: IActivityLogRepository
  ) {}

  async startAudit(dto: StartCycleCountDto): Promise<CycleCountEntity> {
    const timestamp = Date.now().toString().slice(-6)
    const countNumber = dto.count_number?.trim() || `AUDIT-${timestamp}`

    if (dto.location_id) {
      const loc = await this.locationRepo.findById(dto.location_id)
      if (!loc) throw new LocationNotFoundError(dto.location_id)
    }

    const audit = await this.cycleRepo.createCycleCount({
      count_number: countNumber,
      location_id: dto.location_id,
      conducted_by: dto.conducted_by,
      notes: dto.notes,
    })

    await this.auditRepo.log({
      user_id: dto.conducted_by,
      action: 'CYCLE_COUNT',
      target_entity: 'CYCLE_COUNT',
      entity_id: audit.count_number,
      description: `Started physical cycle count audit ${audit.count_number}`,
    })

    return audit
  }

  async auditItemScan(dto: AuditCycleItemDto, userId?: number): Promise<CycleCountItemEntity> {
    const audit = await this.cycleRepo.findById(dto.cycle_count_id)
    if (!audit) {
      throw new CycleCountNotFoundError(dto.cycle_count_id)
    }
    if (audit.status === 'COMPLETED' || audit.status === 'CANCELLED') {
      throw new CycleCountAlreadyClosedError(audit.count_number)
    }

    const barcode = await this.barcodeRepo.findByString(dto.barcode_string)
    if (!barcode) {
      throw new BarcodeNotFoundError(dto.barcode_string)
    }

    // Check discrepancy
    const expectedStatus = barcode.status
    const countedStatus = 'IN_STOCK'
    const isLocationMismatch = audit.location_id && barcode.location_id !== audit.location_id
    const isStatusMismatch = expectedStatus !== 'IN_STOCK'

    const isDiscrepancy = Boolean(isLocationMismatch || isStatusMismatch)
    const discrepancyNote = isLocationMismatch
      ? `Location mismatch: item expected at Loc #${barcode.location_id ?? 'UNSET'}`
      : isStatusMismatch
      ? `Status mismatch: expected ${expectedStatus}, found IN_STOCK`
      : dto.notes

    const auditItem = await this.cycleRepo.recordItemAudit({
      cycle_count_id: audit.id,
      barcode_id: barcode.id,
      expected_status: expectedStatus,
      counted_status: countedStatus,
      is_discrepancy: isDiscrepancy,
      notes: discrepancyNote,
    })

    if (isDiscrepancy) {
      // Record transaction
      await this.txRepo.recordTransaction({
        barcode_item_id: barcode.id,
        product_id: barcode.product_id,
        batch_id: barcode.batch_id,
        movement_type: 'CYCLE_COUNT',
        quantity: 1,
        user_id: userId,
        reference_number: audit.count_number,
        notes: `Discrepancy during cycle count: ${discrepancyNote}`,
      })
    }

    return auditItem
  }

  async completeAudit(auditId: number, notes?: string, userId?: number): Promise<CycleCountEntity> {
    const audit = await this.cycleRepo.findById(auditId)
    if (!audit) throw new CycleCountNotFoundError(auditId)

    const completed = await this.cycleRepo.completeCycleCount(auditId, notes)

    const discrepancies = audit.items?.filter((i) => i.is_discrepancy).length ?? 0

    await this.auditRepo.log({
      user_id: userId,
      action: 'CYCLE_COUNT',
      target_entity: 'CYCLE_COUNT',
      entity_id: audit.count_number,
      description: `Completed cycle count audit ${audit.count_number}. Audited items: ${audit.items?.length ?? 0}, Discrepancies: ${discrepancies}`,
    })

    return completed
  }

  async listAudits(): Promise<CycleCountEntity[]> {
    return this.cycleRepo.findCycleCounts()
  }

  async getAuditDetails(auditId: number): Promise<CycleCountEntity | null> {
    return this.cycleRepo.findById(auditId)
  }
}
