// ====================================================================
// Infrastructure Layer: Repositories Index & Factory
// ====================================================================

export * from './PrismaUserRepository'
export * from './PrismaInventoryRepository'
export * from './PrismaExpenseRepository'
export * from './PrismaDamageRepository'
export * from './PrismaActivityLogRepository'

import { PrismaUserRepository } from './PrismaUserRepository'
import { PrismaInventoryRepository } from './PrismaInventoryRepository'
import { PrismaExpenseRepository } from './PrismaExpenseRepository'
import { PrismaDamageRepository } from './PrismaDamageRepository'
import { PrismaActivityLogRepository } from './PrismaActivityLogRepository'

// Singleton repository instances for Dependency Injection
export const userRepository = new PrismaUserRepository()
export const inventoryRepository = new PrismaInventoryRepository()
export const expenseRepository = new PrismaExpenseRepository()
export const damageRepository = new PrismaDamageRepository()
export const activityLogRepository = new PrismaActivityLogRepository()
