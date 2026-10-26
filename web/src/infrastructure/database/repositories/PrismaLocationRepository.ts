// ====================================================================
// Infrastructure Layer: Prisma Location Repository
// ====================================================================

import { prisma } from '../prisma'
import { ILocationRepository } from '@/domain/repositories'
import { LocationEntity } from '@/domain/entities'

export class PrismaLocationRepository implements ILocationRepository {
  private toEntity(record: any): LocationEntity {
    return {
      id: record.id,
      code: record.code,
      zone: record.zone,
      aisle: record.aisle,
      rack: record.rack,
      bin: record.bin,
      description: record.description,
      max_capacity: record.max_capacity,
      is_active: record.is_active,
      created_at: record.created_at,
      updated_at: record.updated_at,
      current_count: record._count?.barcode_items ?? undefined,
    }
  }

  async createLocation(data: {
    code: string
    zone: string
    aisle: string
    rack: string
    bin: string
    description?: string | null
    max_capacity?: number
  }): Promise<LocationEntity> {
    const location = await prisma.location.create({
      data: {
        code: data.code,
        zone: data.zone,
        aisle: data.aisle,
        rack: data.rack,
        bin: data.bin,
        description: data.description,
        max_capacity: data.max_capacity ?? 100,
      },
    })
    return this.toEntity(location)
  }

  async findById(id: number): Promise<LocationEntity | null> {
    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        _count: {
          select: { barcode_items: { where: { status: 'IN_STOCK' } } },
        },
      },
    })
    return location ? this.toEntity(location) : null
  }

  async findByCode(code: string): Promise<LocationEntity | null> {
    const location = await prisma.location.findUnique({
      where: { code },
      include: {
        _count: {
          select: { barcode_items: { where: { status: 'IN_STOCK' } } },
        },
      },
    })
    return location ? this.toEntity(location) : null
  }

  async findLocations(filter?: { zone?: string; is_active?: boolean }): Promise<LocationEntity[]> {
    const where: any = {}
    if (filter?.zone) where.zone = filter.zone
    if (filter?.is_active !== undefined) where.is_active = filter.is_active

    const locations = await prisma.location.findMany({
      where,
      include: {
        _count: {
          select: { barcode_items: { where: { status: 'IN_STOCK' } } },
        },
      },
      orderBy: [{ zone: 'asc' }, { aisle: 'asc' }, { rack: 'asc' }, { bin: 'asc' }],
    })
    return locations.map((l) => this.toEntity(l))
  }

  async getLocationCapacity(id: number): Promise<{ capacity: number; currentStock: number }> {
    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        _count: {
          select: { barcode_items: { where: { status: 'IN_STOCK' } } },
        },
      },
    })
    if (!location) return { capacity: 0, currentStock: 0 }
    return {
      capacity: location.max_capacity,
      currentStock: location._count.barcode_items,
    }
  }

  async updateLocation(id: number, data: Partial<Omit<LocationEntity, 'id' | 'created_at' | 'updated_at'>>): Promise<LocationEntity> {
    const location = await prisma.location.update({
      where: { id },
      data: {
        code: data.code,
        zone: data.zone,
        aisle: data.aisle,
        rack: data.rack,
        bin: data.bin,
        description: data.description,
        max_capacity: data.max_capacity,
        is_active: data.is_active,
      },
    })
    return this.toEntity(location)
  }
}
