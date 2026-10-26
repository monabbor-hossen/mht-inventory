// ====================================================================
// Presentation Layer: Locations Relocation API Route
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
    const result = await container.locationUseCases.relocateItem({
      barcode_string: body.barcode_string || body.barcode,
      target_location_code: body.target_location_code || body.location_code,
      user_id: body.user_id ? Number(body.user_id) : undefined,
      notes: body.notes,
    })

    return jsonResponse({
      success: true,
      message: `Item relocated to ${body.target_location_code}`,
      data: result,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
