// ====================================================================
// Infrastructure Layer: Prisma Inventory Repository
// ====================================================================

import { prisma } from '../prisma'
import { IInventoryRepository } from '@/domain/repositories'
import {
  BarcodeItemEntity,
  BarcodeStatus,
  BatchEntity,
  BatchStatus,
} from '@/domain/entities'

export class PrismaInventoryRepository implements IInventoryRepository {
  async createBatch(data: {
    batch_number: string
    supplier_name?: string | null
    category?: string | null
    total_quantity: number
    status: BatchStatus
  }): Promise<BatchEntity> {
    const batch = await prisma.batch.create({
      data: {
        batch_number: data.batch_number,
        supplier_name: data.supplier_name,
        category: data.category,
        total_quantity: data.total_quantity,
        status: data.status,
      },
    })
    return batch
  }

  async findBatchById(id: number): Promise<(BatchEntity & { barcodes?: BarcodeItemEntity[] }) | null> {
    const batch = await prisma.batch.findUnique({
      where: { id },
      include: {
        barcodes: {
          orderBy: { id: 'asc' },
        },
      },
    })
    if (!batch) return null
    return batch
  }

  async findBatchByNumber(batch_number: string): Promise<(BatchEntity & { barcodes?: BarcodeItemEntity[] }) | null> {
    const batch = await prisma.batch.findUnique({
      where: { batch_number },
      include: {
        barcodes: {
          orderBy: { id: 'asc' },
        },
      },
    })
    if (!batch) return null
    return batch
  }

  async findBatches(options?: { status?: BatchStatus; skip?: number; take?: number }): Promise<BatchEntity[]> {
    const batches = await prisma.batch.findMany({
      where: options?.status ? { status: options.status } : undefined,
      skip: options?.skip,
      take: options?.take ?? 100,
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: { barcodes: true },
        },
      },
    })
    return batches
  }

  async updateBatch(
    id: number,
    data: Partial<Pick<BatchEntity, 'supplier_name' | 'category' | 'status' | 'total_quantity'>>
  ): Promise<BatchEntity> {
    const updated = await prisma.batch.update({
      where: { id },
      data: {
        supplier_name: data.supplier_name,
        category: data.category,
        status: data.status,
        total_quantity: data.total_quantity,
      },
    })
    return updated
  }

  async createBarcodes(batch_id: number, barcode_strings: string[]): Promise<BarcodeItemEntity[]> {
    if (barcode_strings.length === 0) return []

    // Use createMany for high performance batch insertion
    await prisma.barcodeItem.createMany({
      data: barcode_strings.map((str) => ({
        barcode_string: str,
        batch_id,
        status: 'IN_STOCK' as const,
      })),
      skipDuplicates: true,
    })

    const items = await prisma.barcodeItem.findMany({
      where: {
        batch_id,
        barcode_string: { in: barcode_strings },
      },
      orderBy: { id: 'asc' },
    })

    return items
  }

  async findBarcodeByString(barcode_string: string): Promise<(BarcodeItemEntity & { batch: BatchEntity }) | null> {
    const item = await prisma.barcodeItem.findUnique({
      where: { barcode_string },
      include: {
        batch: true,
      },
    })
    if (!item) return null
    return item
  }

  async updateBarcodeStatus(
    barcode_string: string,
    status: BarcodeStatus,
    scanned_by_user_id?: number | null,
    dispatched_at?: Date | null
  ): Promise<BarcodeItemEntity> {
    const updated = await prisma.barcodeItem.update({
      where: { barcode_string },
      data: {
        status,
        scanned_by_user_id: scanned_by_user_id !== undefined ? scanned_by_user_id : undefined,
        dispatched_at: dispatched_at !== undefined ? dispatched_at : undefined,
      },
    })
    return updated
  }

  async voidBarcodes(barcode_strings: string[]): Promise<number> {
    if (barcode_strings.length === 0) return 0
    const result = await prisma.barcodeItem.updateMany({
      where: {
        barcode_string: { in: barcode_strings },
        status: 'IN_STOCK',
      },
      data: {
        status: 'VOID',
      },
    })
    return result.count
  }

  async getStockSummary(): Promise<{
    totalInStock: number
    dispatchedToday: number
  }> {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const [totalInStock, dispatchedToday] = await Promise.all([
      prisma.barcodeItem.count({
        where: { status: 'IN_STOCK' },
      }),
      prisma.barcodeItem.count({
        where: {
          status: 'DISPATCHED',
          dispatched_at: { gte: startOfToday },
        },
      }),
    ])

    return { totalInStock, dispatchedToday }
  }
}
