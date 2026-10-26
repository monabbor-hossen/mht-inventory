// ====================================================================
// Presentation Layer: Activity Audit Logs API Route
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
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const logs = await container.auditTrailUseCase.getRecentLogs(limit)

    return jsonResponse({
      success: true,
      data: logs.map((log: any) => ({
        id: log.id,
        action: log.action,
        target_entity: log.target_entity,
        entity_id: log.entity_id,
        description: log.description,
        user_id: log.user_id,
        user_name: log.user?.name || 'Staff',
        timestamp: log.timestamp,
        date: new Date(log.timestamp).toLocaleDateString(),
        time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })),
      count: logs.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
