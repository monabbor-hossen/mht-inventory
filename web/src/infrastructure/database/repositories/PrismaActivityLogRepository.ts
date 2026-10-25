// ====================================================================
// Infrastructure Layer: Prisma Activity Log Repository
// ====================================================================

import { prisma } from '../prisma'
import { IActivityLogRepository } from '@/domain/repositories'
import { ActivityLogEntity } from '@/domain/entities'

export class PrismaActivityLogRepository implements IActivityLogRepository {
  async log(data: {
    user_id?: number | null
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SCAN'
    target_entity: string
    description: string
  }): Promise<ActivityLogEntity> {
    const entry = await prisma.activityLog.create({
      data: {
        user_id: data.user_id,
        action: data.action,
        target_entity: data.target_entity,
        description: data.description,
      },
    })
    return entry
  }

  async getRecentLogs(limit?: number): Promise<ActivityLogEntity[]> {
    const logs = await prisma.activityLog.findMany({
      take: limit ?? 50,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: { name: true, role: true },
        },
      },
    })
    return logs
  }
}
