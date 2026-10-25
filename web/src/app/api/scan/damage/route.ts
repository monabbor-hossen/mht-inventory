import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, handleCorsOptions } from '@/lib/cors'
import { inventoryUseCases } from '@/application/use-cases'
import { AppError } from '@/domain/errors'
import { DamageReason } from '@/domain/entities'

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

    const reason = (body.reason as DamageReason) || 'Torn'
    const photo_url = body.photo_url || body.photoUrl || null
    const userId = body.userId ? Number(body.userId) : 1

    const damageRecord = await inventoryUseCases.recordDamage({
      barcode_string: String(barcode).trim(),
      reason,
      photo_url,
      userId,
    })

    return jsonResponse({
      success: true,
      message: `Barcode marked as DAMAGED (${reason})`,
      data: damageRecord,
    })
  } catch (error: any) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode)
    }
    return errorResponse('Failed to record damage', 500, error?.message)
  }
}
