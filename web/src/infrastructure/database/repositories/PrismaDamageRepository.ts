// ====================================================================
// Infrastructure Layer: Prisma Damage Repository
// ====================================================================

import { prisma } from '../prisma'
import { IDamageRepository } from '@/domain/repositories'
import { DamageRecordEntity, DamageReason } from '@/domain/entities'

export class PrismaDamageRepository implements IDamageRepository {
  private toEntity(record: any): DamageRecordEntity {
    return {
      id: record.id,
      barcode_id: record.barcode_id,
      reason: record.reason as DamageReason,
      photo_url: record.photo_url,
      notes: record.notes,
      logged_by: record.logged_by,
      created_at: record.created_at,
      updated_at: record.updated_at,
      barcode: record.barcode,
      user: record.user,
    }
  }

  async createDamageRecord(data: {
    barcode_id: number
    reason: DamageReason
    photo_url?: string | null
    notes?: string | null
    logged_by: number
  }): Promise<DamageRecordEntity> {
    const record = await prisma.damageRecord.create({
      data: {
        barcode_id: data.barcode_id,
        reason: data.reason,
        photo_url: data.photo_url,
        notes: data.notes,
        logged_by: data.logged_by,
      },
      include: {
        barcode: { include: { batch: true, product: true } },
        user: true,
      },
    })
    return this.toEntity(record)
  }

  async findDamageRecords(limit?: number): Promise<DamageRecordEntity[]> {
    const records = await prisma.damageRecord.findMany({
      include: {
        barcode: { include: { batch: true, product: true } },
        user: true,
      },
      orderBy: { created_at: 'desc' },
      take: limit ?? 100,
    })
    return records.map((r) => this.toEntity(r))
  }

  async findByBarcodeId(barcode_id: number): Promise<DamageRecordEntity | null> {
    const record = await prisma.damageRecord.findUnique({
      where: { barcode_id },
      include: {
        barcode: { include: { batch: true, product: true } },
        user: true,
      },
    })
    return record ? this.toEntity(record) : null
  }
}
