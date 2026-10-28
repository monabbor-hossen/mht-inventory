// ====================================================================
// Presentation Layer: Inventory Batches & Items API Route
// ====================================================================

import { NextRequest } from 'next/server'
import { jsonResponse, handleCorsOptions } from '@/lib/cors'
import { container } from '@/infrastructure/container'
import { handleApiError } from '@/presentation/errors/handleError'
import { BatchStatus } from '@/domain/entities'

export async function OPTIONS() {
  return handleCorsOptions()
}

// GET: List batches with optional status / limit filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get('status')?.toUpperCase() as BatchStatus | undefined
    const limit = parseInt(searchParams.get('limit') || '100', 10)

    const batches = await container.inboundUseCases.listBatches({
      status: statusParam,
      take: limit,
    })

    const summary = await container.barcodeRepo.getStockDashboardSummary()

    const formattedBatches = batches.map((b: any) => ({
      id: b.id,
      batch_number: b.batch_number,
      batch: b.batch_number,
      supplier_name: b.supplier_name || 'Unassigned',
      supplier: b.supplier_name || 'Unassigned',
      category: b.category || 'General',
      total_quantity: b.received_quantity,
      bags_count: b.received_quantity,
      received_quantity: b.received_quantity,
      expected_quantity: b.expected_quantity,
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
        totalInStock: summary.totalInStock,
        dispatchedToday: summary.dispatchedToday,
        damagedStock: summary.damagedTotal,
        quarantineStock: summary.quarantineTotal,
      },
      count: formattedBatches.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST: Forward to inbound receiving or dynamic adjustment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Dynamic adjustment branch
    if (body.mode?.toLowerCase() === 'adjust') {
      const batchId = Number(body.batchId || body.batch_id)
      const delta = Number(body.delta || body.quantity || 0)
      const action = delta < 0 || body.action === 'VOID' ? 'VOID' : 'ADD'
      const quantity = Math.abs(delta)
      const result = await container.inboundUseCases.adjustBatchQuantity({
        batch_id: batchId,
        action,
        quantity: action === 'ADD' ? quantity : undefined,
        barcode_strings: body.barcode_strings || body.barcodes,
        reason: body.reason || 'Dynamic adjustment via inventory API',
        user_id: body.user_id ? Number(body.user_id) : undefined,
      })
      return jsonResponse({
        success: true,
        message: `Successfully adjusted batch quantity (${action})`,
        data: result,
      })
    }

    const mode = body.mode?.toUpperCase() === 'BLIND' ? 'BLIND' : 'ASN'
    const expectedQuantity = Number(body.expected_quantity || body.quantity || body.bags_count || 1)

    const result = await container.inboundUseCases.receiveInboundStock({
      mode,
      batch_number: body.batch_number || body.batch,
      supplier_name: body.supplier_name || body.supplier,
      product_id: body.product_id ? Number(body.product_id) : undefined,
      category: body.category,
      expected_quantity: expectedQuantity,
      target_location_id: body.target_location_id ? Number(body.target_location_id) : undefined,
      notes: body.notes,
      user_id: body.user_id ? Number(body.user_id) : undefined,
    })

    return jsonResponse({
      success: true,
      data: {
        id: result.batch.id,
        batch_number: result.batch.batch_number,
        batch: result.batch.batch_number,
        supplier: result.batch.supplier_name,
        category: result.batch.category,
        total_quantity: result.batch.received_quantity,
        bags_count: result.batch.received_quantity,
        status: result.batch.status,
        barcodes: result.barcodes.map((b: any) => b.barcode_string),
      },
    }, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT: Late Metadata Binding (Assign supplier, product, category, location to draft batch)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const batchId = Number(body.batchId || body.batch_id || body.id)
    if (!batchId) {
      return jsonResponse({ success: false, error: 'batchId is required' }, 400)
    }

    const updated = await container.inboundUseCases.bindLateMetadata({
      batch_id: batchId,
      supplier_name: body.supplier || body.supplier_name,
      category: body.category,
      product_id: body.productId || body.product_id ? Number(body.productId || body.product_id) : undefined,
      target_location_id: body.locationId || body.target_location_id ? Number(body.locationId || body.target_location_id) : undefined,
      notes: body.notes,
      user_id: body.userId || body.user_id ? Number(body.userId || body.user_id) : undefined,
    })

    return jsonResponse({
      success: true,
      message: `Metadata bound successfully to batch ${updated.batch_number}`,
      data: updated,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
