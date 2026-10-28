// ====================================================================
// Infrastructure Layer: Prisma Batch Repository
// ====================================================================

import { prisma } from '../prisma'
import { IBatchRepository } from '@/domain/repositories'
import { BatchEntity, BarcodeItemEntity, BatchStatus } from '@/domain/entities'

export class PrismaBatchRepository implements IBatchRepository {
  private toEntity(record: any): BatchEntity {
    return {
      id: record.id,
      batch_number: record.batch_number,
      supplier_name: record.supplier_name,
      product_id: record.product_id,
      category: record.category,
      entry_date: record.entry_date,
      expected_quantity: record.expected_quantity,
      received_quantity: record.received_quantity,
      status: record.status as BatchStatus,
      notes: record.notes,
      created_at: record.created_at,
      updated_at: record.updated_at,
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
    }
  }

  async createBatch(data: {
    batch_number: string
    supplier_name?: string | null
    product_id?: number | null
    category?: string | null
    expected_quantity: number
    received_quantity?: number
    status: BatchStatus
    notes?: string | null
  }): Promise<BatchEntity> {
    const batch = await prisma.batch.create({
      data: {
        batch_number: data.batch_number,
        supplier_name: data.supplier_name,
        product_id: data.product_id,
        category: data.category,
        expected_quantity: data.expected_quantity,
        received_quantity: data.received_quantity ?? 0,
        status: data.status,
        notes: data.notes,
      },
      include: { product: true },
    })
    return this.toEntity(batch)
  }

  async findById(id: number): Promise<(BatchEntity & { barcodes?: BarcodeItemEntity[] }) | null> {
    const batch = await prisma.batch.findUnique({
      where: { id },
      include: {
        product: true,
        barcodes: {
          include: { location: true },
          orderBy: { id: 'asc' },
        },
      },
    })
    if (!batch) return null

    const entity = this.toEntity(batch)
    return {
      ...entity,
      barcodes: batch.barcodes.map((b: any) => ({
        id: b.id,
        barcode_string: b.barcode_string,
        batch_id: b.batch_id,
        product_id: b.product_id,
        location_id: b.location_id,
        status: b.status,
        scanned_by_user_id: b.scanned_by_user_id,
        dispatched_at: b.dispatched_at,
        created_at: b.created_at,
        updated_at: b.updated_at,
        location: b.location,
      })),
    }
  }

  async findByBatchNumber(batch_number: string): Promise<(BatchEntity & { barcodes?: BarcodeItemEntity[] }) | null> {
    const batch = await prisma.batch.findUnique({
      where: { batch_number },
      include: {
        product: true,
        barcodes: {
          include: { location: true },
          orderBy: { id: 'asc' },
        },
      },
    })
    if (!batch) return null

    const entity = this.toEntity(batch)
    return {
      ...entity,
      barcodes: batch.barcodes.map((b: any) => ({
        id: b.id,
        barcode_string: b.barcode_string,
        batch_id: b.batch_id,
        product_id: b.product_id,
        location_id: b.location_id,
        status: b.status,
        scanned_by_user_id: b.scanned_by_user_id,
        dispatched_at: b.dispatched_at,
        created_at: b.created_at,
        updated_at: b.updated_at,
        location: b.location,
      })),
    }
  }

  async findBatches(options?: { status?: BatchStatus; skip?: number; take?: number; productId?: number }): Promise<BatchEntity[]> {
    const where: any = {}
    if (options?.status) where.status = options.status
    if (options?.productId) where.product_id = options.productId

    const batches = await prisma.batch.findMany({
      where,
      include: {
        product: true,
        _count: { select: { barcodes: true } },
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { created_at: 'desc' },
    })

    return batches.map((b) => this.toEntity(b))
  }

  async updateBatch(
    id: number,
    data: Partial<Pick<BatchEntity, 'supplier_name' | 'category' | 'status' | 'expected_quantity' | 'received_quantity' | 'notes' | 'product_id'>>
  ): Promise<BatchEntity> {
    const batch = await prisma.batch.update({
      where: { id },
      data: {
        supplier_name: data.supplier_name,
        category: data.category,
        product_id: data.product_id,
        status: data.status,
        expected_quantity: data.expected_quantity,
        received_quantity: data.received_quantity,
        notes: data.notes,
      },
      include: { product: true },
    })
    return this.toEntity(batch)
  }

  // FIFO Rule: Find the oldest batch for a product that still has active (IN_STOCK) items
  async findOldestActiveBatchForProduct(productId: number): Promise<BatchEntity | null> {
    const oldestBatch = await prisma.batch.findFirst({
      where: {
        product_id: productId,
        barcodes: {
          some: { status: 'IN_STOCK' },
        },
      },
      orderBy: { entry_date: 'asc' },
      include: { product: true },
    })

    return oldestBatch ? this.toEntity(oldestBatch) : null
  }
}
