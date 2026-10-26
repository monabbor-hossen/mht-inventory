// ====================================================================
// Infrastructure Layer: Prisma Inventory Transaction Repository
// Immutable stock movement ledger
// ====================================================================

import { prisma } from '../prisma'
import { IInventoryTransactionRepository } from '@/domain/repositories'
import { InventoryTransactionEntity, TransactionType } from '@/domain/entities'

export class PrismaInventoryTransactionRepository implements IInventoryTransactionRepository {
  private toEntity(record: any): InventoryTransactionEntity {
    return {
      id: record.id,
      barcode_item_id: record.barcode_item_id,
      product_id: record.product_id,
      batch_id: record.batch_id,
      from_location_id: record.from_location_id,
      to_location_id: record.to_location_id,
      movement_type: record.movement_type as TransactionType,
      quantity: record.quantity,
      user_id: record.user_id,
      reference_number: record.reference_number,
      notes: record.notes,
      created_at: record.created_at,
      product: record.product,
      batch: record.batch,
      from_location: record.from_location,
      to_location: record.to_location,
      user: record.user,
    }
  }

  async recordTransaction(data: {
    barcode_item_id?: number | null
    product_id?: number | null
    batch_id?: number | null
    from_location_id?: number | null
    to_location_id?: number | null
    movement_type: TransactionType
    quantity?: number
    user_id?: number | null
    reference_number?: string | null
    notes?: string | null
  }): Promise<InventoryTransactionEntity> {
    const tx = await prisma.inventoryTransaction.create({
      data: {
        barcode_item_id: data.barcode_item_id,
        product_id: data.product_id,
        batch_id: data.batch_id,
        from_location_id: data.from_location_id,
        to_location_id: data.to_location_id,
        movement_type: data.movement_type,
        quantity: data.quantity ?? 1,
        user_id: data.user_id,
        reference_number: data.reference_number,
        notes: data.notes,
      },
      include: {
        product: true,
        batch: true,
        from_location: true,
        to_location: true,
        user: true,
      },
    })
    return this.toEntity(tx)
  }

  async findTransactions(filter?: {
    barcode_item_id?: number
    product_id?: number
    movement_type?: TransactionType
    startDate?: Date
    endDate?: Date
    limit?: number
  }): Promise<InventoryTransactionEntity[]> {
    const where: any = {}
    if (filter?.barcode_item_id) where.barcode_item_id = filter.barcode_item_id
    if (filter?.product_id) where.product_id = filter.product_id
    if (filter?.movement_type) where.movement_type = filter.movement_type
    if (filter?.startDate || filter?.endDate) {
      where.created_at = {}
      if (filter.startDate) where.created_at.gte = filter.startDate
      if (filter.endDate) where.created_at.lte = filter.endDate
    }

    const list = await prisma.inventoryTransaction.findMany({
      where,
      include: {
        product: true,
        batch: true,
        from_location: true,
        to_location: true,
        user: true,
        barcode_item: true,
      },
      orderBy: { created_at: 'desc' },
      take: filter?.limit ?? 100,
    })

    return list.map((t) => this.toEntity(t))
  }
}
