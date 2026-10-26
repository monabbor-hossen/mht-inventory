// ====================================================================
// Presentation Layer: Cycle Count Item Scan API Route
// ====================================================================

import { NextRequest } from 'next/server'
import { container } from '@/infrastructure/container'
import { handleApiError } from '@/presentation/errors/handleError'
import { handleCorsOptions, jsonResponse } from '@/lib/cors'

export async function OPTIONS() {
  return handleCorsOptions()
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const barcodeString = body.barcode_string || body.barcode

    if (!barcodeString) {
      return jsonResponse({ success: false, error: 'Barcode string is required' }, 400)
    }

    const item = await container.cycleCountUseCases.auditItemScan(
      {
        cycle_count_id: Number(id),
        barcode_string: barcodeString,
        notes: body.notes,
      },
      body.user_id ? Number(body.user_id) : undefined
    )

    return jsonResponse({
      success: true,
      message: item.is_discrepancy
        ? `Item scanned with discrepancy: ${item.notes}`
        : 'Item scanned matches records',
      data: item,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
