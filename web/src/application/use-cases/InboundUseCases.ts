// ====================================================================
// Application Layer: Inbound & Receiving Use Cases
// Supports Blind Receiving (DRAFT) & ASN (COMPLETED)
// Serialized Barcode generation and dynamic quantity adjustment
// ====================================================================

import {
  IBatchRepository,
  IBarcodeRepository,
  IProductRepository,
  IInventoryTransactionRepository,
  IActivityLogRepository,
} from '@/domain/repositories'
import { BatchEntity, BarcodeItemEntity, BatchStatus } from '@/domain/entities'
import { ReceiveInboundStockDto, AdjustBatchQuantityDto } from '../dto'
import {
  BatchNotFoundError,
  ProductNotFoundError,
  ValidationError,
} from '@/domain/errors'

export class InboundUseCases {
  constructor(
    private readonly batchRepo: IBatchRepository,
    private readonly barcodeRepo: IBarcodeRepository,
    private readonly productRepo: IProductRepository,
    private readonly txRepo: IInventoryTransactionRepository,
    private readonly auditRepo: IActivityLogRepository
  ) {}

  /**
   * Receives inbound shipment: creates Batch, generates unique BarcodeItems,
   * logs IN transactions, and records activity.
   */
  async receiveInboundStock(dto: ReceiveInboundStockDto): Promise<{
    batch: BatchEntity
    barcodes: BarcodeItemEntity[]
  }> {
    if (dto.expected_quantity <= 0) {
      throw new ValidationError('Quantity must be greater than zero.')
    }

    let product = null
    if (dto.product_id) {
      product = await this.productRepo.findById(dto.product_id)
      if (!product) {
        throw new ProductNotFoundError(dto.product_id)
      }
    }

    // Auto-generate batch number if omitted (e.g. Blind Receipt)
    const timestamp = Date.now().toString().slice(-6)
    const batchNumber =
      dto.batch_number?.trim() ||
      (dto.mode === 'BLIND' ? `BLIND-${timestamp}` : `ASN-${timestamp}`)

    const status: BatchStatus = dto.mode === 'BLIND' ? 'DRAFT' : 'COMPLETED'

    const batch = await this.batchRepo.createBatch({
      batch_number: batchNumber,
      supplier_name: dto.supplier_name ?? (dto.mode === 'BLIND' ? 'Spot Delivery' : 'Standard Supplier'),
      product_id: dto.product_id,
      category: dto.category ?? product?.category ?? 'General',
      expected_quantity: dto.expected_quantity,
      received_quantity: dto.expected_quantity,
      status,
      notes: dto.notes,
    })

    // Generate unique serialized barcode strings (e.g. MHT-BATCH-001)
    const prefix = product?.sku ? product.sku : batch.batch_number.replace(/[^a-zA-Z0-9]/g, '')
    const barcodeItemsData: Array<{
      barcode_string: string
      product_id?: number | null
      location_id?: number | null
      status?: 'IN_STOCK' | 'DRAFT'
    }> = []

    for (let i = 1; i <= dto.expected_quantity; i++) {
      const paddedIndex = String(i).padStart(4, '0')
      const barcodeString = `MHT-${prefix}-B${batch.id}-${paddedIndex}`
      barcodeItemsData.push({
        barcode_string: barcodeString,
        product_id: dto.product_id,
        location_id: dto.target_location_id,
        status: dto.mode === 'BLIND' ? 'DRAFT' : 'IN_STOCK',
      })
    }

    const createdBarcodes = await this.barcodeRepo.createBarcodes(batch.id, barcodeItemsData)

    // Record Immutable IN Transactions
    for (const barcode of createdBarcodes) {
      await this.txRepo.recordTransaction({
        barcode_item_id: barcode.id,
        product_id: batch.product_id,
        batch_id: batch.id,
        to_location_id: dto.target_location_id,
        movement_type: 'IN',
        quantity: 1,
        user_id: dto.user_id,
        reference_number: batch.batch_number,
        notes: `Inbound receipt (${dto.mode}) for batch ${batch.batch_number}`,
      })
    }

    // Audit Log
    await this.auditRepo.log({
      user_id: dto.user_id,
      action: 'CREATE',
      target_entity: 'BATCH',
      entity_id: batch.batch_number,
      description: `Inbound ${dto.mode} received ${dto.expected_quantity} units in batch ${batch.batch_number}`,
      metadata: { count: dto.expected_quantity, mode: dto.mode },
    })

    return { batch, barcodes: createdBarcodes }
  }

  /**
   * Dynamic quantity adjustment: add or void barcodes on the fly if physical delivery mismatches manifest
   */
  async adjustBatchQuantity(dto: AdjustBatchQuantityDto): Promise<{
    batch: BatchEntity
    affectedCount: number
  }> {
    const batch = await this.batchRepo.findById(dto.batch_id)
    if (!batch) {
      throw new BatchNotFoundError(dto.batch_id)
    }

    let affectedCount = 0

    if (dto.action === 'ADD') {
      const addCount = dto.quantity ?? 1
      if (addCount <= 0) throw new ValidationError('Quantity to add must be > 0')

      const existingCount = batch.barcodes?.length ?? 0
      const prefix = batch.product?.sku ?? batch.batch_number.replace(/[^a-zA-Z0-9]/g, '')

      const newBarcodes = []
      for (let i = 1; i <= addCount; i++) {
        const paddedIndex = String(existingCount + i).padStart(4, '0')
        newBarcodes.push({
          barcode_string: `MHT-${prefix}-B${batch.id}-${paddedIndex}`,
          product_id: batch.product_id,
          status: 'IN_STOCK' as const,
        })
      }

      const created = await this.barcodeRepo.createBarcodes(batch.id, newBarcodes)
      affectedCount = created.length

      await this.batchRepo.updateBatch(batch.id, {
        received_quantity: batch.received_quantity + affectedCount,
      })

      // Record adjustment transactions
      for (const b of created) {
        await this.txRepo.recordTransaction({
          barcode_item_id: b.id,
          product_id: batch.product_id,
          batch_id: batch.id,
          movement_type: 'ADJUSTMENT',
          quantity: 1,
          user_id: dto.user_id,
          notes: `Dynamic adjustment (+): ${dto.reason}`,
        })
      }
    } else if (dto.action === 'VOID') {
      if (!dto.barcode_strings || dto.barcode_strings.length === 0) {
        throw new ValidationError('List of barcode strings is required for VOID action')
      }

      affectedCount = await this.barcodeRepo.voidBarcodes(dto.barcode_strings)
      await this.batchRepo.updateBatch(batch.id, {
        received_quantity: Math.max(0, batch.received_quantity - affectedCount),
      })

      // Record adjustment transactions
      for (const barcodeStr of dto.barcode_strings) {
        const item = await this.barcodeRepo.findByString(barcodeStr)
        if (item) {
          await this.txRepo.recordTransaction({
            barcode_item_id: item.id,
            product_id: item.product_id,
            batch_id: batch.id,
            movement_type: 'ADJUSTMENT',
            quantity: 1,
            user_id: dto.user_id,
            notes: `Dynamic adjustment (VOID): ${dto.reason}`,
          })
        }
      }
    }

    await this.auditRepo.log({
      user_id: dto.user_id,
      action: 'UPDATE',
      target_entity: 'BATCH',
      entity_id: batch.batch_number,
      description: `Adjusted quantity (${dto.action}) for batch ${batch.batch_number} by ${affectedCount} units. Reason: ${dto.reason}`,
    })

    const updatedBatch = await this.batchRepo.findById(dto.batch_id)
    return { batch: updatedBatch!, affectedCount }
  }

  /**
   * Module A: Late Metadata Binding
   * Promotes a DRAFT batch to COMPLETED, associates Product/Supplier/Category/Location,
   * and transitions draft barcodes to IN_STOCK.
   */
  async bindLateMetadata(dto: {
    batch_id: number
    supplier_name?: string
    category?: string
    product_id?: number
    target_location_id?: number
    notes?: string
    user_id?: number
  }): Promise<BatchEntity> {
    const batch = await this.batchRepo.findById(dto.batch_id)
    if (!batch) {
      throw new BatchNotFoundError(dto.batch_id)
    }

    let product = null
    if (dto.product_id) {
      product = await this.productRepo.findById(dto.product_id)
      if (!product) {
        throw new ProductNotFoundError(dto.product_id)
      }
    }

    await this.batchRepo.updateBatch(dto.batch_id, {
      supplier_name: dto.supplier_name ?? batch.supplier_name,
      category: dto.category ?? product?.category ?? batch.category,
      product_id: dto.product_id ?? batch.product_id,
      notes: dto.notes ?? batch.notes,
      status: 'COMPLETED',
    })

    // Transition all barcodes of this batch to IN_STOCK, and update product/location
    await this.barcodeRepo.updateBatchItems(dto.batch_id, {
      status: 'IN_STOCK',
      product_id: dto.product_id ?? batch.product_id,
      location_id: dto.target_location_id,
    })

    // Record audit log
    await this.auditRepo.log({
      user_id: dto.user_id,
      action: 'UPDATE',
      target_entity: 'BATCH',
      entity_id: batch.batch_number,
      description: `Late metadata bound to batch ${batch.batch_number}: supplier "${dto.supplier_name || 'N/A'}", category "${dto.category || 'N/A'}", product "${product?.name || 'N/A'}"`,
    })

    const finalBatch = await this.batchRepo.findById(dto.batch_id)
    return finalBatch!
  }

  async listBatches(options?: { status?: BatchStatus; skip?: number; take?: number }): Promise<BatchEntity[]> {
    return this.batchRepo.findBatches(options)
  }

  async getBatchDetails(batchId: number): Promise<BatchEntity | null> {
    return this.batchRepo.findById(batchId)
  }
}
