// ====================================================================
// Infrastructure Layer: Dependency Injection Container
// Composition Root wiring Prisma Repositories into Application Use Cases
// ====================================================================

import {
  PrismaProductRepository,
  PrismaLocationRepository,
  PrismaBatchRepository,
  PrismaBarcodeRepository,
  PrismaInventoryTransactionRepository,
  PrismaDamageRepository,
  PrismaExpenseRepository,
  PrismaUserRepository,
  PrismaActivityLogRepository,
  PrismaCycleCountRepository,
} from './database/repositories'

import {
  ProductUseCases,
  LocationUseCases,
  InboundUseCases,
  DispatchItemUseCase,
  CycleCountUseCases,
  StockDashboardUseCase,
  DamageStockUseCase,
  ExpenseUseCases,
  AuditTrailUseCase,
} from '@/application/use-cases'

class ServiceContainer {
  // Repositories
  public readonly productRepo = new PrismaProductRepository()
  public readonly locationRepo = new PrismaLocationRepository()
  public readonly batchRepo = new PrismaBatchRepository()
  public readonly barcodeRepo = new PrismaBarcodeRepository()
  public readonly txRepo = new PrismaInventoryTransactionRepository()
  public readonly damageRepo = new PrismaDamageRepository()
  public readonly expenseRepo = new PrismaExpenseRepository()
  public readonly userRepo = new PrismaUserRepository()
  public readonly auditRepo = new PrismaActivityLogRepository()
  public readonly cycleRepo = new PrismaCycleCountRepository()

  // Use Cases (Dependency Injected)
  public readonly productUseCases = new ProductUseCases(this.productRepo, this.auditRepo)
  public readonly locationUseCases = new LocationUseCases(
    this.locationRepo,
    this.barcodeRepo,
    this.txRepo,
    this.auditRepo
  )
  public readonly inboundUseCases = new InboundUseCases(
    this.batchRepo,
    this.barcodeRepo,
    this.productRepo,
    this.txRepo,
    this.auditRepo
  )
  public readonly dispatchUseCase = new DispatchItemUseCase(
    this.barcodeRepo,
    this.batchRepo,
    this.txRepo,
    this.auditRepo
  )
  public readonly cycleCountUseCases = new CycleCountUseCases(
    this.cycleRepo,
    this.barcodeRepo,
    this.locationRepo,
    this.txRepo,
    this.auditRepo
  )
  public readonly stockDashboardUseCase = new StockDashboardUseCase(
    this.barcodeRepo,
    this.productRepo,
    this.batchRepo,
    this.locationRepo,
    this.expenseRepo
  )
  public readonly damageUseCases = new DamageStockUseCase(
    this.damageRepo,
    this.barcodeRepo,
    this.txRepo,
    this.auditRepo
  )
  public readonly expenseUseCases = new ExpenseUseCases(this.expenseRepo, this.auditRepo)
  public readonly auditTrailUseCase = new AuditTrailUseCase(this.auditRepo, this.txRepo)
}

export const container = new ServiceContainer()
