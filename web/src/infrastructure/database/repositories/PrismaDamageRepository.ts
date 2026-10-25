// ====================================================================
// Infrastructure Layer: Prisma Damage Repository
// ====================================================================

import { prisma } from '../prisma'
import { IDamageRepository } from '@/domain/repositories'
import { DamageRecordEntity } from '@/domain/entities'

export class PrismaDamageRepository implements IDamageRepository {
  async createDamageRecord(data: {
    barcode_id: number
    reason: 'Torn' | 'Moisture' | 'Weight_Shortage'
    photo_url?: string | null
    logged_by: number
  }): Promise<DamageRecordEntity> {
    const record = await prisma.damageRecord.create({
      data: {
        barcode_id: data.barcode_id,
        reason: data.reason,
        photo_url: data.photo_url,
        logged_by: data.logged_by,
      },
    })
    return record
  }

  async findDamageRecords(limit?: number): Promise<DamageRecordEntity[]> {
    const records = await prisma.damageRecord.findMany({
      take: limit ?? 50,
      orderBy: { created_at: 'desc' },
      include: {
        barcode: {
          include: {
            batch: true,
          },
        },
        user: {
          select: { name: true, role: true },
        },
      },
    })
    return records
  }
}
