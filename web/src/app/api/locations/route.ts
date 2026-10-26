// ====================================================================
// Presentation Layer: Locations API Route
// ====================================================================

import { NextRequest } from 'next/server'
import { container } from '@/infrastructure/container'
import { handleApiError } from '@/presentation/errors/handleError'
import { handleCorsOptions, jsonResponse } from '@/lib/cors'

export async function OPTIONS() {
  return handleCorsOptions()
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const zone = searchParams.get('zone') || undefined

    const locations = await container.locationUseCases.listLocations({ zone })
    return jsonResponse({ success: true, data: locations })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const location = await container.locationUseCases.createLocation({
      code: body.code,
      zone: body.zone,
      aisle: body.aisle,
      rack: body.rack,
      bin: body.bin,
      description: body.description,
      max_capacity: body.max_capacity ? Number(body.max_capacity) : 100,
    }, body.user_id ? Number(body.user_id) : undefined)

    return jsonResponse({ success: true, data: location }, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
