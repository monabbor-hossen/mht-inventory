// ====================================================================
// Infrastructure Layer: Prisma Cycle Count Repository
// Auditing physical stock against system records
// ====================================================================

import { prisma } from '../prisma'
import { ICycleCountRepository } from '@/domain/repositories'
import {
  CycleCountEntity,
  CycleCountItemEntity,
  CycleCountStatus,
  BarcodeStatus,
} from '@/domain/entities'

export class PrismaCycleCountRepository implements ICycleCountRepository {
  private toEntity(record: any): CycleCountEntity {
    return {
      id: record.id,
      count_number: record.count_number,
      location_id: record.location_id,
      status: record.status as CycleCountStatus,
      conducted_by: record.conducted_by,
      notes: record.notes,
      started_at: record.started_at,
      completed_at: record.completed_at,
      created_at: record.created_at,
      updated_at: record.updated_at,
      location: record.location,
      items: record.items?.map((item: any) => ({
        id: item.id,
        cycle_count_id: item.cycle_count_id,
        barcode_id: item.barcode_id,
        expected_status: item.expected_status as BarcodeStatus,
        counted_status: item.counted_status as BarcodeStatus,
        is_discrepancy: item.is_discrepancy,
        notes: item.notes,
        counted_at: item.counted_at,
        barcode: item.barcode,
      })),
    }
  }

  async createCycleCount(data: {
    count_number: string
    location_id?: number | null
    conducted_by?: number | null
    notes?: string | null
  }): Promise<CycleCountEntity> {
    const record = await prisma.cycleCount.create({
      data: {
        count_number: data.count_number,
        location_id: data.location_id,
        conducted_by: data.conducted_by,
        notes: data.notes,
        status: 'IN_PROGRESS',
        started_at: new Date(),
      },
      include: { location: true },
    })
    return this.toEntity(record)
  }

  async findById(id: number): Promise<(CycleCountEntity & { items: CycleCountItemEntity[] }) | null> {
    const record = await prisma.cycleCount.findUnique({
      where: { id },
      include: {
        location: true,
        items: {
          include: {
            barcode: { include: { product: true, batch: true } },
          },
        },
      },
    })
    return record ? (this.toEntity(record) as any) : null
  }

  async findByCountNumber(count_number: string): Promise<(CycleCountEntity & { items: CycleCountItemEntity[] }) | null> {
    const record = await prisma.cycleCount.findUnique({
      where: { count_number },
      include: {
        location: true,
        items: {
          include: {
            barcode: { include: { product: true, batch: true } },
          },
        },
      },
    })
    return record ? (this.toEntity(record) as any) : null
  }

  async findCycleCounts(status?: CycleCountStatus): Promise<CycleCountEntity[]> {
    const where: any = {}
    if (status) where.status = status

    const list = await prisma.cycleCount.findMany({
      where,
      include: {
        location: true,
        items: true,
        user: true,
      },
      orderBy: { created_at: 'desc' },
    })
    return list.map((c) => this.toEntity(c))
  }

  async recordItemAudit(data: {
    cycle_count_id: number
    barcode_id: number
    expected_status: BarcodeStatus
    counted_status: BarcodeStatus
    is_discrepancy: boolean
    notes?: string | null
  }): Promise<CycleCountItemEntity> {
    const item = await prisma.cycleCountItem.create({
      data: {
        cycle_count_id: data.cycle_count_id,
        barcode_id: data.barcode_id,
        expected_status: data.expected_status,
        counted_status: data.counted_status,
        is_discrepancy: data.is_discrepancy,
        notes: data.notes,
      },
      include: {
        barcode: { include: { product: true, batch: true } },
      },
    })
    return {
      id: item.id,
      cycle_count_id: item.cycle_count_id,
      barcode_id: item.barcode_id,
      expected_status: item.expected_status as BarcodeStatus,
      counted_status: item.counted_status as BarcodeStatus,
      is_discrepancy: item.is_discrepancy,
      notes: item.notes,
      counted_at: item.counted_at,
      barcode: item.barcode as any,
    }
  }

  async completeCycleCount(id: number, notes?: string | null): Promise<CycleCountEntity> {
    const record = await prisma.cycleCount.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completed_at: new Date(),
        notes: notes ? notes : undefined,
      },
      include: { location: true, items: true },
    })
    return this.toEntity(record)
  }
}
