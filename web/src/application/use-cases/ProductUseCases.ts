// ====================================================================
// Application Layer: Product Catalog Use Cases
// ====================================================================

import { IProductRepository, IActivityLogRepository } from '@/domain/repositories'
import { ProductEntity } from '@/domain/entities'
import { CreateProductDto } from '../dto'
import { ProductAlreadyExistsError, ProductNotFoundError, ValidationError } from '@/domain/errors'

export class ProductUseCases {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly auditRepo: IActivityLogRepository
  ) {}

  async createProduct(dto: CreateProductDto, userId?: number): Promise<ProductEntity> {
    if (!dto.sku || !dto.name || !dto.category) {
      throw new ValidationError('SKU, product name, and category are required.')
    }
    if (dto.unit_weight <= 0) {
      throw new ValidationError('Unit weight must be a positive number.')
    }

    const existing = await this.productRepo.findBySku(dto.sku)
    if (existing) {
      throw new ProductAlreadyExistsError(dto.sku)
    }

    const product = await this.productRepo.createProduct(dto)

    await this.auditRepo.log({
      user_id: userId,
      action: 'CREATE',
      target_entity: 'PRODUCT',
      entity_id: product.sku,
      description: `Created new master product "${product.name}" (SKU: ${product.sku})`,
    })

    return product
  }

  async getProductBySku(sku: string): Promise<ProductEntity> {
    const product = await this.productRepo.findBySku(sku)
    if (!product) {
      throw new ProductNotFoundError(sku)
    }
    return product
  }

  async listProducts(filter?: { category?: string; query?: string; is_active?: boolean }): Promise<ProductEntity[]> {
    return this.productRepo.findProducts(filter)
  }
}
