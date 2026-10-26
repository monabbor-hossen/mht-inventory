// ====================================================================
// Application Layer: Use Cases Export
// ====================================================================

export * from './ProductUseCases'
export * from './LocationUseCases'
export * from './InboundUseCases'
export * from './DispatchItemUseCase'
export * from './CycleCountUseCases'
export * from './StockDashboardUseCase'
export * from './DamageStockUseCase'
export * from './ExpenseUseCases'
export * from './AuditTrailUseCase'
export * from './InventoryUseCases'
export * from './DashboardUseCases'
export * from './OfflineSyncUseCase'

import {
  productRepository,
  locationRepository,
  batchRepository,
  barcodeRepository,
  transactionRepository,
  damageRepository,
  expenseRepository,
  userRepository,
  activityLogRepository,
  cycleCountRepository,
  inventoryRepository,
} from '@/infrastructure/database/repositories'

import { InventoryUseCases } from './InventoryUseCases'
import { DashboardUseCases } from './DashboardUseCases'
import { ExpenseUseCases } from './ExpenseUseCases'
import { OfflineSyncUseCase } from './OfflineSyncUseCase'

export const inventoryUseCases = new InventoryUseCases(
  batchRepository,
  barcodeRepository,
  activityLogRepository,
  damageRepository,
  transactionRepository
)

export const dashboardUseCases = new DashboardUseCases(
  batchRepository,
  barcodeRepository,
  expenseRepository,
  activityLogRepository,
  damageRepository
)

export const expenseUseCases = new ExpenseUseCases(
  expenseRepository,
  activityLogRepository
)

export const offlineSyncUseCase = new OfflineSyncUseCase(
  inventoryUseCases,
  expenseUseCases
)

export {
  inventoryRepository,
  activityLogRepository,
  damageRepository,
  expenseRepository,
  userRepository,
}

