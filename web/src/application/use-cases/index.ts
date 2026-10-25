// ====================================================================
// Application Layer: Use Cases Index & DI Assembly
// ====================================================================

export * from './InventoryUseCases'
export * from './ExpenseUseCases'
export * from './DashboardUseCases'
export * from './OfflineSyncUseCase'

import {
  activityLogRepository,
  damageRepository,
  expenseRepository,
  inventoryRepository,
  userRepository,
} from '@/infrastructure/database/repositories'
import { InventoryUseCases } from './InventoryUseCases'
import { ExpenseUseCases } from './ExpenseUseCases'
import { DashboardUseCases } from './DashboardUseCases'
import { OfflineSyncUseCase } from './OfflineSyncUseCase'

// Dependency Injection: Wire Repositories into Use Cases
export const inventoryUseCases = new InventoryUseCases(
  inventoryRepository,
  activityLogRepository,
  damageRepository
)

export const expenseUseCases = new ExpenseUseCases(
  expenseRepository,
  activityLogRepository
)

export const dashboardUseCases = new DashboardUseCases(
  inventoryRepository,
  expenseRepository,
  activityLogRepository,
  damageRepository
)

export const offlineSyncUseCase = new OfflineSyncUseCase(
  inventoryUseCases,
  expenseUseCases
)

export { userRepository, inventoryRepository, expenseRepository, damageRepository, activityLogRepository }
