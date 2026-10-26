'use server'

// ====================================================================
// Presentation Layer: Server Actions
// Invokes Clean Architecture Use Cases from the Next.js Web UI
// ====================================================================

import { container } from '@/infrastructure/container'
import { revalidatePath } from 'next/cache'
import { FifoViolationError } from '@/domain/errors'

export type ActionResult<T = any> = {
  success: boolean
  message?: string
  data?: T
  error?: string
  code?: string
  fifoWarning?: {
    attemptedBatch: string
    olderBatch: string
  }
}

/**
 * Register a new SKU / Master Product
 */
export async function createProductAction(formData: FormData): Promise<ActionResult> {
  try {
    const sku = String(formData.get('sku') || '').trim()
    const name = String(formData.get('name') || '').trim()
    const category = String(formData.get('category') || '').trim()
    const unitWeight = Number(formData.get('unit_weight') || 25)
    const unitOfMeasure = String(formData.get('unit_of_measure') || 'kg').trim()
    const description = String(formData.get('description') || '').trim()
    const minAlert = Number(formData.get('min_stock_alert') || 10)

    const product = await container.productUseCases.createProduct({
      sku,
      name,
      category,
      unit_weight: unitWeight,
      unit_of_measure: unitOfMeasure,
      description: description || undefined,
      min_stock_alert: minAlert,
    })

    revalidatePath('/')
    return { success: true, message: `Product ${product.name} (${product.sku}) registered!`, data: product }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Register a new Warehouse Location (Zone/Aisle/Rack/Bin)
 */
export async function createLocationAction(formData: FormData): Promise<ActionResult> {
  try {
    const code = String(formData.get('code') || '').trim()
    const zone = String(formData.get('zone') || '').trim()
    const aisle = String(formData.get('aisle') || '').trim()
    const rack = String(formData.get('rack') || '').trim()
    const bin = String(formData.get('bin') || '').trim()
    const maxCapacity = Number(formData.get('max_capacity') || 100)
    const description = String(formData.get('description') || '').trim()

    const location = await container.locationUseCases.createLocation({
      code,
      zone,
      aisle,
      rack,
      bin,
      max_capacity: maxCapacity,
      description: description || undefined,
    })

    revalidatePath('/')
    return { success: true, message: `Location ${location.code} created!`, data: location }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Relocate Barcode Item between Bins
 */
export async function relocateItemAction(barcode: string, targetLocationCode: string): Promise<ActionResult> {
  try {
    const updated = await container.locationUseCases.relocateItem({
      barcode_string: barcode,
      target_location_code: targetLocationCode,
    })
    revalidatePath('/')
    return { success: true, message: `Item moved to ${targetLocationCode}`, data: updated }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Receive Inbound Stock (Blind Receipt or ASN)
 */
export async function receiveInboundAction(data: {
  mode: 'ASN' | 'BLIND'
  batchNumber?: string
  supplierName?: string
  productId?: number
  category?: string
  expectedQuantity: number
  targetLocationId?: number
}): Promise<ActionResult> {
  try {
    const result = await container.inboundUseCases.receiveInboundStock({
      mode: data.mode,
      batch_number: data.batchNumber,
      supplier_name: data.supplierName,
      product_id: data.productId,
      category: data.category,
      expected_quantity: data.expectedQuantity,
      target_location_id: data.targetLocationId,
    })

    revalidatePath('/')
    return {
      success: true,
      message: `Inbound ${data.mode} received: Batch ${result.batch.batch_number} (${result.barcodes.length} barcodes generated)`,
      data: result,
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Dispatch Item via Scanner with FIFO validation
 */
export async function dispatchItemAction(barcode: string, overrideFifo = false): Promise<ActionResult> {
  try {
    const result = await container.dispatchUseCase.execute({
      barcode_string: barcode,
      override_fifo: overrideFifo,
    })
    revalidatePath('/')
    return {
      success: true,
      message: result.message,
      data: result.item,
    }
  } catch (err: any) {
    if (err instanceof FifoViolationError) {
      return {
        success: false,
        error: err.message,
        code: 'FIFO_VIOLATION',
        fifoWarning: {
          attemptedBatch: err.attemptedBatchNumber,
          olderBatch: err.olderBatchNumber,
        },
      }
    }
    return { success: false, error: err.message }
  }
}

/**
 * Cycle Count: Start Audit
 */
export async function startCycleCountAction(locationId?: number, notes?: string): Promise<ActionResult> {
  try {
    const audit = await container.cycleCountUseCases.startAudit({
      location_id: locationId,
      notes,
    })
    revalidatePath('/')
    return { success: true, message: `Cycle count ${audit.count_number} started!`, data: audit }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Cycle Count: Audit Item Scan
 */
export async function auditCycleScanAction(cycleCountId: number, barcode: string): Promise<ActionResult> {
  try {
    const item = await container.cycleCountUseCases.auditItemScan({
      cycle_count_id: cycleCountId,
      barcode_string: barcode,
    })
    revalidatePath('/')
    return {
      success: true,
      message: item.is_discrepancy ? `Discrepancy: ${item.notes}` : 'Item verified in place',
      data: item,
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Cycle Count: Complete Audit
 */
export async function completeCycleCountAction(cycleCountId: number, notes?: string): Promise<ActionResult> {
  try {
    const audit = await container.cycleCountUseCases.completeAudit(cycleCountId, notes)
    revalidatePath('/')
    return { success: true, message: `Cycle count ${audit.count_number} completed!`, data: audit }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
