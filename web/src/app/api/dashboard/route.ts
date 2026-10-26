// ====================================================================
// Presentation Layer: Real-time Stock Dashboard API Route
// Aggregated views of current stock levels by SKU, Batch, and Location
// ====================================================================

import { container } from '@/infrastructure/container'
import { handleApiError } from '@/presentation/errors/handleError'
import { handleCorsOptions, jsonResponse } from '@/lib/cors'

export async function OPTIONS() {
  return handleCorsOptions()
}

export async function GET() {
  try {
    const dashboardData = await container.stockDashboardUseCase.execute()
    const recentLogs = await container.auditTrailUseCase.getRecentLogs(15)

    return jsonResponse({
      success: true,
      data: {
        summary: {
          totalStock: dashboardData.kpis.totalInStock,
          dispatchedToday: dashboardData.kpis.dispatchedToday,
          expensesToday: dashboardData.kpis.todayExpense,
          damagedStock: dashboardData.kpis.damagedTotal,
          quarantineStock: dashboardData.kpis.quarantineTotal,
        },
        stockBySku: dashboardData.stockBySku,
        stockByBatch: dashboardData.stockByBatch,
        stockByLocation: dashboardData.stockByLocation,
        recentActivity: recentLogs.map((l) => ({
          id: l.id,
          key: `LOG-${l.id}`,
          action: l.action,
          target: l.target_entity,
          entityId: l.entity_id,
          description: l.description,
          by: l.user?.name ?? 'Staff',
          timestamp: l.timestamp,
          time: new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date(l.timestamp).toLocaleDateString(),
        })),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
