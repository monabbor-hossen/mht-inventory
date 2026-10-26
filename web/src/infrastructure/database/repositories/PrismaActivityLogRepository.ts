// ====================================================================
// Infrastructure Layer: Prisma Activity Log Repository
// ====================================================================

import { prisma } from '../prisma'
import { IActivityLogRepository } from '@/domain/repositories'
import { ActivityLogEntity, LogAction } from '@/domain/entities'

export class PrismaActivityLogRepository implements IActivityLogRepository {
  private toEntity(record: any): ActivityLogEntity {
    return {
      id: record.id,
      user_id: record.user_id,
      action: record.action as LogAction,
      target_entity: record.target_entity,
      entity_id: record.entity_id,
      description: record.description,
      metadata: record.metadata as Record<string, unknown> | null,
      timestamp: record.timestamp,
      user: record.user,
    }
  }

  async log(data: {
    user_id?: number | null
    action: LogAction
    target_entity: string
    entity_id?: string | null
    description: string
    metadata?: Record<string, unknown> | null
  }): Promise<ActivityLogEntity> {
    const record = await prisma.activityLog.create({
      data: {
        user_id: data.user_id,
        action: data.action,
        target_entity: data.target_entity,
        entity_id: data.entity_id,
        description: data.description,
        metadata: data.metadata ? (data.metadata as any) : undefined,
      },
      include: { user: true },
    })
    return this.toEntity(record)
  }

  async getRecentLogs(limit = 50): Promise<ActivityLogEntity[]> {
    const logs = await prisma.activityLog.findMany({
      include: { user: true },
      orderBy: { timestamp: 'desc' },
      take: limit,
    })
    return logs.map((l) => this.toEntity(l))
  }
}
