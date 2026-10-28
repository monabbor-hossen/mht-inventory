// ====================================================================
// Presentation Layer: Inbound & Receiving API Route
// Supports Blind Receiving (DRAFT) & ASN (COMPLETED)
// ====================================================================

import { NextRequest } from 'next/server'
import { container } from '@/infrastructure/container'
import { handleApiError } from '@/presentation/errors/handleError'
import { handleCorsOptions, jsonResponse } from '@/lib/cors'
import { BatchStatus } from '@/domain/entities'

export async function OPTIONS() {
  return handleCorsOptions()
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get('status')?.toUpperCase() as BatchStatus | undefined
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const batches = await container.inboundUseCases.listBatches({
      status: statusParam,
      take: limit,
    })

    return jsonResponse({
      success: true,
      data: batches,
      count: batches.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const mode = body.mode === 'BLIND' ? 'BLIND' : 'ASN'
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

    return jsonResponse(
      {
        success: true,
        message: `Inbound ${mode} processed successfully for batch ${result.batch.batch_number}`,
        data: {
          batch: result.batch,
          barcodesCount: result.barcodes.length,
          barcodes: result.barcodes.map((b) => b.barcode_string),
        },
      },
      201
    )
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const batchId = Number(body.batch_id || body.batchId || body.id)
    if (!batchId) {
      return jsonResponse({ success: false, error: 'batch_id is required' }, 400)
    }

    const updated = await container.inboundUseCases.bindLateMetadata({
      batch_id: batchId,
      supplier_name: body.supplier_name || body.supplier,
      category: body.category,
      product_id: body.product_id || body.productId ? Number(body.product_id || body.productId) : undefined,
      target_location_id: body.target_location_id || body.locationId ? Number(body.target_location_id || body.locationId) : undefined,
      notes: body.notes,
      user_id: body.user_id || body.userId ? Number(body.user_id || body.userId) : undefined,
    })

    return jsonResponse({
      success: true,
      message: `Late metadata bound successfully to batch ${updated.batch_number}`,
      data: updated,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
