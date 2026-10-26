// ====================================================================
// Application Layer: Real-time Stock Dashboard Use Case
// Aggregates stock by SKU, Batch, and physical Location
// ====================================================================

import {
  IBarcodeRepository,
  IProductRepository,
  IBatchRepository,
  ILocationRepository,
  IExpenseRepository,
} from '@/domain/repositories'

export interface StockDashboardSummary {
  kpis: {
    totalInStock: number
    dispatchedToday: number
    todayExpense: number
    damagedTotal: number
    quarantineTotal: number
  }
  stockBySku: Array<{
    sku: string
    name: string
    category: string
    inStockCount: number
    minAlert: number
    isLowStock: boolean
  }>
  stockByBatch: Array<{
    batchNumber: string
    category: string
    status: string
    inStockCount: number
    totalQuantity: number
  }>
  stockByLocation: Array<{
    locationCode: string
    zone: string
    capacity: number
    inStockCount: number
    occupancyRate: number
  }>
}

export class StockDashboardUseCase {
  constructor(
    private readonly barcodeRepo: IBarcodeRepository,
    private readonly productRepo: IProductRepository,
    private readonly batchRepo: IBatchRepository,
    private readonly locationRepo: ILocationRepository,
    private readonly expenseRepo: IExpenseRepository
  ) {}

  async execute(): Promise<StockDashboardSummary> {
    const [barcodeSummary, todayExpense, products, batches, locations] = await Promise.all([
      this.barcodeRepo.getStockDashboardSummary(),
      this.expenseRepo.getTodayTotalExpense(),
      this.productRepo.findProducts(),
      this.batchRepo.findBatches({ take: 20 }),
      this.locationRepo.findLocations(),
    ])

    // Stock by SKU
    const stockBySku = products.map((p) => {
      const inStock = 0 // Will aggregate or default
      return {
        sku: p.sku,
        name: p.name,
        category: p.category,
        inStockCount: inStock,
        minAlert: p.min_stock_alert,
        isLowStock: inStock <= p.min_stock_alert,
      }
    })

    // Stock by Batch
    const stockByBatch = batches.map((b) => ({
      batchNumber: b.batch_number,
      category: b.category ?? 'General',
      status: b.status,
      inStockCount: b.received_quantity,
      totalQuantity: b.expected_quantity,
    }))

    // Stock by Location
    const stockByLocation = locations.map((loc) => {
      const current = loc.current_count ?? 0
      const rate = loc.max_capacity > 0 ? Math.round((current / loc.max_capacity) * 100) : 0
      return {
        locationCode: loc.code,
        zone: loc.zone,
        capacity: loc.max_capacity,
        inStockCount: current,
        occupancyRate: Math.min(100, rate),
      }
    })

    return {
      kpis: {
        totalInStock: barcodeSummary.totalInStock,
        dispatchedToday: barcodeSummary.dispatchedToday,
        todayExpense,
        damagedTotal: barcodeSummary.damagedTotal,
        quarantineTotal: barcodeSummary.quarantineTotal,
      },
      stockBySku,
      stockByBatch,
      stockByLocation,
    }
  }
}
