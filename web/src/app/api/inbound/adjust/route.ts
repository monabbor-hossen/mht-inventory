// ====================================================================
// Presentation Layer: Inbound Dynamic Quantity Adjustment API Route
// ====================================================================

import { NextRequest } from 'next/server'
import { container } from '@/infrastructure/container'
import { handleApiError } from '@/presentation/errors/handleError'
import { handleCorsOptions, jsonResponse } from '@/lib/cors'

export async function OPTIONS() {
  return handleCorsOptions()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await container.inboundUseCases.adjustBatchQuantity({
      batch_id: Number(body.batch_id),
      action: body.action === 'VOID' ? 'VOID' : 'ADD',
      quantity: body.quantity ? Number(body.quantity) : undefined,
      barcode_strings: body.barcode_strings,
      reason: body.reason || 'Manifest mismatch during physical receiving',
      user_id: body.user_id ? Number(body.user_id) : undefined,
    })

    return jsonResponse({
      success: true,
      message: `Successfully adjusted batch quantity (${body.action}): affected ${result.affectedCount} units`,
      data: result,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
