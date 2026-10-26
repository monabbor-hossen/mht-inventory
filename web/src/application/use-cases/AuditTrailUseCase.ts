// ====================================================================
// Application Layer: Activity Audit & Reporting Use Cases
// ====================================================================

import {
  IActivityLogRepository,
  IInventoryTransactionRepository,
} from '@/domain/repositories'
import { ActivityLogEntity, InventoryTransactionEntity } from '@/domain/entities'

export class AuditTrailUseCase {
  constructor(
    private readonly auditRepo: IActivityLogRepository,
    private readonly txRepo: IInventoryTransactionRepository
  ) {}

  async getRecentLogs(limit = 100): Promise<ActivityLogEntity[]> {
    return this.auditRepo.getRecentLogs(limit)
  }

  async getMovementLedger(filter?: {
    startDate?: Date
    endDate?: Date
    limit?: number
  }): Promise<InventoryTransactionEntity[]> {
    return this.txRepo.findTransactions(filter)
  }
}
