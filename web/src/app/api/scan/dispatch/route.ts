// ====================================================================
// Presentation Layer: Dispatch Scan API Endpoint
// Enforces strict FIFO rules, duplicate scan prevention, and status validation
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
    const barcode = body.barcode || body.barcode_string || body.code

    if (!barcode) {
      return jsonResponse({ success: false, error: 'Barcode string is required' }, 400)
    }

    const userId = body.userId || body.user_id ? Number(body.userId || body.user_id) : 1
    const overrideFifo = Boolean(body.override_fifo)
    const referenceOrder = body.order_no || body.reference_order_no
    const notes = body.notes

    const result = await container.dispatchUseCase.execute({
      barcode_string: String(barcode).trim(),
      user_id: userId,
      reference_order_no: referenceOrder,
      notes,
      override_fifo: overrideFifo,
    })

    return jsonResponse({
      success: true,
      message: result.message,
      data: result.item,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
