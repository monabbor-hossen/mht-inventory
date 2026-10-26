// ====================================================================
// Presentation Layer: Cycle Counts API Route
// ====================================================================

import { NextRequest } from 'next/server'
import { container } from '@/infrastructure/container'
import { handleApiError } from '@/presentation/errors/handleError'
import { handleCorsOptions, jsonResponse } from '@/lib/cors'

export async function OPTIONS() {
  return handleCorsOptions()
}

export async function GET() {
  try {
    const audits = await container.cycleCountUseCases.listAudits()
    return jsonResponse({ success: true, data: audits })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const audit = await container.cycleCountUseCases.startAudit({
      count_number: body.count_number,
      location_id: body.location_id ? Number(body.location_id) : undefined,
      conducted_by: body.conducted_by ? Number(body.conducted_by) : undefined,
      notes: body.notes,
    })

    return jsonResponse({ success: true, data: audit }, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
