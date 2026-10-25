import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, handleCorsOptions } from '@/lib/cors'
import { inventoryUseCases } from '@/application/use-cases'
import { AppError } from '@/domain/errors'

export async function OPTIONS() {
  return handleCorsOptions()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const barcode = body.barcode || body.barcode_string || body.code

    if (!barcode) {
      return errorResponse('Barcode string is required', 400)
    }

    const userId = body.userId ? Number(body.userId) : 1

    const dispatched = await inventoryUseCases.dispatchScan({
      barcode_string: String(barcode).trim(),
      userId,
    })

    return jsonResponse({
      success: true,
      message: `Barcode ${dispatched.barcode_string} marked as DISPATCHED`,
      data: dispatched,
    })
  } catch (error: any) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode)
    }
    return errorResponse('Failed to dispatch item', 500, error?.message)
  }
}
