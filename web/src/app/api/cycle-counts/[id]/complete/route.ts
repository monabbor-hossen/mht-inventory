// ====================================================================
// Presentation Layer: Cycle Count Complete API Route
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
    const body = await request.json().catch(() => ({}))

    const audit = await container.cycleCountUseCases.completeAudit(
      Number(id),
      body.notes,
      body.user_id ? Number(body.user_id) : undefined
    )

    return jsonResponse({
      success: true,
      message: `Cycle count audit ${audit.count_number} marked as COMPLETED.`,
      data: audit,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
