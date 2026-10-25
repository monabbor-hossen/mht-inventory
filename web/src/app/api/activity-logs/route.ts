import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, handleCorsOptions } from '@/lib/cors'
import { activityLogRepository } from '@/application/use-cases'

export async function OPTIONS() {
  return handleCorsOptions()
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const logs = await activityLogRepository.getRecentLogs(limit)

    const formattedLogs = logs.map((log) => ({
      id: log.id,
      action_type: log.action,
      action: log.action,
      target_id: log.target_entity,
      target_entity: log.target_entity,
      description: log.description,
      user_id: log.user_id,
      user_name: (log as any).user?.name || 'Staff',
      user: (log as any).user?.name || 'Staff',
      created_at: log.timestamp,
      timestamp: log.timestamp,
    }))

    return jsonResponse({
      success: true,
      data: formattedLogs,
      count: formattedLogs.length,
    })
  } catch (error: any) {
    return errorResponse('Failed to fetch activity logs', 500, error?.message)
  }
}
