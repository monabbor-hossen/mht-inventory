// ====================================================================
// Infrastructure Layer: Prisma Product Repository
// ====================================================================

import { prisma } from '../prisma'
import { IProductRepository } from '@/domain/repositories'
import { ProductEntity } from '@/domain/entities'

export class PrismaProductRepository implements IProductRepository {
  private toEntity(record: any): ProductEntity {
    return {
      id: record.id,
      sku: record.sku,
      name: record.name,
      category: record.category,
      unit_weight: Number(record.unit_weight),
      unit_of_measure: record.unit_of_measure,
      description: record.description,
      min_stock_alert: record.min_stock_alert,
      is_active: record.is_active,
      created_at: record.created_at,
      updated_at: record.updated_at,
    }
  }

  async createProduct(data: {
    sku: string
    name: string
    category: string
    unit_weight: number
    unit_of_measure?: string
    description?: string | null
    min_stock_alert?: number
  }): Promise<ProductEntity> {
    const product = await prisma.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        category: data.category,
        unit_weight: data.unit_weight,
        unit_of_measure: data.unit_of_measure ?? 'kg',
        description: data.description,
        min_stock_alert: data.min_stock_alert ?? 10,
      },
    })
    return this.toEntity(product)
  }

  async findById(id: number): Promise<ProductEntity | null> {
    const product = await prisma.product.findUnique({ where: { id } })
    return product ? this.toEntity(product) : null
  }

  async findBySku(sku: string): Promise<ProductEntity | null> {
    const product = await prisma.product.findUnique({ where: { sku } })
    return product ? this.toEntity(product) : null
  }

  async findProducts(filter?: { category?: string; query?: string; is_active?: boolean }): Promise<ProductEntity[]> {
    const where: any = {}
    if (filter?.category) where.category = filter.category
    if (filter?.is_active !== undefined) where.is_active = filter.is_active
    if (filter?.query) {
      where.OR = [
        { name: { contains: filter.query } },
        { sku: { contains: filter.query } },
      ]
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { created_at: 'desc' },
    })
    return products.map((p) => this.toEntity(p))
  }

  async updateProduct(id: number, data: Partial<Omit<ProductEntity, 'id' | 'created_at' | 'updated_at'>>): Promise<ProductEntity> {
    const product = await prisma.product.update({
      where: { id },
      data: {
        sku: data.sku,
        name: data.name,
        category: data.category,
        unit_weight: data.unit_weight,
        unit_of_measure: data.unit_of_measure,
        description: data.description,
        min_stock_alert: data.min_stock_alert,
        is_active: data.is_active,
      },
    })
    return this.toEntity(product)
  }
}
