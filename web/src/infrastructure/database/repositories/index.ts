// ====================================================================
// Infrastructure Layer: Database Repositories Export
// ====================================================================

export * from './PrismaProductRepository'
export * from './PrismaLocationRepository'
export * from './PrismaBatchRepository'
export * from './PrismaBarcodeRepository'
export * from './PrismaInventoryTransactionRepository'
export * from './PrismaDamageRepository'
export * from './PrismaExpenseRepository'
export * from './PrismaUserRepository'
export * from './PrismaActivityLogRepository'
export * from './PrismaCycleCountRepository'

import { PrismaProductRepository } from './PrismaProductRepository'
import { PrismaLocationRepository } from './PrismaLocationRepository'
import { PrismaBatchRepository } from './PrismaBatchRepository'
import { PrismaBarcodeRepository } from './PrismaBarcodeRepository'
import { PrismaInventoryTransactionRepository } from './PrismaInventoryTransactionRepository'
import { PrismaDamageRepository } from './PrismaDamageRepository'
import { PrismaExpenseRepository } from './PrismaExpenseRepository'
import { PrismaUserRepository } from './PrismaUserRepository'
import { PrismaActivityLogRepository } from './PrismaActivityLogRepository'
import { PrismaCycleCountRepository } from './PrismaCycleCountRepository'

export const productRepository = new PrismaProductRepository()
export const locationRepository = new PrismaLocationRepository()
export const batchRepository = new PrismaBatchRepository()
export const barcodeRepository = new PrismaBarcodeRepository()
export const transactionRepository = new PrismaInventoryTransactionRepository()
export const damageRepository = new PrismaDamageRepository()
export const expenseRepository = new PrismaExpenseRepository()
export const userRepository = new PrismaUserRepository()
export const activityLogRepository = new PrismaActivityLogRepository()
export const cycleCountRepository = new PrismaCycleCountRepository()

export const inventoryRepository = {
  findBatches: (opt?: { status?: any; take?: number; skip?: number }) => batchRepository.findBatches(opt),
  findBatchById: (id: number) => batchRepository.findById(id),
  findBatchByNumber: (num: string) => batchRepository.findByBatchNumber(num),
  getStockSummary: async () => {
    const s = await barcodeRepository.getStockDashboardSummary()
    return {
      totalInStock: s.totalInStock,
      dispatchedToday: s.dispatchedToday,
    }
  },
}

