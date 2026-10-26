// ====================================================================
// Infrastructure Layer: Prisma Barcode Repository
// ====================================================================

import { prisma } from '../prisma'
import { IBarcodeRepository } from '@/domain/repositories'
import { BarcodeItemEntity, BarcodeStatus, BatchEntity, ProductEntity, LocationEntity } from '@/domain/entities'

export class PrismaBarcodeRepository implements IBarcodeRepository {
  private toEntity(record: any): BarcodeItemEntity & {
    batch?: BatchEntity
    product?: ProductEntity | null
    location?: LocationEntity | null
  } {
    return {
      id: record.id,
      barcode_string: record.barcode_string,
      batch_id: record.batch_id,
      product_id: record.product_id,
      location_id: record.location_id,
      status: record.status as BarcodeStatus,
      scanned_by_user_id: record.scanned_by_user_id,
      dispatched_at: record.dispatched_at,
      created_at: record.created_at,
      updated_at: record.updated_at,
      batch: record.batch
        ? {
            id: record.batch.id,
            batch_number: record.batch.batch_number,
            supplier_name: record.batch.supplier_name,
            product_id: record.batch.product_id,
            category: record.batch.category,
            entry_date: record.batch.entry_date,
            expected_quantity: record.batch.expected_quantity,
            received_quantity: record.batch.received_quantity,
            status: record.batch.status,
            notes: record.batch.notes,
            created_at: record.batch.created_at,
            updated_at: record.batch.updated_at,
          }
        : undefined,
      product: record.product
        ? {
            id: record.product.id,
            sku: record.product.sku,
            name: record.product.name,
            category: record.product.category,
            unit_weight: Number(record.product.unit_weight),
            unit_of_measure: record.product.unit_of_measure,
            description: record.product.description,
            min_stock_alert: record.product.min_stock_alert,
            is_active: record.product.is_active,
            created_at: record.product.created_at,
            updated_at: record.product.updated_at,
          }
        : null,
      location: record.location
        ? {
            id: record.location.id,
            code: record.location.code,
            zone: record.location.zone,
            aisle: record.location.aisle,
            rack: record.location.rack,
            bin: record.location.bin,
            description: record.location.description,
            max_capacity: record.location.max_capacity,
            is_active: record.location.is_active,
            created_at: record.location.created_at,
            updated_at: record.location.updated_at,
          }
        : null,
    }
  }

  async createBarcodes(
    batch_id: number,
    items: Array<{ barcode_string: string; product_id?: number | null; location_id?: number | null; status?: BarcodeStatus }>
  ): Promise<BarcodeItemEntity[]> {
    if (items.length === 0) return []

    await prisma.barcodeItem.createMany({
      data: items.map((i) => ({
        barcode_string: i.barcode_string,
        batch_id,
        product_id: i.product_id,
        location_id: i.location_id,
        status: i.status ?? 'IN_STOCK',
      })),
      skipDuplicates: true,
    })

    const created = await prisma.barcodeItem.findMany({
      where: {
        batch_id,
        barcode_string: { in: items.map((i) => i.barcode_string) },
      },
      include: { product: true, location: true },
    })

    return created.map((r) => this.toEntity(r))
  }

  async findByString(barcode_string: string): Promise<
    (BarcodeItemEntity & {
      batch: BatchEntity
      product?: ProductEntity | null
      location?: LocationEntity | null
    }) | null
  > {
    const item = await prisma.barcodeItem.findUnique({
      where: { barcode_string },
      include: {
        batch: { include: { product: true } },
        product: true,
        location: true,
      },
    })
    if (!item) return null
    return this.toEntity(item) as any
  }

  async updateStatus(
    barcode_string: string,
    status: BarcodeStatus,
    options?: {
      scanned_by_user_id?: number | null
      dispatched_at?: Date | null
      location_id?: number | null
    }
  ): Promise<BarcodeItemEntity> {
    const item = await prisma.barcodeItem.update({
      where: { barcode_string },
      data: {
        status,
        scanned_by_user_id: options?.scanned_by_user_id,
        dispatched_at: options?.dispatched_at,
        location_id: options?.location_id,
      },
      include: { batch: true, product: true, location: true },
    })
    return this.toEntity(item)
  }

  async relocateItem(barcode_string: string, target_location_id: number): Promise<BarcodeItemEntity> {
    const item = await prisma.barcodeItem.update({
      where: { barcode_string },
      data: { location_id: target_location_id },
      include: { batch: true, product: true, location: true },
    })
    return this.toEntity(item)
  }

  async voidBarcodes(barcode_strings: string[]): Promise<number> {
    const res = await prisma.barcodeItem.updateMany({
      where: { barcode_string: { in: barcode_strings } },
      data: { status: 'VOID' },
    })
    return res.count
  }

  async getStockDashboardSummary(): Promise<{
    totalInStock: number
    dispatchedToday: number
    damagedTotal: number
    quarantineTotal: number
  }> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [totalInStock, dispatchedToday, damagedTotal, quarantineTotal] = await Promise.all([
      prisma.barcodeItem.count({ where: { status: 'IN_STOCK' } }),
      prisma.barcodeItem.count({
        where: {
          status: 'DISPATCHED',
          dispatched_at: { gte: today },
        },
      }),
      prisma.barcodeItem.count({ where: { status: 'DAMAGED' } }),
      prisma.barcodeItem.count({ where: { status: 'QUARANTINE' } }),
    ])

    return {
      totalInStock,
      dispatchedToday,
      damagedTotal,
      quarantineTotal,
    }
  }

  async findItemsByLocation(location_id: number): Promise<BarcodeItemEntity[]> {
    const items = await prisma.barcodeItem.findMany({
      where: { location_id, status: 'IN_STOCK' },
      include: { batch: true, product: true, location: true },
    })
    return items.map((i) => this.toEntity(i))
  }

  async findItemsByBatch(batch_id: number): Promise<BarcodeItemEntity[]> {
    const items = await prisma.barcodeItem.findMany({
      where: { batch_id },
      include: { batch: true, product: true, location: true },
    })
    return items.map((i) => this.toEntity(i))
  }
}
