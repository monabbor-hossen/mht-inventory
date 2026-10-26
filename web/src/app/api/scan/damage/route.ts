// ====================================================================
// Presentation Layer: Scan Damage API Endpoint
// ====================================================================

import { NextRequest } from 'next/server'
import { container } from '@/infrastructure/container'
import { handleApiError } from '@/presentation/errors/handleError'
import { handleCorsOptions, jsonResponse } from '@/lib/cors'
import { DamageReason } from '@/domain/entities'

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

    const reason = (body.reason as DamageReason) || 'Torn'
    const photoUrl = body.photo_url || body.photoUrl || null
    const userId = body.userId || body.user_id ? Number(body.userId || body.user_id) : 1
    const notes = body.notes

    const damageRecord = await container.damageUseCases.recordDamage({
      barcode_string: String(barcode).trim(),
      reason,
      photo_url: photoUrl,
      notes,
      logged_by: userId,
    })

    return jsonResponse({
      success: true,
      message: `Barcode marked as DAMAGED (${reason})`,
      data: damageRecord,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
