import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, handleCorsOptions } from '@/lib/cors'
import { inventoryRepository, inventoryUseCases } from '@/application/use-cases'
import { AppError } from '@/domain/errors'
import { BatchStatus } from '@/domain/entities'

export async function OPTIONS() {
  return handleCorsOptions()
}

// GET: List batches with optional status / limit filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100', 10)

    let filterStatus: BatchStatus | undefined = undefined
    if (statusParam && (statusParam.toUpperCase() === 'DRAFT' || statusParam.toUpperCase() === 'COMPLETED')) {
      filterStatus = statusParam.toUpperCase() as BatchStatus
    }

    const batches = await inventoryRepository.findBatches({
      status: filterStatus,
      take: limit,
    })

    const stockSummary = await inventoryRepository.getStockSummary()

    // Format for both Web Shadcn table and Flutter mobile compatibility
    const formattedBatches = batches.map((b) => ({
      id: b.id,
      batch_number: b.batch_number,
      batch: b.batch_number,
      supplier_name: b.supplier_name || 'Unassigned',
      supplier: b.supplier_name || 'Unassigned',
      category: b.category || 'General',
      total_quantity: b.total_quantity,
      bags_count: b.total_quantity,
      status: b.status,
      created_at: b.created_at,
      received_date: new Date(b.created_at).toISOString().split('T')[0],
      warehouse_zone: 'Zone A',
      unit_weight: '25 Kg',
    }))

    return jsonResponse({
      success: true,
      data: formattedBatches,
      stats: {
        totalBatches: batches.length,
        totalInStock: stockSummary.totalInStock,
        dispatchedToday: stockSummary.dispatchedToday,
      },
      count: formattedBatches.length,
    })
  } catch (error: any) {
    return errorResponse('Failed to fetch inventory batches', 500, error?.message)
  }
}

// POST: Blind Receipt, Advance Entry, and Batch Adjustments
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const mode = body.mode || 'advance' // 'blind' | 'advance' | 'adjust'
    const userId = body.userId ? Number(body.userId) : 1

    // MODE 1: Blind Receipt (Quick Print)
    if (mode === 'blind') {
      const quantity = parseInt(String(body.quantity || body.bags || 0), 10)
      const result = await inventoryUseCases.createBlindReceipt({
        quantity,
        userId,
      })

      return jsonResponse(
        {
          success: true,
          message: `Blind receipt created with ${quantity} barcodes in DRAFT status`,
          data: {
            batch: result.batch.batch_number,
            batchId: result.batch.id,
            status: result.batch.status,
            totalQuantity: result.batch.total_quantity,
            barcodes: result.barcodes.map((b) => b.barcode_string),
          },
        },
        201
      )
    }

    // MODE 2: Batch Adjustment (Over/Under Printing)
    if (mode === 'adjust') {
      const batchNumber = body.batch || body.batchNumber
      const batchId = body.batchId ? Number(body.batchId) : undefined

      let targetBatch = null
      if (batchId) {
        targetBatch = await inventoryRepository.findBatchById(batchId)
      } else if (batchNumber) {
        targetBatch = await inventoryRepository.findBatchByNumber(batchNumber)
      }

      if (!targetBatch) {
        return errorResponse('Batch not found for adjustment', 404)
      }

      const delta = parseInt(String(body.delta || 0), 10)
      const addQuantity = delta > 0 ? delta : (body.addQuantity ? Number(body.addQuantity) : undefined)
      const voidBarcodes = body.voidBarcodes || (delta < 0 ? [] : undefined)

      const result = await inventoryUseCases.adjustBatchBarcodes({
        batchId: targetBatch.id,
        addQuantity,
        voidBarcodes,
        userId,
      })

      return jsonResponse({
        success: true,
        message: 'Batch adjustment successful',
        data: {
          batch: result.batch.batch_number,
          totalQuantity: result.batch.total_quantity,
          addedCount: result.addedBarcodes?.length ?? 0,
          voidedCount: result.voidedCount ?? 0,
        },
      })
    }

    // MODE 3: Advance Entry (Pre-planned)
    const quantity = parseInt(String(body.quantity || body.bags || 0), 10)
    const supplier_name = body.supplier_name || body.supplier
    const category = body.category || 'General'
    const batch_number = body.batch_number || body.batch

    const result = await inventoryUseCases.createAdvanceEntry({
      supplier_name,
      category,
      quantity,
      batch_number,
      userId,
    })

    return jsonResponse(
      {
        success: true,
        message: 'Advance inbound batch registered and barcodes generated',
        data: {
          batch: result.batch.batch_number,
          batchId: result.batch.id,
          status: result.batch.status,
          supplier: result.batch.supplier_name,
          category: result.batch.category,
          totalQuantity: result.batch.total_quantity,
          barcodes: result.barcodes.map((b) => b.barcode_string),
        },
      },
      201
    )
  } catch (error: any) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode)
    }
    return errorResponse('Failed to process inventory request', 500, error?.message)
  }
}

// PUT: Late Metadata Binding
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const batchNumber = body.batch || body.batchNumber
    const batchId = body.batchId ? Number(body.batchId) : undefined
    const userId = body.userId ? Number(body.userId) : 1

    let targetBatch = null
    if (batchId) {
      targetBatch = await inventoryRepository.findBatchById(batchId)
    } else if (batchNumber) {
      targetBatch = await inventoryRepository.findBatchByNumber(batchNumber)
    }

    if (!targetBatch) {
      return errorResponse('Batch not found for metadata binding', 404)
    }

    const updated = await inventoryUseCases.updateBatchMetadata({
      batchId: targetBatch.id,
      supplier_name: body.supplier_name || body.supplier,
      category: body.category,
      status: 'COMPLETED',
      userId,
    })

    return jsonResponse({
      success: true,
      message: `Late metadata successfully bound to batch ${updated.batch_number}`,
      data: updated,
    })
  } catch (error: any) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode)
    }
    return errorResponse('Failed to bind late metadata', 500, error?.message)
  }
}
