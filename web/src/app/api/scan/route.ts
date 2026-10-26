// ====================================================================
// Presentation Layer: Smart Scanning & Dispatch API Route
// High-performance endpoint for Flutter mobile scanner & Web interface
// ====================================================================

import { NextRequest, NextResponse } from 'next/server'
import { container } from '@/infrastructure/container'
import { handleApiError } from '@/presentation/errors/handleError'
import { handleCorsOptions, jsonResponse } from '@/lib/cors'
import { BarcodeNotFoundError } from '@/domain/errors'

export async function OPTIONS() {
  return handleCorsOptions()
}

// GET: Lookup barcode item information without dispatching (pre-scan preview)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barcodeString = searchParams.get('barcode') || searchParams.get('code')

    if (!barcodeString) {
      // Return recent scan / dispatch activities
      const logs = await container.auditRepo.getRecentLogs(25)
      return jsonResponse({ success: true, data: logs })
    }

    const item = await container.barcodeRepo.findByString(barcodeString)
    if (!item) {
      throw new BarcodeNotFoundError(barcodeString)
    }

    return jsonResponse({
      success: true,
      data: item,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST: Execute smart dispatch scan with strict FIFO validation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const barcodeString = body.barcode || body.barcode_string || body.code
    const userId = body.user_id ? Number(body.user_id) : undefined
    const referenceOrder = body.order_no || body.reference_order_no
    const overrideFifo = Boolean(body.override_fifo)
    const notes = body.notes

    if (!barcodeString) {
      return NextResponse.json(
        { success: false, error: 'Barcode string is required.' },
        { status: 400 }
      )
    }

    const result = await container.dispatchUseCase.execute({
      barcode_string: barcodeString,
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
