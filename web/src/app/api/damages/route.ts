// ====================================================================
// Presentation Layer: Damaged Inventory Records API Route
// ====================================================================

import { NextRequest } from 'next/server'
import { container } from '@/infrastructure/container'
import { handleApiError } from '@/presentation/errors/handleError'
import { handleCorsOptions, jsonResponse } from '@/lib/cors'
import { DamageReason } from '@/domain/entities'

export async function OPTIONS() {
  return handleCorsOptions()
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const records = await container.damageUseCases.listDamages(limit)
    return jsonResponse({
      success: true,
      data: records,
      count: records.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const barcode = body.barcode || body.barcode_string || body.code

    if (!barcode) {
      return jsonResponse({ success: false, error: 'Barcode is required' }, 400)
    }

    const reason = (body.reason as DamageReason) || 'Torn'
    const photoUrl = body.photoUrl || body.photo_url || null
    const notes = body.notes
    const userId = body.userId || body.user_id ? Number(body.userId || body.user_id) : 1

    const record = await container.damageUseCases.recordDamage({
      barcode_string: String(barcode).trim(),
      reason,
      photo_url: photoUrl,
      notes,
      logged_by: userId,
    })

    return jsonResponse(
      {
        success: true,
        message: `Barcode ${barcode} marked as damaged (${reason})`,
        data: record,
      },
      201
    )
  } catch (error) {
    return handleApiError(error)
  }
}
